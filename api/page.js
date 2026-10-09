import { readFile } from 'node:fs/promises';
import { prepareCatalog, resolvePublicPage } from '../server/seo/catalog.js';
import { renderPageHtml } from '../server/seo/render.js';
import { loadSeoCatalog } from '../server/seo/loadCatalog.js';

export const config = { maxDuration: 15 };
export function createPageHandler({ readTemplate = () => readFile(new URL('../dist/index.html', import.meta.url), 'utf8'), readCatalog = loadSeoCatalog, lookupMovie = async () => null } = {}) {
    let template, prepared, lastCatalog;
    const missingMovies = new Map();
    return async (req, res) => {
        if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        try {
            const [html, catalog] = await Promise.all([template ? Promise.resolve(template) : readTemplate(), readCatalog()]);
            template = html;
            if (catalog !== lastCatalog) { prepared = prepareCatalog(catalog); lastCatalog = catalog; }
            // The rewrite carries the original path explicitly; req.url can be /api/page
            // on some hosting runtimes. Ignore arbitrary external origins.
            const incoming = new URL(req.url, 'https://www.mfilm.online');
            const originalPath = req.query?.path || incoming.searchParams.get('path') || incoming.pathname;
            const query = new URLSearchParams(incoming.searchParams);
            query.delete('path');
            const path = `${originalPath.startsWith('/') ? originalPath : `/${originalPath}`}${query.size ? `?${query}` : ''}`;
            let page = resolvePublicPage(path, prepared);
            const slugMatch = path.match(/^\/phim\/([^/?]+)(?:\?|$)/);
            let lookupSlug;
            try { lookupSlug = slugMatch && decodeURIComponent(slugMatch[1]); } catch { /* A malformed URL is a real 404. */ }
            if (page.status === 404 && lookupSlug && (missingMovies.get(slugMatch[1]) || 0) < Date.now()) {
                const movie = await lookupMovie(lookupSlug);
                if (movie) {
                    prepared = prepareCatalog({ ...prepared.catalog, Movies: [...prepared.catalog.Movies.filter(item => item.id !== movie.id), movie] });
                    page = resolvePublicPage(path, prepared);
                } else {
                    if (missingMovies.size >= 500) missingMovies.delete(missingMovies.keys().next().value);
                    missingMovies.set(slugMatch[1], Date.now() + 300000);
                }
            }
            if (page.redirect) {
                res.setHeader('Location', page.redirect);
                return res.status(308).end();
            }
            res.setHeader('X-Robots-Tag', page.robots);
            return res.status(page.status).end(req.method === 'HEAD' ? '' : renderPageHtml(template, page));
        } catch (error) {
            console.error('Public page rendering failed:', error.message);
            // A transient catalog/template failure is retryable, never a false 404.
            res.setHeader('Retry-After', '60');
            res.setHeader('X-Robots-Tag', 'noindex');
            return res.status(503).end('MFILM đang tải lại dữ liệu. Vui lòng thử lại sau ít phút.');
        }
    };
}
export default createPageHandler({ lookupMovie: async slug => {
    let timer;
    try {
        return await Promise.race([
            import('../scripts/lib/publicCatalog.mjs').then(module => module.readPublicMovie(slug)),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Movie lookup timed out')), 4000); }),
        ]);
    } finally { clearTimeout(timer); }
} });
