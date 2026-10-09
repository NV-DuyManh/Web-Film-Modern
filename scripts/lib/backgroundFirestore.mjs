import { doc, getDocFromServer, getDocs, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { createQuotaCounter, BackgroundQuotaError } from '../../src/utils/backgroundQuota.js';
import { catalogChange } from '../../src/services/catalogWrites.js';

// Shared only by serialized GitHub jobs. Counts our SDK operations conservatively;
// it does not claim to measure visitors' or Firebase Console usage.
export async function backgroundFirestore(db, { dryRun = false, now = Date.now, initialReads = 1 } = {}) {
    const ref = doc(db, 'Settings', 'BackgroundQuota');
    const state = (await getDocFromServer(ref)).data() || {};
    const counter = createQuotaCounter(state, { now });
    counter.charge(1 + initialReads, 0); // Include settings already read before constructing the meter.
    let dirty = 1;
    const flush = async () => {
        if (dryRun || !dirty) return;
        // Normal operations leave four slots for checkpoint/budget bookkeeping.
        counter.charge(0, 1);
        await setDoc(ref, { ...counter.snapshot(), updatedAt: now() }, { merge: true });
        dirty = 0;
    };
    const charge = (reads, writes, checkpoint = false) => {
        const current = counter.snapshot();
        if (!checkpoint && (current.reads + reads + 4 > current.readLimit || current.writes + writes + 4 > current.writeLimit)) throw new BackgroundQuotaError(now());
        counter.charge(reads, writes); dirty++;
    };
    return {
        counter, flush,
        async read(reference, checkpoint = false) { charge(1, 0, checkpoint); try { return await getDocFromServer(reference); } finally { if (dirty >= 40) await flush(); } },
        async query(reference, maxDocuments) {
            charge(maxDocuments, 0);
            const snapshot = await getDocs(reference);
            counter.refund(maxDocuments - Math.max(1, snapshot.size));
            if (dirty >= 40) await flush();
            return snapshot;
        },
        async set(reference, values, options) {
            if (dryRun) return;
            const change = catalogChange(reference, values); charge(0, change ? 2 : 1);
            const batch = writeBatch(db); batch.set(reference, values, options || {});
            if (change) batch.set(change.ref, change.values);
            await batch.commit(); if (dirty >= 40) await flush();
        },
        async update(reference, values, checkpoint = false) {
            if (dryRun) return;
            const change = catalogChange(reference, values); charge(0, change ? 2 : 1, checkpoint);
            const batch = writeBatch(db); batch.update(reference, values);
            if (change) batch.set(change.ref, change.values);
            await batch.commit(); if (dirty >= 40) await flush();
        },
        async remove(reference) {
            if (dryRun) return;
            const change = catalogChange(reference, null); charge(0, change ? 2 : 1);
            const batch = writeBatch(db); batch.delete(reference); if (change) batch.set(change.ref, change.values);
            await batch.commit(); if (dirty >= 40) await flush();
        },
        async batch(items) {
            if (dryRun || !items.length) return;
            const changes = items.map(item => catalogChange(item.ref, item.values)).filter(Boolean);
            charge(0, items.length + changes.length);
            const batch = writeBatch(db);
            for (const { ref: target, values, merge = false } of items) batch.set(target, values, { merge });
            for (const change of changes) batch.set(change.ref, change.values);
            await batch.commit();
            if (dirty >= 40) await flush();
        },
        async archiveAndRemove(archive, original, values) {
            if (dryRun) return;
            const change = catalogChange(original, null); charge(0, change ? 3 : 2);
            const batch = writeBatch(db); batch.set(archive, values); batch.delete(original);
            if (change) batch.set(change.ref, change.values);
            await batch.commit(); if (dirty >= 40) await flush();
        },
    };
}
