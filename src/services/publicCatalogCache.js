const allowed = ['Movies', 'Actors', 'Authors', 'Characters', 'Topics', 'Categories', 'CategoryTypes'];
const MAX_AGE = 5 * 60000;

// Only public metadata is cached here. Account, payment, progress and AI memory data never enters this cache.
export function createPublicCatalogCache({ fetchFn = fetch, now = Date.now, storage = null } = {}) {
    const records = new Map();
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
    return { load, clear() { records.clear(); manifestLoading = null; } };
}

let browserStorage;
try { browserStorage = typeof window === 'undefined' ? null : window.localStorage; } catch { browserStorage = null; }
export const publicCatalogCache = createPublicCatalogCache({ storage: browserStorage });
export function subscribePublicCatalog(name, callback, onError) {
    let active = true;
    const update = () => publicCatalogCache.load(name).then(items => { if (active) callback(items); }).catch(error => { if (active) onError?.(error); });
    update();
    const timer = setInterval(update, MAX_AGE);
    return () => { active = false; clearInterval(timer); };
}
