import { initializeApp, getApps } from 'firebase/app';
import { collection, doc, onSnapshot, runTransaction, getFirestore, getDocs, query, limit } from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebaseConfig.js';
import { configureResumeSync, getResumeStore, mergeRemoteResume, mergeResumeEntry } from '../utils/watchHistory.js';

let activeSync;
export async function flushActiveResumeSync() {
    if (!activeSync || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    // Logging out must stay responsive when the network is unavailable; local progress remains saved.
    let timeout;
    await Promise.race([activeSync.flush(), new Promise(resolve => { timeout = setTimeout(resolve, 1500); })]);
    clearTimeout(timeout);
}

// Firebase Auth's UID owns the cloud namespace; custom account IDs only scope local storage.
export function startProtectedResumeSync(userId, authUID) {
    let active = true;
    let stop;
    const app = getApps().find(item => item.name === 'resume-privacy-check') || initializeApp(firebaseConfig, 'resume-privacy-check');
    // This separate app never signs in. Public history must not be uploaded under open rules.
    getDocs(query(collection(getFirestore(app), 'Users', authUID, 'WatchProgress'), limit(1)))
        .then(() => { if (active) console.warn('Tiến độ xem lưu trên thiết bị: cần giới hạn quyền đọc WatchProgress trong Firestore Rules.'); })
        .catch(error => {
            if (active && error.code === 'permission-denied') stop = startResumeSync(userId, authUID);
            else if (active) console.warn('Chưa kiểm tra được quyền lưu tiến độ. Đang lưu trên thiết bị.');
        });
    return () => { active = false; stop?.(); };
}

export function startResumeSync(userId, authUID, { database = db, writeDelayMs = 15000, retryDelayMs = 30000 } = {}) {
    const progress = collection(database, 'Users', authUID, 'WatchProgress');
    const pending = new Map();
    let timer;
    let stopped = false;
    let flushing;
    let initialUploaded = false;
    const flush = () => {
        clearTimeout(timer);
        timer = null;
        if (flushing) return flushing;
        const entries = [...pending];
        pending.clear();
        let failed = false;
        flushing = Promise.all(entries.map(async ([movieId, entry]) => {
            try {
                await runTransaction(database, async transaction => {
                    const ref = doc(progress, movieId);
                    const snapshot = await transaction.get(ref);
                    const remote = snapshot.exists() ? snapshot.data() : null;
                    const merged = mergeResumeEntry(entry, remote);
                    if (JSON.stringify(remote) !== JSON.stringify(merged)) transaction.set(ref, merged);
                });
            }
            catch (error) {
                failed = true;
                if (!stopped) {
                    pending.set(movieId, mergeResumeEntry(entry, pending.get(movieId)));
                    console.warn('Chưa đồng bộ được tiến độ xem:', error.code || error.message);
                }
            }
        })).finally(() => {
            flushing = null;
            if (!stopped && pending.size && !timer) timer = setTimeout(flush, failed ? retryDelayMs : writeDelayMs);
        });
        return flushing;
    };
    const queue = (movieId, entry) => {
        pending.set(movieId, entry);
        if (!timer) timer = setTimeout(flush, writeDelayMs);
    };
    const disconnect = configureResumeSync(userId, queue);
    const unsubscribe = onSnapshot(progress, { includeMetadataChanges: true }, snapshot => {
        if (stopped) return;
        for (const change of snapshot.docChanges()) {
            if (change.type !== 'removed') mergeRemoteResume(change.doc.id, change.doc.data(), userId);
        }
        // Upload local progress after the initial cloud merge. No global/guest history is imported.
        if (!initialUploaded && !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
            initialUploaded = true;
            const remoteById = new Map(snapshot.docs.map(item => [item.id, item.data()]));
            for (const [movieId, entry] of Object.entries(getResumeStore(userId))) {
                const remote = remoteById.get(movieId);
                if (!remote || Number(entry.updatedAt) > Number(remote.updatedAt)) queue(movieId, entry);
            }
        }
    }, error => console.warn('Tiến độ xem đang lưu trên thiết bị:', error.code || error.message));
    const deferFlush = () => { queueMicrotask(() => { if (!stopped) void flush(); }); };
    const handleHidden = () => { if (document.visibilityState === 'hidden') deferFlush(); };
    const sync = { flush: async () => {
        await flush();
        // A final position may arrive while an earlier transaction is still finishing.
        if (pending.size) await flush();
    } };
    activeSync = sync;
    window.addEventListener('pagehide', deferFlush);
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', handleHidden);
    const stop = () => {
        stopped = true;
        if (activeSync === sync) activeSync = null;
        disconnect();
        unsubscribe();
        window.removeEventListener('pagehide', deferFlush);
        window.removeEventListener('online', flush);
        document.removeEventListener('visibilitychange', handleHidden);
        void flush();
    };
    stop.flush = flush;
    return stop;
}
