// Workbox serializes each callback independently: keep them self-contained.
export const assetCachePlugin = {
    cacheWillUpdate: async ({ request, response }) => {
        if (!response || response.status !== 200) return null;
        const path = new URL(request.url).pathname;
        const type = response.headers.get('content-type') || '';
        if (/\.js$/i.test(path) && !/^(?:text|application)\/(?:javascript|ecmascript)\b/i.test(type)) return null;
        if (/\.css$/i.test(path) && !/^text\/css\b/i.test(type)) return null;
        return /^text\/html\b/i.test(type) ? null : response;
    },
    cachedResponseWillBeUsed: async ({ request, cachedResponse }) => {
        if (!cachedResponse || cachedResponse.status !== 200) return null;
        const path = new URL(request.url).pathname;
        const type = cachedResponse.headers.get('content-type') || '';
        if (/\.js$/i.test(path) && !/^(?:text|application)\/(?:javascript|ecmascript)\b/i.test(type)) return null;
        if (/\.css$/i.test(path) && !/^text\/css\b/i.test(type)) return null;
        return /^text\/html\b/i.test(type) ? null : cachedResponse;
    },
};
