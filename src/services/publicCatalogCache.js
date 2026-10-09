import { hotCatalogEdit, hotCatalogMovies } from '../utils/hotCatalog.js';

const allowed = ['Movies', 'Actors', 'Authors', 'Characters', 'Topics', 'Categories', 'CategoryTypes'];
const MAX_AGE = 5 * 60000;

// Only public metadata is cached here. Account, payment, progress and AI memory data never enters this cache.
export function createPublicCatalogCache({ fetchFn = fetch, now = Date.now, storage = null } = {}) {
    const records = new Map();
    const listeners = new Map();
    const indexEdits = new Map();
    const hotEdits = new Map();
    const applyHotEdits = items => hotCatalogMovies(items, Object.fromEntries(hotEdits));
    const applyIndexEdits = (items, acknowledge = true) => {
        const byID = new Map(items.map(item => [item.id, item]));
        for (const [id, edit] of indexEdits) {
            const current = byID.get(id);
            const published = edit.removed ? !current : current && Object.entries(edit.item).every(([field, value]) => current[field] === value);
            if ((acknowledge && published) || now() - edit.at >= 86400000) { indexEdits.delete(id); continue; }
            if (edit.removed) byID.delete(id);
            else if (current || edit.item.name) byID.set(id, { ...current, ...edit.item });
        }
        return [...byID.values()];
    };
    let manifestLoading;
    let manifestAt = 0;
    const json = async url => {
        const response = await fetchFn(url, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`Public catalog HTTP ${response.status}`);
        return response.json();
    };
    const manifest = () => {
        if (now() - manifestAt >= MAX_AGE) { manifestLoading = null; manifestAt = now(); }
        return manifestLoading ||= json('/catalog/manifest.json');
    };
    const load = async name => {
        if (name === 'Hot') {
            const previous = records.get(name);
            if (previous?.items && now() - previous.loadedAt < 60000) return previous.items;
            if (previous?.loading) return previous.loading;
            const loading = (async () => {
                let items;
                try {
                    const result = await json('/api/home-hot');
                    if (!Array.isArray(result.items)) throw new Error('Invalid Hot catalog');
                    for (const [id, edit] of hotEdits) {
                        if (result.items.some(item => item.id === id && item.isHot === true) === edit.isHot) hotEdits.delete(id);
                    }
                    items = applyHotEdits(result.items);
                } catch {
                    const home = previous?.items ? null : await load('Home');
                    items = applyHotEdits(previous?.items || home.movies);
                }
                records.set(name, { items, loadedAt: now() });
                return items;
            })();
            records.set(name, { ...previous, loading }); return loading;
        }
        if (name === 'MovieIndex') {
            const previous = records.get(name);
            if (previous?.items && now() - previous.loadedAt < MAX_AGE) return previous.items;
            if (previous?.loading) return previous.loading;
            const loading = (async () => {
                try {
                    const index = await manifest();
                    if (!/^[a-f0-9]{16}$/.test(index.version)) throw new Error('Invalid public catalog manifest');
                    const result = await json(`/catalog/${index.version}/movie-index.json`);
                    if (result.version !== index.version || !Array.isArray(result.items)) throw new Error('Invalid movie index');
                    const items = applyIndexEdits(result.items);
                    records.set(name, { items, loadedAt: now() }); return items;
                } catch (error) { records.delete(name); if (previous?.items) return previous.items; throw error; }
            })();
            records.set(name, { ...previous, loading }); return loading;
        }
        if (name === 'Home') {
            const previous = records.get(name);
            if (previous?.items && now() - previous.loadedAt < MAX_AGE) return previous.items;
            if (previous?.loading) return previous.loading;
            const loading = (async () => {
                try {
                    const index = await manifest();
                    if (!/^[a-f0-9]{16}$/.test(index.version)) throw new Error('Invalid public catalog manifest');
                    const home = await json(`/catalog/${index.version}/home.json`);
                    if (home.version !== index.version || !Array.isArray(home.movies) || !home.sections) throw new Error('Invalid home catalog');
                    records.set(name, { items: home, loadedAt: now() });
                    return home;
                } catch (error) { records.delete(name); if (previous?.items) return previous.items; throw error; }
            })();
            records.set(name, { ...previous, loading });
            return loading;
        }
        if (!allowed.includes(name)) throw new Error('This collection is not public.');
        const previous = records.get(name);
        if (previous?.items && now() - previous.loadedAt < MAX_AGE) return previous.items;
        if (previous?.loading) return previous.loading;
        const loading = (async () => {
            try {
                const index = await manifest();
                const info = index.collections?.[name];
                if (!/^[a-f0-9]{16}$/.test(index.version) || !info || !Number.isInteger(info.pages) || info.pages < 1 || info.pages > 1000) throw new Error('Invalid public catalog manifest');
                const chunks = [];
                for (let start = 1; start <= info.pages; start += 4) {
                    const group = await Promise.all(Array.from({ length: Math.min(4, info.pages - start + 1) }, (_, offset) => json(`/catalog/${index.version}/${name}-${start + offset}.json`)));
                    for (const chunk of group) {
                        if (chunk.version !== index.version || !Array.isArray(chunk.items)) throw new Error('Mismatched public catalog chunk');
                        chunks.push(...chunk.items);
                    }
                }
                records.set(name, { items: chunks, loadedAt: now() });
                try { const saved = JSON.stringify(chunks); if (saved.length <= 1000000) storage?.setItem(`mfilm-public-${name}`, saved); } catch { /* Large datasets stay in memory/CDN instead of blocking the UI on localStorage. */ }
                return chunks;
            } catch (error) {
                manifestLoading = null;
                const saved = previous?.items || JSON.parse(storage?.getItem(`mfilm-public-${name}`) || 'null');
                if (Array.isArray(saved)) { records.set(name, { items: saved, loadedAt: now() - MAX_AGE + 60000 }); return saved; }
                records.delete(name);
                throw error;
            }
        })();
        records.set(name, { ...previous, loading });
        return loading;
    };
    return { load,
        subscribe(name, callback) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); return () => listeners.get(name)?.delete(callback); },
        patch(name, item, removed = false) {
            if (name === 'Movies') {
                const hotEdit = hotCatalogEdit(item, removed);
                if (hotEdit) {
                    hotEdits.set(item.id, hotEdit);
                    const hot = records.get('Hot');
                    if (Array.isArray(hot?.items)) {
                        const items = applyHotEdits(hot.items);
                        records.set('Hot', { items, loadedAt: now() });
                        for (const callback of listeners.get('Hot') || []) callback(items);
                    }
                }
                // Keep confirmed admin edits visible while the daily CDN publication catches up.
                const fields = Object.fromEntries(['id', 'name', 'otherName', 'slug', 'routeSlug'].filter(field => item[field] !== undefined).map(field => [field, item[field]]));
                if (removed || Object.keys(fields).length > 1) indexEdits.set(item.id, { item: { ...indexEdits.get(item.id)?.item, ...fields }, removed, at: now() });
                const index = records.get('MovieIndex');
                if (Array.isArray(index?.items)) {
                    const items = applyIndexEdits(index.items, false);
                    records.set('MovieIndex', { items, loadedAt: now() });
                    for (const callback of listeners.get('MovieIndex') || []) callback(items);
                }
            }
            const previous = records.get(name);
            if (!Array.isArray(previous?.items)) return;
            const items = previous.items.filter(value => value.id !== item.id);
            if (!removed) items.push({ ...previous.items.find(value => value.id === item.id), ...item });
            records.set(name, { items, loadedAt: now() });
            for (const callback of listeners.get(name) || []) callback(items);
        },
        clear() { records.clear(); indexEdits.clear(); hotEdits.clear(); manifestLoading = null; } };
}

let browserStorage;
try { browserStorage = typeof window === 'undefined' ? null : window.localStorage; } catch { browserStorage = null; }
export const publicCatalogCache = createPublicCatalogCache({ storage: browserStorage });
export function subscribePublicCatalog(name, callback, onError) {
    let active = true;
    const update = () => publicCatalogCache.load(name).then(items => { if (active) callback(items); }).catch(error => { if (active) onError?.(error); });
    update();
    const unsubscribe = publicCatalogCache.subscribe(name, items => { if (active) callback(items); });
    const timer = setInterval(update, MAX_AGE);
    return () => { active = false; clearInterval(timer); unsubscribe(); };
}
