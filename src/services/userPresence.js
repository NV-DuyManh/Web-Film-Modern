import { collection, doc, onSnapshot, runTransaction, setDoc, updateDoc, FieldPath, deleteField, serverTimestamp } from 'firebase/firestore';
import { isPresenceSessionOnline, PRESENCE_HEARTBEAT_MS } from '../utils/userPresence.js';

export function createUserPresenceService(database, clock = Date.now) {
    const reference = userId => {
        if (!userId || typeof userId !== 'string' || userId.includes('/')) throw new Error('Invalid presence user ID');
        return doc(database, 'UserPresence', userId);
    };
    const record = () => ({ seenAt: clock(), lastSeen: serverTimestamp() });
    return {
        async open(userId, sessionId) {
            const ref = reference(userId);
            await runTransaction(database, async tx => {
                const snapshot = await tx.get(ref);
                const sessions = Object.fromEntries(Object.entries(snapshot.data()?.sessions || {}).filter(([, value]) => isPresenceSessionOnline(value, clock())));
                tx.set(ref, { userID: userId, sessions: { ...sessions, [sessionId]: record() } });
            });
        },
        touch(userId, sessionId) {
            return setDoc(reference(userId), { userID: userId, sessions: { [sessionId]: record() } }, { merge: true });
        },
        async close(userId, sessionId) {
            try { await updateDoc(reference(userId), new FieldPath('sessions', sessionId), deleteField()); }
            catch (error) { if (error.code !== 'not-found') throw error; }
        },
        subscribe(onData, onError) {
            return onSnapshot(collection(database, 'UserPresence'), { includeMetadataChanges: true }, snapshot => {
                onData(snapshot.docs.map(item => ({ ...item.data({ serverTimestamps: 'previous' }), id: item.id })), !snapshot.metadata.fromCache);
            }, onError);
        },
    };
}

// One lease per tab/device. Logging out or closing one tab leaves other leases intact.
export function startUserPresence(service, userId, { window: win = window, document: page = document, navigator: network = navigator, clock = Date.now, makeId = () => crypto.randomUUID(), intervalMs = PRESENCE_HEARTBEAT_MS } = {}) {
    let stopped = false;
    let session;
    let warned = false;
    const report = error => { if (!warned) { warned = true; console.warn('Online status update unavailable:', error.code || error.message); } };
    const renew = (force = false) => {
        if (stopped || !session || session.stopped || network.onLine === false || session.pending) return;
        const current = session;
        if (!force && clock() - current.lastAttempt < intervalMs) return;
        current.lastAttempt = clock();
        const write = current.opened ? service.touch(userId, current.id) : service.open(userId, current.id);
        current.pending = Promise.resolve(write).then(() => { current.opened = true; warned = false; }).catch(report).finally(() => { current.pending = null; });
    };
    const begin = () => {
        if (stopped || network.onLine === false) return;
        if (!session) session = { id: makeId(), opened: false, pending: null, stopped: false, lastAttempt: -Infinity };
        renew(true);
    };
    const release = () => {
        const ending = session;
        session = null;
        if (!ending) return Promise.resolve();
        ending.stopped = true;
        const close = () => network.onLine === false ? Promise.resolve() : service.close(userId, ending.id).catch(report);
        // Close again after an in-flight first heartbeat, so it cannot recreate the lease.
        const immediate = close();
        return ending.pending ? Promise.all([immediate, ending.pending.then(close)]) : immediate;
    };
    const visible = () => { if (page.visibilityState === 'visible') { if (!session) begin(); else renew(); } };
    const departed = () => { void release(); };
    win.addEventListener('pagehide', departed);
    win.addEventListener('pageshow', begin);
    win.addEventListener('offline', departed);
    win.addEventListener('online', begin);
    page.addEventListener('visibilitychange', visible);
    const timer = win.setInterval(() => renew(), intervalMs);
    begin();
    return () => {
        if (stopped) return Promise.resolve();
        stopped = true;
        win.clearInterval(timer);
        win.removeEventListener('pagehide', departed);
        win.removeEventListener('pageshow', begin);
        win.removeEventListener('offline', departed);
        win.removeEventListener('online', begin);
        page.removeEventListener('visibilitychange', visible);
        return release();
    };
}
