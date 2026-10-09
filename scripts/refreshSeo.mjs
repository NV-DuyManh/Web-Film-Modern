import { writeFile } from 'node:fs/promises';
import { readPublicCatalog, closePublicCatalog, enableCatalogBudget } from './lib/publicCatalog.mjs';
import { buildSitemap } from '../src/utils/sitemap.js';

try {
    if (process.argv.includes('--budget')) await enableCatalogBudget();
    const catalog = await readPublicCatalog();
    if (!catalog.Movies?.length) throw new Error('Refusing to replace SEO snapshot with an empty movie catalog');
    const xml = buildSitemap(catalog);
    await writeFile(new URL('../server/seo/catalog.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), catalog }));
    await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml);
    console.log(`Public SEO snapshot refreshed: ${catalog.Movies.length} movies, ${(xml.match(/<loc>/g) || []).length} canonical URLs.`);
} finally { await closePublicCatalog(); }
