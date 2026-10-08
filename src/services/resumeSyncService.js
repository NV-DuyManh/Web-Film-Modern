import { initializeApp, getApps } from 'firebase/app';
import { collection, doc, onSnapshot, runTransaction, getFirestore, getDocs, query, limit } from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebaseConfig';
import { configureResumeSync, getResumeStore, mergeRemoteResume, mergeResumeEntry } from '../utils/watchHistory';

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

export function startResumeSync(userId, authUID) {
    const progress = collection(db, 'Users', authUID, 'WatchProgress');
    const pending = new Map();
    let timer;
    let stopped = false;
    const flush = async () => {
        clearTimeout(timer);
        timer = null;
        const batch = [...pending];
        pending.clear();
        await Promise.all(batch.map(async ([movieId, entry]) => {
            try {
                await runTransaction(db, async transaction => {
                    const ref = doc(progress, movieId);
                    const snapshot = await transaction.get(ref);
                    const remote = snapshot.exists() ? snapshot.data() : null;
                    const merged = mergeResumeEntry(entry, remote);
                    if (JSON.stringify(remote) !== JSON.stringify(merged)) transaction.set(ref, merged);
                });
            }
            catch (error) {
                if (!stopped && !pending.has(movieId)) pending.set(movieId, entry);
                console.warn('Chưa đồng bộ được tiến độ xem:', error.code || error.message);
            }
        }));
    };
    const queue = (movieId, entry) => {
        pending.set(movieId, entry);
        if (!timer) timer = setTimeout(flush, 15000);
    };
    const disconnect = configureResumeSync(userId, queue);
    const unsubscribe = onSnapshot(progress, snapshot => {
        if (stopped) return;
        for (const change of snapshot.docChanges()) {
            if (change.type !== 'removed') mergeRemoteResume(change.doc.id, change.doc.data(), userId);
        }
        // Upload local progress after the initial cloud merge. No global/guest history is imported.
        if (!snapshot.metadata.hasPendingWrites) {
            for (const [movieId, entry] of Object.entries(getResumeStore(userId))) {
                const remote = snapshot.docs.find(item => item.id === movieId)?.data();
                if (!remote || Number(entry.updatedAt) > Number(remote.updatedAt)) queue(movieId, entry);
            }
        }
    }, error => console.warn('Tiến độ xem đang lưu trên thiết bị:', error.code || error.message));
    const handleHidden = () => { if (document.visibilityState === 'hidden') void flush(); };
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', handleHidden);
    return () => {
        stopped = true;
        disconnect();
        unsubscribe();
        window.removeEventListener('pagehide', flush);
        window.removeEventListener('online', flush);
        document.removeEventListener('visibilitychange', handleHidden);
        void flush();
    };
}
