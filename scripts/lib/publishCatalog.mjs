import { writeFile } from 'node:fs/promises';
import { buildSitemap } from '../../src/utils/sitemap.js';
import { publicCatalogRecord } from './publicCatalog.mjs';

export async function publishCatalog(catalog) {
    const publicCatalog = Object.fromEntries(['Movies', 'Actors', 'Authors', 'Characters', 'Topics', 'Categories', 'CategoryTypes'].map(name => [name,
        (catalog[name] || []).filter(item => item.crawlImportState !== 'pending').map(publicCatalogRecord)]));
    if (!publicCatalog.Movies.length) throw new Error('Refusing an empty public cache.');
    const snapshot = { generatedAt: new Date().toISOString(), catalog: publicCatalog };
    await writeFile(new URL('../../server/seo/catalog.json', import.meta.url), JSON.stringify(snapshot));
    await writeFile(new URL('../../public/sitemap.xml', import.meta.url), buildSitemap(publicCatalog));
}
