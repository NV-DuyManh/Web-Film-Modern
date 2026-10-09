import { catalogPage } from '../src/utils/publicCatalogPage.js';
import { readFile } from 'node:fs/promises';
import { prepareCatalog } from '../server/seo/catalog.js';

export { catalogPage } from '../src/utils/publicCatalogPage.js';

export function createCatalogPageHandler({ readSnapshot = () => readFile(new URL('../server/seo/catalog.json', import.meta.url), 'utf8') } = {}) {
    let catalog;
    return async (req, res) => {
        if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
        try {
            catalog ||= prepareCatalog(JSON.parse(await readSnapshot()).catalog);
            const params = new URL(req.url, 'https://www.mfilm.online').searchParams;
            const result = catalogPage(catalog, params);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('X-Robots-Tag', 'noindex');
            res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=300');
            return res.status(200).end(req.method === 'HEAD' ? '' : JSON.stringify(result));
        } catch (error) {
            res.setHeader('Cache-Control', 'no-store');
            return res.status(error.message === 'Invalid public listing.' ? 400 : 503).end('Public catalog unavailable');
        }
    };
}
export default createCatalogPageHandler();
