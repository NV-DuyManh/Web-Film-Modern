import { parentPort, workerData } from 'node:worker_threads';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, disableNetwork, enableNetwork, getDoc, doc, terminate } from 'firebase/firestore';
import { startResumeSync, flushActiveResumeSync } from '../../src/services/resumeSyncService.js';
import { saveResume, clearResume, getResume, getResumeStore } from '../../src/utils/watchHistory.js';

// Each worker has its own browser-like storage and module state: no shared local cache can mask sync failures.
const local = new Map();
globalThis.localStorage = { getItem: key => local.get(key) ?? null, setItem: (key, value) => local.set(key, value) };
globalThis.window = new EventTarget();
globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });

const app = initializeApp({ projectId: 'demo-mfilm-sync', apiKey: 'demo-test-key' }, workerData.device);
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8089);
let localId;
let stop;
async function login(account) {
    if (stop) { await flushActiveResumeSync(); stop(); }
    await signOut(auth);
    const credential = await signInWithEmailAndPassword(auth, account.email, account.password);
    localId = account.localId;
    stop = startResumeSync(localId, credential.user.uid, { database: db, writeDelayMs: 60000, retryDelayMs: 500 });
}
await login(workerData.account);
parentPort.postMessage({ ready: true });

parentPort.on('message', async ({ id, action, ...args }) => {
    try {
        let value;
        if (action === 'save') {
            saveResume(args.movie || 'test-movie', { episodeId: args.episode || 'ep-one', episodeNumber: args.number || 1, seconds: args.seconds }, localId);
            if (args.flush !== false) await stop.flush();
        } else if (action === 'clear') {
            clearResume(args.movie || 'test-movie', null, localId);
            await stop.flush();
        } else if (action === 'read') value = getResume(args.movie || 'test-movie', localId);
        else if (action === 'store') value = getResumeStore(localId);
        else if (action === 'offline') { navigator.onLine = false; await disableNetwork(db); }
        else if (action === 'online') {
            await enableNetwork(db); navigator.onLine = true;
            if (args.event !== false) window.dispatchEvent(new Event('online'));
        } else if (action === 'flush') await stop.flush();
        else if (action === 'login') await login(args.account);
        else if (action === 'pagehide') {
            const lateSave = () => saveResume('test-movie', { episodeId: 'ep-one', episodeNumber: 1, seconds: args.seconds }, localId);
            window.addEventListener('pagehide', lateSave, { once: true });
            window.dispatchEvent(new Event('pagehide'));
        } else if (action === 'logout') { await flushActiveResumeSync(); stop(); await signOut(auth); }
        else if (action === 'restartWithLocalProgress') {
            stop();
            await disableNetwork(db);
            saveResume('test-movie', { episodeId: 'ep-one', episodeNumber: 1, seconds: args.seconds }, localId);
            stop = startResumeSync(localId, auth.currentUser.uid, { database: db, writeDelayMs: 50, retryDelayMs: 500 });
            await enableNetwork(db);
        }
        else if (action === 'foreignRead') {
            try { await getDoc(doc(db, 'Users', args.uid, 'WatchProgress', 'test-movie')); value = 'allowed'; }
            catch (error) { value = error.code; }
        } else if (action === 'stop') { if (stop) { await stop.flush(); stop(); } await terminate(db); }
        else throw new Error(`Unknown command ${action}`);
        parentPort.postMessage({ id, value });
    } catch (error) { parentPort.postMessage({ id, error: `${error.code || ''} ${error.message}` }); }
});
