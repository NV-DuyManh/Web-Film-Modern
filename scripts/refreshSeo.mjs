import { authorizeCloud } from './lib/cloudAuth.mjs';
import { writeFile } from 'node:fs/promises';
import { readPublicCatalog, closePublicCatalog, enableCatalogBudget } from './lib/publicCatalog.mjs';
import { buildSitemap } from '../src/utils/sitemap.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, terminate } from 'firebase/firestore';
import { backgroundFirestore } from './lib/backgroundFirestore.mjs';
import { refreshCatalogDelta } from './lib/refreshCatalogDelta.mjs';

if (process.argv.includes('--incremental')) {
    const app = initializeApp({ projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk' }, 'catalog-delta');
    await authorizeCloud(app);
    const db = getFirestore(app);
    let io;
    try { io = await backgroundFirestore(db, { initialReads: 0 }); await refreshCatalogDelta(db, io); }
    finally { try { await io?.flush(); } finally { await terminate(db); } }
} else {
try {
    if (process.argv.includes('--budget')) await enableCatalogBudget();
    const catalog = await readPublicCatalog();
    if (!catalog.Movies?.length) throw new Error('Refusing to replace SEO snapshot with an empty movie catalog');
    const xml = buildSitemap(catalog);
    await writeFile(new URL('../server/seo/catalog.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), catalog }));
    await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml);
    console.log(`Public SEO snapshot refreshed: ${catalog.Movies.length} movies, ${(xml.match(/<loc>/g) || []).length} canonical URLs.`);
} finally { await closePublicCatalog(); }
}
