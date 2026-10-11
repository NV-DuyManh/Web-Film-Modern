import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, getDoc, doc, terminate } from 'firebase/firestore';
import { createUserPresenceService } from '../src/services/userPresence.js';
import { onlineUserIds, PRESENCE_TTL_MS } from '../src/utils/userPresence.js';

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8089', 'Local emulator required');
const projectId = 'demo-mfilm-presence';
const clients = ['device-one', 'device-two', 'admin-reader'].map(name => {
    const app = initializeApp({ projectId, apiKey: 'demo-key' }, name);
    const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8089);
    return { db, service: createUserPresenceService(db) };
});
const [one, two, admin] = clients;
let snapshots = [];
const off = admin.service.subscribe((rows, confirmed) => { if (confirmed) snapshots = rows; }, error => { throw error; });
const eventually = async predicate => { for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 25)); } assert.fail('Presence listener did not reach expected state'); };

await Promise.all([one.service.open('alice', 'tab-one'), two.service.open('alice', 'tab-two')]);
await eventually(() => snapshots.some(row => Object.keys(row.sessions || {}).length === 2));
assert.deepEqual([...onlineUserIds(snapshots)], ['alice']);
await one.service.close('alice', 'tab-one');
await eventually(() => snapshots.some(row => Object.keys(row.sessions || {}).length === 1));
assert.deepEqual([...onlineUserIds(snapshots)], ['alice']);
await two.service.close('alice', 'tab-two');
await eventually(() => snapshots.some(row => Object.keys(row.sessions || {}).length === 0));
assert.equal(onlineUserIds(snapshots).size, 0);

const expired = createUserPresenceService(one.db, () => Date.now() - PRESENCE_TTL_MS - 1000);
await expired.touch('bob', 'closed-tab');
await eventually(() => snapshots.some(row => row.userID === 'bob'));
assert.equal(onlineUserIds(snapshots).has('bob'), false);
await two.service.open('bob', 'new-tab');
const bob = (await getDoc(doc(admin.db, 'UserPresence', 'bob'))).data();
assert.deepEqual(Object.keys(bob.sessions), ['new-tab']);
assert.equal(bob.email, undefined); assert.equal(bob.password, undefined);
await eventually(() => onlineUserIds(snapshots).has('bob'));
assert.equal(onlineUserIds(snapshots, Date.now() + PRESENCE_TTL_MS + 1000).size, 0);
off();
for (const client of clients) await terminate(client.db);
console.log('PASS: concurrent tabs, live updates, last-tab logout, expired heartbeat rejection, stale lease cleanup and no private account fields');
