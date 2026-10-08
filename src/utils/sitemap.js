import { createNameRouteIndex } from './nameRoutes.js';

export const SITEMAP_COLLECTIONS = {
    Movies: '/phim', Actors: '/dien-vien', Authors: '/tac-gia', Characters: '/nhan-vat', Topics: '/topic',
};
const STATIC_PATHS = ['/', '/singleMovies', '/series', '/actors', '/showtimes', '/topic', '/film-new', '/cinema-movies', '/film-coming', '/film-hongkong', '/anime'];
const escapeXml = value => String(value).replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);

export function buildSitemap(catalog, origin = 'https://mfilm.online') {
    const entries = new Map(STATIC_PATHS.map(path => [path, null]));
    for (const [collection, prefix] of Object.entries(SITEMAP_COLLECTIONS)) {
        const items = catalog[collection] || [];
        const index = createNameRouteIndex(items, { preferSlug: collection === 'Movies', fallback: collection === 'Actors' ? 'dien-vien' : 'noi-dung' });
        for (const item of items) {
            if (!item.name && !item.otherName && !item.title && !item.slug) continue;
            const rawDate = item.updatedAt || item.createdAt;
            const date = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate?.seconds ? rawDate.seconds * 1000 : rawDate);
            entries.set(index.path(prefix, item), Number.isFinite(date.getTime()) ? date.toISOString() : null);
        }
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- generatedAt: ${new Date().toISOString()} -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...entries].map(([path, lastmod]) => `  <url><loc>${escapeXml(origin.replace(/\/$/, '') + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
}
