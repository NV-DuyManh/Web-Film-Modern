import { readRecentCatalog } from '../server/seo/recentCatalog.js';

export function createCatalogUpdatesHandler({ readUpdates = readRecentCatalog } = {}) {
    return async (req, res) => {
        if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
        const updates = await readUpdates();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, must-revalidate');
        res.setHeader('X-Robots-Tag', 'noindex');
        return res.status(200).end(req.method === 'HEAD' ? '' : JSON.stringify({ updates }));
    };
}
export default createCatalogUpdatesHandler();
