import { readFile } from 'node:fs/promises';
import { collection, doc, query, orderBy, documentId, limit, startAfter, Timestamp } from 'firebase/firestore';
import { PUBLIC_COLLECTIONS } from '../../src/utils/publicCatalogFields.js';
import { applyCatalogChanges } from './catalogDelta.mjs';
import { publishCatalog } from './publishCatalog.mjs';

export async function refreshCatalogDelta(db, io) {
    const snapshot = JSON.parse(await readFile(new URL('../../server/seo/catalog.json', import.meta.url), 'utf8'));
    const result = await applyCatalogChanges(snapshot, {
        loadChanges: async (cursor, count) => {
            const constraints = [orderBy('changedAt'), orderBy(documentId()), limit(count)];
            if (cursor) constraints.push(startAfter(new Timestamp(cursor.seconds, cursor.nanoseconds), cursor.id));
            const batch = await io.query(query(collection(db, 'CatalogChanges'), ...constraints), count);
            return batch.docs.map(item => ({ ...item.data(), cursor: { id: item.id, seconds: item.data().changedAt.seconds, nanoseconds: item.data().changedAt.nanoseconds } }));
        },
        readRecord: async (name, id) => { const item = await io.read(doc(db, name, id)); return item.exists() ? item.data() : null; },
    });
    // A small rotating audit catches edits made directly in Firebase Console and
    // refreshes view counts. Its cost stays bounded as the catalog grows.
    let reconcileCursor = snapshot.reconcileCursor || { collection: 0, id: '' };
    if (!result.waiting) {
        try {
            const name = PUBLIC_COLLECTIONS[reconcileCursor.collection] || 'Movies';
            const constraints = [orderBy(documentId()), limit(100)];
            if (reconcileCursor.id) constraints.push(startAfter(reconcileCursor.id));
            const batch = await io.query(query(collection(db, name), ...constraints), 100);
            for (const item of batch.docs) result.apply(name, item.id, item.data());
            reconcileCursor = batch.size < 100
                ? { collection: (reconcileCursor.collection + 1) % PUBLIC_COLLECTIONS.length, id: '' }
                : { collection: reconcileCursor.collection, id: batch.docs.at(-1).id };
        } catch (error) { if (!['background-quota', 'resource-exhausted'].includes(error.code)) throw error; result.waiting = true; }
    }
    const cursorChanged = JSON.stringify(result.changeCursor) !== JSON.stringify(snapshot.changeCursor || null);
    const auditChanged = JSON.stringify(reconcileCursor) !== JSON.stringify(snapshot.reconcileCursor);
    const catalog = result.materialize();
    if (cursorChanged || auditChanged || JSON.stringify(catalog) !== JSON.stringify(snapshot.catalog)) {
        await publishCatalog(catalog, { changeCursor: result.changeCursor, reconcileCursor });
    }
    console.log(JSON.stringify({ incrementalCache: true, processed: result.processed, waiting: result.waiting, movies: catalog.Movies.length, reconcileCursor }));
    return result;
}
