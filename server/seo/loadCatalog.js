import { readFile } from 'node:fs/promises';
import { SITE_ORIGIN } from '../../src/utils/seo.js';

// A deployment snapshot makes navigation independent of database availability.
// Once old, refresh through the CDN-cached public endpoint, rather than scanning
// Firestore for each page visit. Never use request headers to construct this URL.
export function createCatalogLoader({ readSnapshot = () => readFile(new URL('./catalog.json', import.meta.url), 'utf8'), fetchCatalog = () => fetch(`${SITE_ORIGIN}/api/public-catalog`, { signal: AbortSignal.timeout(5000) }), now = Date.now } = {}) {
    let snapshot, loading, nextCheck = 0;
    return async () => {
        snapshot ||= JSON.parse(await readSnapshot());
        if (now() >= nextCheck && now() - Date.parse(snapshot.generatedAt) >= 86400000) {
            loading ||= fetchCatalog().then(async response => {
                if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`);
                const result = await response.json();
                if (!Array.isArray(result.catalog?.Movies) || !result.generatedAt) throw new Error('Invalid public catalog');
                snapshot = result;
            }).catch(error => console.error('Using deployment SEO snapshot:', error.message)).finally(() => {
                nextCheck = now() + 3600000;
                loading = null;
            });
            await loading;
        }
        return snapshot.catalog;
    };
}
export const loadSeoCatalog = createCatalogLoader();
