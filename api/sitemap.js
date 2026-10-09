import { readFile } from 'node:fs/promises';
import { loadSeoCatalog } from '../server/seo/loadCatalog.js';
import { buildSitemap } from '../src/utils/sitemap.js';

export const config = { maxDuration: 60 };

export function createSitemapHandler({ readCatalog = loadSeoCatalog,
    readSnapshot = () => readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8'), now = Date.now } = {}) {
    let cached;
    let expiresAt = 0;
    let loading;
    return async function handler(req, res) {
        if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
        try {
            if (!cached) {
                try {
                    cached = await readSnapshot();
                    const generated = Date.parse(cached.match(/generatedAt: ([^ ]+)/)?.[1] || '');
                    expiresAt = Number.isFinite(generated) ? generated + 86400000 : 0;
                } catch { /* Cold start without a snapshot: generate from the catalog. */ }
            }
            if (now() >= expiresAt && !(req.method === 'HEAD' && cached)) {
                loading ||= readCatalog().then(catalog => {
                    cached = buildSitemap(catalog);
                    expiresAt = now() + 86400000;
                }).finally(() => { loading = null; });
                await loading;
            }
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
            return res.status(200).end(req.method === 'HEAD' ? '' : cached);
        } catch (error) {
            console.error('Sitemap generation failed:', error.message);
            if (cached) {
                expiresAt = now() + 3600000;
                res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600');
                return res.status(200).end(req.method === 'HEAD' ? '' : cached);
            }
            res.setHeader('Retry-After', '60');
            return res.status(503).end('Sitemap temporarily unavailable');
        }
    };
}
export default createSitemapHandler();
