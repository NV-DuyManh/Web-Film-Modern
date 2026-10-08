import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, getDocs, collection, terminate } from 'firebase/firestore';

if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8089') throw new Error('Unexpected emulator host');
const project = 'demo-mfilm-sync';
const app = initializeApp({ projectId: project, apiKey: 'demo-test-key' }, 'integration-probe');
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8089);
const prefix = Date.now();
const accountA = { email: `a-${prefix}@example.invalid`, password: 'local-test-password', localId: 'account-a' };
const accountB = { email: `b-${prefix}@example.invalid`, password: 'local-test-password', localId: 'account-b' };
accountA.uid = (await createUserWithEmailAndPassword(auth, accountA.email, accountA.password)).user.uid;
accountB.uid = (await createUserWithEmailAndPassword(auth, accountB.email, accountB.password)).user.uid;
await signOut(auth);
await assert.rejects(getDocs(collection(db, 'Users', accountA.uid, 'WatchProgress')), error => error.code === 'permission-denied');
console.log('PASS: anonymous history access denied by the actual rules');

function client(device) {
    const worker = new Worker(new URL('./integration/resumeClient.mjs', import.meta.url), { workerData: { device, account: accountA } });
    let next = 0;
    const pending = new Map();
    const ready = new Promise((resolve, reject) => {
        worker.on('message', message => {
            if (message.ready) resolve();
            else {
                const request = pending.get(message.id);
                if (!request) return;
                clearTimeout(request.timer); pending.delete(message.id);
                if (message.error) request.reject(new Error(message.error)); else request.resolve(message.value);
            }
        });
        worker.on('error', reject);
    });
    return { worker, ready, command(action, args = {}) {
        return new Promise((resolve, reject) => {
            const id = ++next;
            const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${device} timed out: ${action}`)); }, 20000);
            pending.set(id, { resolve, reject, timer });
            worker.postMessage({ id, action, ...args });
        });
    } };
}
const first = client('device-a');
const second = client('device-b');
async function eventually(device, condition, label) {
    const start = Date.now();
    let last;
    do {
        const value = await device.command('read');
        last = value;
        if (condition(value)) { console.log(`PASS: ${label}`); return value; }
        await new Promise(resolve => setTimeout(resolve, 50));
    } while (Date.now() - start < 15000);
    throw new Error(`Timed out verifying ${label}: ${JSON.stringify(last)}`);
}
try {
    await Promise.all([first.ready, second.ready]);
    await first.command('save', { seconds: 45 });
    await eventually(second, value => value?.episodes?.['ep-one'] === 45, 'position synchronizes to an independent client');
    await Promise.all([first.command('save', { episode: 'ep-one', seconds: 60 }), second.command('save', { episode: 'ep-two', number: 2, seconds: 30 })]);
    await eventually(first, value => value?.episodes?.['ep-one'] === 60 && value?.episodes?.['ep-two'] === 30, 'concurrent writes retain both episodes');
    await second.command('save', { seconds: 10 });
    await eventually(first, value => value?.episodes?.['ep-one'] === 10, 'seeking backward replaces an older position');

    await second.command('offline');
    await second.command('save', { seconds: 100, flush: false });
    await first.command('clear');
    await second.command('online');
    await eventually(second, value => value?.deletedAt > 0 && Object.keys(value.episodes || {}).length === 0, 'deletion wins over stale offline progress');
    await eventually(first, value => Object.keys(value?.episodes || {}).length === 0, 'reconnection does not resurrect deleted history');

    await second.command('save', { seconds: 20 });
    await eventually(first, value => value?.episodes?.['ep-one'] === 20, 'later viewing restores progress after deletion');
    await second.command('offline');
    await second.command('save', { seconds: 90, flush: false });
    await second.command('flush');
    await second.command('online', { event: false });
    await eventually(first, value => value?.episodes?.['ep-one'] === 90, 'failed writes retry without another playback event');

    await second.command('pagehide', { seconds: 96 });
    await eventually(first, value => value?.episodes?.['ep-one'] === 96, 'pagehide flush includes the final position');
    const inFlight = second.command('save', { seconds: 101 });
    await second.command('save', { seconds: 102, flush: false });
    await second.command('logout');
    await inFlight;
    await eventually(first, value => value?.episodes?.['ep-one'] === 102, 'logout flushes before authentication is removed');
    await first.command('restartWithLocalProgress', { seconds: 108 });
    await eventually(first, value => value?.episodes?.['ep-one'] === 108, 'restart retains newer local progress');
    await second.command('login', { account: accountA });
    await eventually(second, value => value?.episodes?.['ep-one'] === 108, 'metadata-only server snapshot uploads progress from cache');
    await second.command('login', { account: accountB });
    assert.equal(await second.command('read'), null);
    assert.equal(await second.command('foreignRead', { uid: accountA.uid }), 'permission-denied');
    await second.command('save', { seconds: 30 });
    assert.equal((await first.command('read')).episodes['ep-one'], 108);
    console.log('PASS: switching accounts never imports or reads another account history');
    console.log('Resume sync integration: all checks passed with two isolated clients and Firebase Auth/Firestore emulators.');
} finally {
    await Promise.allSettled([first.command('stop'), second.command('stop')]);
    await Promise.all([first.worker.terminate(), second.worker.terminate()]);
    await terminate(db);
}
