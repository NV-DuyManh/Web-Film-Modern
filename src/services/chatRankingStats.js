const cache = new Map();
export async function loadChatRankingStats(kind, { signal } = {}) {
    if (!['favorites', 'ratings'].includes(kind)) return {};
    const existing = cache.get(kind);
    let promise = existing && Date.now() - existing.at < 60000 ? existing.promise : null;
    if (!promise) {
        const request = (async () => {
            const response = await fetch(`/api/chat-rankings?type=${kind}`, { signal: AbortSignal.timeout(12000) });
            if (!response.ok) throw new Error('ranking-unavailable');
            return response.json();
        })();
        promise = request.catch(() => { cache.delete(kind); throw new Error('ranking-unavailable'); });
        cache.set(kind, { at: Date.now(), promise });
    }
    return new Promise((resolve, reject) => {
        const finish = (error, value) => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
            if (error) reject(error); else resolve(value);
        };
        const abort = () => finish(new DOMException('Chat cancelled', 'AbortError'));
        const timer = setTimeout(() => finish(new Error('ranking-timeout')), 12000);
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) abort();
        promise.then(value => finish(null, value), error => finish(error));
    });
}
