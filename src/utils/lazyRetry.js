import { lazy } from 'react';

export function isChunkLoadError(error) {
    return error?.name === 'ChunkLoadError' || /dynamically imported module|Loading chunk|Failed to fetch|module script/i.test(error?.message || '');
}

export async function retryImport(componentImport, retries = 3, interval = 1000) {
    for (let attempt = 0; ; attempt++) {
        try { return await componentImport(); }
        catch (error) {
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, interval));
                continue;
            }
            if (typeof window !== 'undefined' && isChunkLoadError(error)) {
                const reloadKey = `chunk_retry_${window.location.pathname}`;
                try {
                    if (!sessionStorage.getItem(reloadKey)) {
                        sessionStorage.setItem(reloadKey, 'true');
                        window.location.reload();
                        // Navigation replaces the document; avoid flashing an error while it loads.
                        return new Promise(() => {});
                    }
                } catch { /* Storage or navigation unavailable: show the retry UI. */ }
            }
            throw error;
        }
    }
}

export function lazyRetry(componentImport, retries = 3, interval = 1000) {
    return lazy(() => retryImport(componentImport, retries, interval));
}
export default lazyRetry;
