import { writeFile } from 'node:fs/promises';
import { readPublicCatalog, closePublicCatalog } from './lib/publicCatalog.mjs';
import { buildSitemap } from '../src/utils/sitemap.js';

try {
const catalog = await readPublicCatalog();
const xml = buildSitemap(catalog);
await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`Sitemap: ${(xml.match(/<loc>/g) || []).length} URL.`);

} finally { await closePublicCatalog(); }
