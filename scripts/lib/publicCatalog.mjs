import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, orderBy, documentId, limit, startAfter, getDocs, getDoc, doc, where, terminate } from 'firebase/firestore';
import { SITEMAP_COLLECTIONS } from '../../src/utils/sitemap.js';

let database;
const PUBLIC_FIELDS = ['name', 'otherName', 'title', 'slug', 'createdAt', 'updatedAt', 'description',
    'imgUrl', 'bannerUrl', 'avatar', 'releaseYear', 'year', 'duration', 'time', 'endEpisode',
    'hasSub', 'hasDub', 'hasVoice', 'countriesID', 'listCategory', 'categoryTypeID', 'status',
    'actor', 'actors', 'listActor', 'author', 'listAuthor', 'character', 'characters',
    'listCharacter', 'sexID', 'movieID', 'isSmart', 'smartID', 'views', 'totalEpisodes'];
function publicDocument(document) {
    const data = document.data();
    return { id: document.id, ...Object.fromEntries(PUBLIC_FIELDS.filter(key => data[key] !== undefined).map(key => [key, data[key]])) };
}
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
            // Only public catalog fields. Never export account, payment or AI memory collections.
            items.push(publicDocument(document));
        }
        if (snapshot.size < 1000) return items;
        cursor = snapshot.docs.at(-1);
    }
}

export async function readPublicCatalog() {
    return Object.fromEntries(await Promise.all([...Object.keys(SITEMAP_COLLECTIONS), 'Categories', 'CategoryTypes'].map(async name => [name, await readPublicCollection(name)])));
}

export async function closePublicCatalog() {
    if (database) { await terminate(database); database = null; }
}

// Newly imported films can be discovered before the daily full catalog refresh.
// This bounded lookup reads only the requested public movie, never the full collection.
export async function readPublicMovie(slug) {
    if (typeof slug !== 'string' || slug.length > 200 || slug.includes('/')) return null;
    if (/^[a-zA-Z0-9]{20}$/.test(slug)) {
        const document = await getDoc(doc(getCatalogDatabase(), 'Movies', slug));
        if (document.exists()) return publicDocument(document);
    }
    const result = await getDocs(query(collection(getCatalogDatabase(), 'Movies'), where('slug', '==', slug), limit(1)));
    return result.empty ? null : publicDocument(result.docs[0]);
}
