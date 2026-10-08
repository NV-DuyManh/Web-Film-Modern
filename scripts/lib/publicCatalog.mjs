import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, orderBy, documentId, limit, startAfter, getDocs, terminate } from 'firebase/firestore';
import { SITEMAP_COLLECTIONS } from '../../src/utils/sitemap.js';

let database;
function getCatalogDatabase() {
    if (!database) {
        const app = getApps().find(item => item.name === 'public-sitemap') || initializeApp({
            projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk',
        }, 'public-sitemap');
        database = getFirestore(app);
    }
    return database;
}

export async function readPublicCollection(name) {
    const items = [];
    let cursor;
    while (true) {
        const constraints = [orderBy(documentId()), limit(1000)];
        if (cursor) constraints.push(startAfter(cursor));
        const snapshot = await getDocs(query(collection(getCatalogDatabase(), name), ...constraints));
        for (const document of snapshot.docs) {
            const data = document.data();
            items.push({ id: document.id, name: data.name, otherName: data.otherName, title: data.title,
                slug: data.slug, createdAt: data.createdAt, updatedAt: data.updatedAt });
        }
        if (snapshot.size < 1000) return items;
        cursor = snapshot.docs.at(-1);
    }
}

export async function readPublicCatalog() {
    return Object.fromEntries(await Promise.all(Object.keys(SITEMAP_COLLECTIONS).map(async name => [name, await readPublicCollection(name)])));
}

export async function closePublicCatalog() {
    if (database) { await terminate(database); database = null; }
}
