// These endpoints contain public metadata only. Never cache accounts, streams,
// payments, watch history, AI responses or activity POSTs here.
const PUBLIC_URLS = new Set(['/api/home-hot', '/api/topics', '/api/daily-ranking', '/api/public-catalog?updates=1']);
function browserStorage() { try { return globalThis.localStorage; } catch { return null; } }

export function createPublicRequestCache({ fetchFn = globalThis.fetch?.bind(globalThis), now = Date.now,
    storage = null, locks = null, maxStoredBytes = 100000 } = {}) {
    const entries = new Map();
    return {
        read(url, { maxAgeMs = 60000, timeoutMs = 7000, accept = () => true } = {}) {
            if (!PUBLIC_URLS.has(url)) return Promise.reject(new Error('Only approved public metadata can be shared'));
            const key = `mfilm-public-request:${url}`;
            const fresh = entry => entry && Number.isFinite(entry.at) && now() >= entry.at
                && now() - entry.at < maxAgeMs && accept(entry.data);
            const cached = entries.get(url);
            if (fresh(cached)) return Promise.resolve(cached.data);
            if (cached?.loading) return cached.loading;
            const read = async () => {
                try {
                    const saved = JSON.parse(storage?.getItem(key) || 'null');
                    if (fresh(saved)) { entries.set(url, saved); return saved.data; }
                } catch { /* Browser storage is optional, including in private mode. */ }
                const response = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) });
                if (!response.ok) throw new Error(`Public metadata HTTP ${response.status}`);
                const data = await response.json();
                if (!accept(data)) throw new Error('Invalid public metadata');
                const entry = { at: now(), data };
                entries.set(url, entry);
                try {
                    const serialized = JSON.stringify(entry);
                    if (serialized.length * 2 <= maxStoredBytes) storage?.setItem(key, serialized);
                    else storage?.removeItem(key);
                } catch { /* Large payloads stay in memory, without blocking on disk storage. */ }
                return data;
            };
            // Web Locks rechecks the stored result after another tab finishes.
            // Unsupported browsers still coalesce concurrent calls in this tab.
            const loading = Promise.resolve().then(async () => {
                if (!locks) return read();
                let entered = false;
                try { return await locks.request(key, () => { entered = true; return read(); }); }
                catch (error) { if (entered) throw error; return read(); }
            }).catch(error => {
                if (entries.get(url)?.loading === loading) entries.delete(url);
                throw error;
            });
            entries.set(url, { ...cached, loading });
            return loading;
        },
    };
}

export const publicRequestCache = createPublicRequestCache({ storage: browserStorage(), locks: globalThis.navigator?.locks });
