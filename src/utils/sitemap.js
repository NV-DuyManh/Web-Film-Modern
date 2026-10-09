import { prepareCatalog, indexableCatalogPaths } from '../../server/seo/catalog.js';
import { SITE_ORIGIN, publicImage } from './seo.js';

export const SITEMAP_COLLECTIONS = {
    Movies: '/phim', Actors: '/dien-vien', Authors: '/tac-gia', Characters: '/nhan-vat', Topics: '/topic',
};
const escapeXml = value => String(value).replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);

export function buildSitemap(catalog, origin = SITE_ORIGIN) {
    const prepared = prepareCatalog(catalog);
    const entries = new Map(indexableCatalogPaths(prepared).map(path => [path, { lastmod: null }]));
    for (const collection of Object.keys(SITEMAP_COLLECTIONS)) {
        for (const item of prepared.catalog[collection]) {
            if (!entries.has(item.publicPath)) continue;
            const rawDate = item.updatedAt || item.createdAt;
            const date = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate?.seconds ? rawDate.seconds * 1000 : rawDate);
            entries.set(item.publicPath, {
                lastmod: Number.isFinite(date.getTime()) ? date.toISOString() : null,
                image: collection === 'Movies' && item.imgUrl && !item.imgUrl.includes('/assets/') ? publicImage(item.imgUrl) : null,
            });
        }
    }
    if (entries.size > 50000) throw new Error('Sitemap requires splitting before exceeding 50,000 URLs');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- generatedAt: ${new Date().toISOString()} -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${[...entries].map(([path, { lastmod, image }]) => `  <url><loc>${escapeXml(origin.replace(/\/$/, '') + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${image ? `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>` : ''}</url>`).join('\n')}\n</urlset>\n`;
}
