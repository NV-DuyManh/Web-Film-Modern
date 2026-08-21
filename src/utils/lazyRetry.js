import { lazy } from 'react';

/**
 * lazyRetry - Automatically retries failed dynamic imports (chunks) with backoff.
 * If all retries fail (e.g. after a new deployment with old cache),
 * it performs a one-time automatic page reload to fetch the latest assets
 * without throwing an immediate ErrorBoundary crash screen to the user.
 *
 * @param {Function} componentImport - The dynamic import function, e.g. () => import('./Page')
 * @param {number} retries - Number of retries before falling back (default 3)
 * @param {number} interval - Delay between retries in milliseconds (default 1000)
 */
export function lazyRetry(componentImport, retries = 3, interval = 1000) {
    return lazy(() => {
        return new Promise((resolve, reject) => {
            const attempt = (retriesLeft) => {
                componentImport()
                    .then(resolve)
                    .catch((error) => {
                        const isChunkError =
                            error?.message?.includes('dynamically imported module') ||
                            error?.message?.includes('Loading chunk') ||
                            error?.message?.includes('Failed to fetch') ||
                            error?.name === 'ChunkLoadError';

                        if (retriesLeft > 0) {
                            setTimeout(() => {
                                attempt(retriesLeft - 1);
                            }, interval);
                        } else {
                            if (typeof window !== 'undefined' && isChunkError) {
                                const reloadKey = `chunk_retry_${window.location.pathname}`;
                                const hasReloaded = sessionStorage.getItem(reloadKey);

                                if (!hasReloaded) {
                                    sessionStorage.setItem(reloadKey, 'true');
                                    window.location.reload();
                                    return;
                                }
                            }
                            reject(error);
                        }
                    });
            };

            attempt(retries);
        });
    });
}

export default lazyRetry;
