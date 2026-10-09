import { readFile } from 'node:fs/promises';

export const config = { maxDuration: 60 };
export function createPublicCatalogHandler({ readSnapshot = () => readFile(new URL('../server/seo/catalog.json', import.meta.url), 'utf8'), readCatalog, now = Date.now } = {}) {
    let cached, loading, retryAt = 0;
    return async (req, res) => {
        if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
        cached ||= JSON.parse(await readSnapshot());
        let stale = now() - Date.parse(cached.generatedAt) >= 86400000;
        // Scheduled, budgeted jobs refresh deployment snapshots. Page visits never scan Firestore.
        if (readCatalog && stale && now() >= retryAt && req.method !== 'HEAD') {
            loading ||= readCatalog().then(catalog => {
                cached = { generatedAt: new Date(now()).toISOString(), catalog };
                stale = false;
            }).catch(error => {
                console.error('Public SEO catalog refresh unavailable:', error.message);
                retryAt = now() + 3600000;
            }).finally(() => { loading = null; });
            await loading;
            stale = now() - Date.parse(cached.generatedAt) >= 86400000;
        }
        const seconds = stale ? 300 : Math.max(60, Math.floor((Date.parse(cached.generatedAt) + 86400000 - now()) / 1000));
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('X-Robots-Tag', 'noindex');
        res.setHeader('Cache-Control', `public, max-age=60, s-maxage=${seconds}, stale-while-revalidate=3600`);
        return res.status(200).end(req.method === 'HEAD' ? '' : JSON.stringify(cached));
    };
}
export default createPublicCatalogHandler();
