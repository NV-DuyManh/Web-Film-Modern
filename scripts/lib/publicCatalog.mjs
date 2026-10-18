import { authorizeCloud } from './cloudAuth.mjs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, orderBy, documentId, limit, startAfter, getDocs, getDoc, doc, where, terminate } from 'firebase/firestore';
import { SITEMAP_COLLECTIONS } from '../../src/utils/sitemap.js';
import { backgroundFirestore } from './backgroundFirestore.mjs';
import { publicCatalogRecord } from '../../src/utils/publicCatalogFields.js';
import { curatedTopics } from '../../src/utils/curatedTopics.js';
import { applyHotFlags } from '../../src/utils/hotCatalog.js';
export { publicCatalogRecord } from '../../src/utils/publicCatalogFields.js';

let database;
let metered;
function publicDocument(document) { return publicCatalogRecord({ ...document.data(), id: document.id }); }
async function getCatalogDatabase() {
    if (!database) {
        const app = getApps().find(item => item.name === 'public-sitemap') || initializeApp({
            projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk',
        }, 'public-sitemap');
        await authorizeCloud(app);
        database = getFirestore(app);
    }
    return database;
}

export async function readPublicCollection(name) {
    const items = [];
    let cursor;
    while (true) {
        const constraints = [orderBy(documentId()), limit(250)];
        if (cursor) constraints.push(startAfter(cursor));
        const request = query(collection(await getCatalogDatabase(), name), ...constraints);
        const snapshot = metered ? await metered.query(request, 250) : await getDocs(request);
        for (const document of snapshot.docs) {
            // Only public catalog fields. Never export account, payment or AI memory collections.
            if (document.data().crawlImportState !== 'pending') items.push(publicDocument(document));
        }
        if (snapshot.size < 250) return items;
        cursor = snapshot.docs.at(-1);
    }
}

export async function readPublicCatalog() {
    const entries = [];
    for (const name of [...Object.keys(SITEMAP_COLLECTIONS), 'Categories', 'CategoryTypes'].filter(name => name !== 'Topics')) entries.push([name, await readPublicCollection(name)]);
    const reference = doc(await getCatalogDatabase(), 'PublicCatalogControls', 'topics');
    const control = metered ? await metered.read(reference) : await getDoc(reference);
    entries.push(['Topics', curatedTopics(control.data()?.enabled)]);
    const homeReference = doc(await getCatalogDatabase(), 'PublicCatalogControls', 'home');
    const homeControl = metered ? await metered.read(homeReference) : await getDoc(homeReference);
    const catalog = Object.fromEntries(entries);
    catalog.Movies = applyHotFlags(catalog.Movies, homeControl.data()?.hot);
    return catalog;
}

export async function enableCatalogBudget() { metered = await backgroundFirestore(await getCatalogDatabase(), { initialReads: 0 }); }

export async function closePublicCatalog() {
    if (database) { try { await metered?.flush(); } finally { await terminate(database); database = null; metered = null; } }
}

// Newly imported films can be discovered before the daily full catalog refresh.
// This bounded lookup reads only the requested public movie, never the full collection.
export async function readPublicMovie(slug) {
    if (typeof slug !== 'string' || slug.length > 200 || slug.includes('/')) return null;
    const db = await getCatalogDatabase();
    if (/^[a-zA-Z0-9]{20}$/.test(slug)) {
        const document = await getDoc(doc(db, 'Movies', slug));
        if (document.exists() && document.data().crawlImportState !== 'pending') return publicDocument(document);
    }
    const result = await getDocs(query(collection(db, 'Movies'), where('slug', '==', slug), limit(1)));
    return result.empty || result.docs[0].data().crawlImportState === 'pending' ? null : publicDocument(result.docs[0]);
}
