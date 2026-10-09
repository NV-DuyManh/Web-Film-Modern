import { Buffer } from 'node:buffer';
import process from 'node:process';
import { timingSafeEqual } from 'node:crypto';
import { FieldPath } from 'firebase-admin/firestore';
import { createQuotaCounter } from '../../src/utils/backgroundQuota.js';
import { collectBackup, sealBackup, openBackup } from './backup.js';

export function validWorkerSecret(value, expected = process.env.CLOUD_WORKER_TOKEN) {
    if (typeof value !== 'string' || typeof expected !== 'string' || expected.length < 40) return false;
    const a = Buffer.from(value), b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function chargeBackupReads(db, count) {
    const ref = db.collection('Settings').doc('BackgroundQuota');
    await db.runTransaction(async tx => {
        const snap = await tx.get(ref);
        const counter = createQuotaCounter(snap.data() || {});
        counter.charge(count + 1, 1);
        tx.set(ref, { ...counter.snapshot(), updatedAt: Date.now() }, { merge: true });
    });
}

export async function encryptedBackup(db) {
    const snapshot = await collectBackup(db, count => chargeBackupReads(db, count));
    snapshot.accountEncryptionKey = process.env.ACCOUNT_ENCRYPTION_KEY;
    const envelope = sealBackup(snapshot, process.env.PRIVATE_BACKUP_KEY);
    // Authenticate and decrypt every generated backup before publishing it.
    if (openBackup(envelope, process.env.PRIVATE_BACKUP_KEY).documents.length !== snapshot.documents.length) throw new Error('Backup verification failed');
    if (JSON.stringify(envelope).length > 3_800_000) throw new Error('Backup response limit reached; split backup export required');
    return { envelope, count: snapshot.documents.length, createdAt: snapshot.createdAt };
}

export async function migrateAccounts(db, service, cursor = '') {
    let request = db.collection('Users').orderBy(FieldPath.documentId()).limit(25);
    if (cursor) request = request.startAfter(cursor);
    const snapshot = await request.get();
    for (const doc of snapshot.docs) {
        const user = { ...doc.data(), id: doc.id };
        await service.commit({ id: user.id }, typeof user.password === 'string' && user.password ? user.password : undefined);
    }
    return { migrated: snapshot.size, cursor: snapshot.docs.at(-1)?.id || cursor, complete: snapshot.size < 25 };
}
