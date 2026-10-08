import assert from 'node:assert/strict';
import { doc, getDoc, getDocs, query, where, collection, setDoc, deleteDoc, terminate, Timestamp } from 'firebase/firestore';
import { db } from '../../src/config/firebaseConfig.js';
import { moveToAdminTrash, restoreAdminTrash } from '../../src/services/adminOperations.js';

// Only disposable records in this named QA collection are touched. Never use a
// user, movie, payment, or existing application record as a test fixture.
const collectionName = 'AdminVerificationFixtures';
const id = `qa-${Date.now()}`;
const ref = doc(db, collectionName, id);
let groupID;
try {
    const original = { name: 'Disposable admin restore check', nested: { retained: true }, count: 7, createdAt: Date.now(), expiresAt: Timestamp.fromMillis(Date.now() + 60000) };
    await setDoc(ref, original);
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
    console.log('PASS: archive before delete, preserve original fields, refuse collision, restore and clean up group.');
} finally {
    await deleteDoc(ref).catch(() => {});
    if (groupID) {
        const archives = await getDocs(query(collection(db, 'AdminTrash'), where('groupID', '==', groupID))).catch(() => null);
        for (const item of archives?.docs || []) await deleteDoc(item.ref);
        await deleteDoc(doc(db, 'AdminTrashGroups', groupID)).catch(() => {});
    }
    await terminate(db);
}
