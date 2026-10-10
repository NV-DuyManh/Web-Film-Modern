import { curatedTopics } from '../src/utils/curatedTopics.js';
import { withNameRoutes } from '../src/utils/nameRoutes.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { newestMoviesFirst } from '../src/utils/movieRecency.js';
import { prepareCatalog } from '../server/seo/catalog.js';
import { homeCatalog, compactMovies } from '../src/utils/homeCatalog.js';
import { movieIndexRecord } from '../src/utils/publicCatalogFields.js';

export async function buildPublicCatalog() {
    const snapshot = JSON.parse(await readFile(new URL('../server/seo/catalog.json', import.meta.url), 'utf8'));
    const version = createHash('sha256').update('home-index-v4-curated-topics:' + JSON.stringify(snapshot)).digest('hex').slice(0, 16);
    const output = new URL(`../public/catalog/${version}/`, import.meta.url);
    await mkdir(output, { recursive: true });
    const manifest = { version, generatedAt: snapshot.generatedAt, collections: {} };
    for (const name of ['Movies', 'Actors', 'Authors', 'Characters', 'Topics', 'Categories', 'CategoryTypes']) {
        const raw = name === 'Topics' ? curatedTopics(Object.fromEntries((snapshot.catalog.Topics || []).map(topic => [topic.id, topic.enabled]))) : [...(snapshot.catalog[name] || [])];
        let items = ['Movies', 'Actors', 'Authors', 'Characters', 'Topics'].includes(name) ? withNameRoutes(raw, { preferSlug: name === 'Movies', fallback: name === 'Actors' ? 'dien-vien' : 'noi-dung' }) : raw;
        if (name === 'Movies') items.sort(newestMoviesFirst);
        if (name === 'Movies') await writeFile(new URL('movie-index.json', output), JSON.stringify({ version, items: items.map(movieIndexRecord) }));
        if (name === 'Movies') items = compactMovies(items);
        const pages = Math.max(1, Math.ceil(items.length / 250));
        manifest.collections[name] = { total: items.length, pages };
        for (let page = 1; page <= pages; page++) await writeFile(new URL(`${name}-${page}.json`, output), JSON.stringify({ version, items: items.slice((page - 1) * 250, page * 250) }));
    }
    await writeFile(new URL('home.json', output), JSON.stringify({ version, ...homeCatalog(prepareCatalog(snapshot.catalog)) }));
    await writeFile(new URL('../public/catalog/manifest.json', import.meta.url), JSON.stringify(manifest));
    console.log(`Static public catalog: ${version}, ${manifest.collections.Movies.total} movies. No visitor Firestore scans.`);
    return manifest;
}

await buildPublicCatalog();
