import assert from 'node:assert/strict';
import { doc, getDoc, getDocs, query, where, collection, setDoc, deleteDoc, terminate, Timestamp } from 'firebase/firestore';
import { db } from '../../src/config/firebaseConfig.js';
import { moveToAdminTrash, restoreAdminTrash, recordAdminAction } from '../../src/services/adminOperations.js';

// Only disposable records in this named QA collection are touched. Never use a
// user, movie, payment, or existing application record as a test fixture.
const collectionName = 'AdminVerificationFixtures';
const id = `qa-${Date.now()}`;
const ref = doc(db, collectionName, id);
let groupID;
// Test the existing actor adapter without credentials or real user records.
globalThis.localStorage = { getItem: () => JSON.stringify({ id: 'qa-verification', name: 'QA verification', role: 'admin' }) };
globalThis.window = new EventTarget();
try {
    const original = { name: 'Disposable admin restore check', nested: { retained: true }, count: 7, createdAt: Date.now(), expiresAt: Timestamp.fromMillis(Date.now() + 60000) };
    await setDoc(ref, original);
    await recordAdminAction('create', collectionName, { id, name: original.name, password: 'synthetic-test-value', token: 'synthetic-test-value', count: original.count });
    const audit = await getDocs(query(collection(db, 'AdminActivity'), where('entityID', '==', id)));
    assert.equal(audit.size, 1);
    assert.equal(audit.docs[0].data().action, 'create');
    assert.deepEqual(audit.docs[0].data().fields, ['name', 'count']);
    assert.equal(JSON.stringify(audit.docs[0].data()).includes('synthetic-test-value'), false);
    groupID = await moveToAdminTrash(collectionName, { id });
    assert.equal((await getDoc(ref)).exists(), false);
    assert.equal((await getDoc(doc(db, 'AdminTrashGroups', groupID))).data().status, 'ready');
    // A recreated record must block restoration, never be overwritten.
    await setDoc(ref, { name: 'Collision sentinel' });
    await assert.rejects(restoreAdminTrash(groupID), /Trùng dữ liệu/);
    assert.equal((await getDoc(ref)).data().name, 'Collision sentinel');
    await deleteDoc(ref);
    await restoreAdminTrash(groupID);
    assert.deepEqual((await getDoc(ref)).data(), original);
    assert.equal((await getDoc(doc(db, 'AdminTrashGroups', groupID))).exists(), false);
    assert.equal((await getDocs(query(collection(db, 'AdminTrash'), where('groupID', '==', groupID)))).empty, true);
    console.log('PASS: audit without secret values, archive before delete, preserve timestamps/fields, refuse collision, restore and clean up group.');
} finally {
    await deleteDoc(ref).catch(() => {});
    if (groupID) {
        const archives = await getDocs(query(collection(db, 'AdminTrash'), where('groupID', '==', groupID))).catch(() => null);
        for (const item of archives?.docs || []) await deleteDoc(item.ref);
        await deleteDoc(doc(db, 'AdminTrashGroups', groupID)).catch(() => {});
    }
    const audit = await getDocs(query(collection(db, 'AdminActivity'), where('entityID', '==', id))).catch(() => null);
    for (const item of audit?.docs || []) await deleteDoc(item.ref);
    delete globalThis.window;
    delete globalThis.localStorage;
    await terminate(db);
}
