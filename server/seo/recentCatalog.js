import { publicCatalogRecord } from '../../src/utils/publicCatalogFields.js';

async function readUpdates() {
    // This document contains public movie summaries and follows the project's public read rules.
    const response = await fetch('https://firestore.googleapis.com/v1/projects/manhfilm-105b3/databases/(default)/documents/PublicCatalogControls/recent', {
        signal: AbortSignal.timeout(2500),
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Recent catalog HTTP ${response.status}`);
    const document = await response.json();
    return JSON.parse(document.fields?.updatesJson?.stringValue || '[]');
}

export function createRecentCatalogReader({ read = readUpdates, now = Date.now } = {}) {
    let cached = [], loading, retryAt = 0;
    return async () => {
        if (now() >= retryAt) {
            loading ||= read().then(updates => {
                if (!Array.isArray(updates)) throw new Error('Invalid recent catalog');
                cached = updates.filter(update => Number.isFinite(update.at) && update.movie?.id && update.movie.name)
                    .map(update => ({ at: update.at, movie: publicCatalogRecord(update.movie) }));
            }).catch(error => console.warn('Using cached recent catalog:', error.message))
                .finally(() => { retryAt = now() + 60000; loading = null; });
            await loading;
        }
        return cached;
    };
}
export const readRecentCatalog = createRecentCatalogReader();
