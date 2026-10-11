import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, arrayUnion, terminate } from 'firebase/firestore';
import { initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { createMovieCommentService } from '../src/services/movieComments.js';
import { buildCommentThreads } from '../src/utils/commentThreads.js';

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8089', 'This test only runs against the local emulator');
const projectId = 'demo-mfilm-comments';
const admin = initializeAdminApp({ projectId });
const clients = ['alice', 'bob'].map(name => {
    const app = initializeApp({ projectId, apiKey: 'demo-test-key' }, name);
    const db = getFirestore(app);
    connectFirestoreEmulator(db, '127.0.0.1', 8089);
    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    return { db, auth, name, service: createMovieCommentService(db) };
});
for (const client of clients) {
    const credential = await createUserWithEmailAndPassword(client.auth, `${client.name}-${Date.now()}@example.invalid`, 'test-password-only');
    await getAdminAuth(admin).setCustomUserClaims(credential.user.uid, { userId: client.name });
    await credential.user.getIdToken(true);
}
const [a, b] = clients;
const user = { id: 'alice', name: 'Alice', avatarUrl: '', password: 'must-not-be-public', email: 'private@example.invalid' };
const parent = await a.service.post({ movieID: 'movie-a', user, text: 'A real comment', plan: { name: 'Plus', level: 2 } });
assert.equal(parent.author.planName, 'Plus');
assert.equal(parent.author.password, undefined);
assert.equal(parent.author.email, undefined);
await Promise.all([a.service.setLiked(parent.id, 'alice', true), b.service.setLiked(parent.id, 'bob', true)]);
await a.service.setLiked(parent.id, 'alice', true);
let saved = (await getDoc(doc(a.db, 'Comments', parent.id))).data();
assert.deepEqual([...saved.likedBy].sort(), ['alice', 'bob']);
await a.service.setLiked(parent.id, 'alice', false);
saved = (await getDoc(doc(a.db, 'Comments', parent.id))).data();
assert.deepEqual(saved.likedBy, ['bob']);
const reply = await b.service.post({ movieID: 'movie-a', user: { id: 'bob', name: 'Bob' }, text: 'Reply from another account', parent, plan: { name: 'Basic', level: 1 } });
const nested = await a.service.post({ movieID: 'movie-a', user, text: 'Reply to Bob', parent: reply });
await a.service.post({ movieID: 'movie-b', user, text: 'Different film' });
const rows = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { unsubscribe(); reject(new Error('Movie-scoped listener timed out')); }, 10000);
    const unsubscribe = a.service.subscribe('movie-a', items => {
        if (items.length === 3) { clearTimeout(timeout); unsubscribe(); resolve(items); }
    }, reject);
});
assert.equal(rows.some(row => row.movieID !== 'movie-a'), false);
assert.deepEqual(buildCommentThreads(rows)[0].replies.map(row => row.id), [reply.id, nested.id]);
await assert.rejects(a.service.post({ movieID: 'movie-b', user, text: 'Wrong parent', parent }), /COMMENT_PARENT_MISSING/);
await assert.rejects(a.service.post({ movieID: 'movie-a', user, text: 'Missing parent', parent: { id: 'missing' } }), /COMMENT_PARENT_MISSING/);
if (process.env.TEST_SECURE_COMMENT_RULES === 'true') {
    await assert.rejects(updateDoc(doc(b.db, 'Comments', parent.id), { description: 'Edit another user' }), error => error.code === 'permission-denied');
    await assert.rejects(updateDoc(doc(b.db, 'Comments', parent.id), { likedBy: arrayUnion('fake-account') }), error => error.code === 'permission-denied');
    await assert.rejects(setDoc(doc(b.db, 'Comments', 'forged'), { userID: 'alice', movieID: 'movie-a' }), error => error.code === 'permission-denied');
    // A comment author may edit their text without replacing other people's likes.
    await updateDoc(doc(a.db, 'Comments', parent.id), { description: 'Updated own text' });
    await assert.rejects(updateDoc(doc(a.db, 'Comments', parent.id), { likedBy: [] }), error => error.code === 'permission-denied');
}
const reloaded = await getAdminFirestore(admin).doc(`Comments/${parent.id}`).get();
assert.deepEqual(reloaded.data().likedBy, ['bob']);
console.log('PASS: persisted comments/replies, concurrent likes, idempotent likes/unlikes, movie isolation and public author fields');
if (process.env.TEST_SECURE_COMMENT_RULES === 'true') console.log('PASS: future secure rules restrict likes to the signed-in account and reject forged edits');
for (const client of clients) await terminate(client.db);
process.exit(0);
