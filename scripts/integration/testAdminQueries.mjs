import { getDocs, getCountFromServer, collection, query, where, orderBy, documentId, limit, startAfter, terminate } from 'firebase/firestore';
import assert from 'node:assert/strict';
import { db } from '../../src/config/firebaseConfig.js';

try {
    const first = await getDocs(query(collection(db, 'Movies'), orderBy(documentId()), limit(20)));
    const second = await getDocs(query(collection(db, 'Movies'), orderBy(documentId()), startAfter(first.docs.at(-1)), limit(20)));
    assert.equal(second.docs.some(item => first.docs.some(other => other.id === item.id)), false);
    const sample = first.docs.find(item => item.data().planID && item.data().status && item.data().releaseYear && item.data().listCategory?.length)?.data();
    assert.ok(sample);
    for (const constraint of [where('planID', '==', sample.planID), where('status', '==', sample.status), where('releaseYear', '==', sample.releaseYear), where('listCategory', 'array-contains', sample.listCategory[0])]) {
        assert.ok(!(await getDocs(query(collection(db, 'Movies'), constraint, orderBy(documentId()), limit(5)))).empty);
    }
    console.log('PASS: disjoint movie pages and all four indexed filter queries.');
    const count = await getCountFromServer(collection(db, 'Movies')).catch(error => ({ unavailable: error.code }));
    console.log(count.unavailable ? `Count optional/unavailable: ${count.unavailable}` : `Catalog total: ${count.data().count}`);
} finally { await terminate(db); }
