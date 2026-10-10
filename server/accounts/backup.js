import { Buffer } from 'node:buffer';
import process from 'node:process';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { Timestamp, GeoPoint, FieldPath } from 'firebase-admin/firestore';

export const BACKUP_COLLECTIONS = ['Users', 'AccountCredentials', 'AccountIdentities', 'AccountEmails', 'AccountDirectory', 'PublicUsers', 'Subscriptions', 'RentMovies', 'Deposits', 'AccountAudit', 'PaymentLedger', 'PendingPayments', 'WatchHistory', 'Favorites', 'Folders', 'MoviesSave', 'PublicStats'];

export function encodeValue(value) {
    if (value instanceof Timestamp) return { $mfilmType: 'timestamp', seconds: value.seconds, nanoseconds: value.nanoseconds };
    if (value instanceof GeoPoint) return { $mfilmType: 'geopoint', latitude: value.latitude, longitude: value.longitude };
    if (value instanceof Date) return { $mfilmType: 'date', value: value.toISOString() };
    if (Buffer.isBuffer(value)) return { $mfilmType: 'bytes', value: value.toString('base64') };
    if (value?.constructor?.name === 'DocumentReference') return { $mfilmType: 'reference', path: value.path };
    if (Array.isArray(value)) return value.map(encodeValue);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item)]));
    return value;
}

export function decodeValue(value, db) {
    if (value?.$mfilmType === 'timestamp') return new Timestamp(value.seconds, value.nanoseconds);
    if (value?.$mfilmType === 'geopoint') return new GeoPoint(value.latitude, value.longitude);
    if (value?.$mfilmType === 'date') return new Date(value.value);
    if (value?.$mfilmType === 'bytes') return Buffer.from(value.value, 'base64');
    if (value?.$mfilmType === 'reference') return db.doc(value.path);
    if (Array.isArray(value)) return value.map(item => decodeValue(item, db));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decodeValue(item, db)]));
    return value;
}

export function sealBackup(snapshot, secret) {
    const key = Buffer.from(secret || '', 'base64');
    if (key.length !== 32) throw new Error('Private backup encryption key required');
    const content = Buffer.from(JSON.stringify(snapshot));
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from('MFILM private backup v1'));
    const ciphertext = Buffer.concat([cipher.update(content), cipher.final()]);
    return { version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), sha256: createHash('sha256').update(content).digest('hex'), ciphertext: ciphertext.toString('base64') };
}

export function openBackup(envelope, secret) {
    if (envelope?.version !== 1) throw new Error('Unsupported backup version');
    const decipher = createDecipheriv('aes-256-gcm', Buffer.from(secret, 'base64'), Buffer.from(envelope.iv, 'base64'));
    decipher.setAAD(Buffer.from('MFILM private backup v1'));
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    const content = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]);
    if (createHash('sha256').update(content).digest('hex') !== envelope.sha256) throw new Error('Backup checksum mismatch');
    const snapshot = JSON.parse(content.toString('utf8'));
    if (snapshot.format !== 'mfilm-private-backup-v1' || !Array.isArray(snapshot.documents)) throw new Error('Invalid backup manifest');
    return snapshot;
}

export async function collectBackup(db, chargeReads = async () => {}, maxDocuments = 5000, { readQuery = request => request.get(), allowIncomplete = false } = {}) {
    const documents = [];
    async function scan(collection) {
        let cursor;
        while (true) {
            const remaining = maxDocuments - documents.length;
            if (remaining <= 0) throw new Error('Backup safety limit reached; no partial backup will be published');
            const size = Math.min(64, remaining);
            let request = collection.orderBy(FieldPath.documentId()).limit(size);
            if (cursor) request = request.startAfter(cursor);
            await chargeReads(size);
            const snapshot = await readQuery(request);
            for (const doc of snapshot.docs) documents.push({ path: doc.ref.path, data: encodeValue(doc.data()) });
            if (snapshot.size < size) break;
            cursor = snapshot.docs.at(-1);
        }
    }
    for (const name of BACKUP_COLLECTIONS) await scan(db.collection(name));
    const omissions = [];
    try { await scan(db.collectionGroup('WatchProgress')); }
    catch (error) {
        if (!allowIncomplete) throw error;
        omissions.push({ scope: 'Users/*/WatchProgress/*', reason: String(error.code || 'protected-scope-unavailable') });
    }
    return { format: 'mfilm-private-backup-v1', projectId: db.projectId, createdAt: new Date().toISOString(), complete: omissions.length === 0, ...(omissions.length ? { omissions } : {}), documents };
}

export async function restoreBackup(db, snapshot, { emulatorOnly = true, verifyIncomplete = false } = {}) {
    if (emulatorOnly && !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '')) throw new Error('Restore verification is restricted to a local Firestore emulator');
    const incompleteTest = verifyIncomplete && emulatorOnly && db.projectId?.startsWith('demo-') && Array.isArray(snapshot.omissions) && snapshot.omissions.length > 0;
    if ((!snapshot.complete && !incompleteTest) || snapshot.format !== 'mfilm-private-backup-v1') throw new Error('Complete backup required');
    const seen = new Set();
    for (const item of snapshot.documents) {
        const root = item.path?.split('/')[0];
        const allowed = BACKUP_COLLECTIONS.includes(root) && (item.path.split('/').length === 2 || /^Users\/[^/]+\/WatchProgress\/[^/]+$/.test(item.path));
        if (!allowed || seen.has(item.path)) throw new Error('Invalid or duplicate backup document path');
        seen.add(item.path);
    }
    for (let i = 0; i < snapshot.documents.length; i += 200) {
        const batch = db.batch();
        for (const item of snapshot.documents.slice(i, i + 200)) batch.set(db.doc(item.path), decodeValue(item.data, db));
        await batch.commit();
    }
    for (let i = 0; i < snapshot.documents.length; i += 200) {
        const expected = snapshot.documents.slice(i, i + 200);
        const actual = await db.getAll(...expected.map(item => db.doc(item.path)));
        for (let j = 0; j < actual.length; j++) {
            // Normalize through the same typed codec; compare full nested payloads, not just counts.
            if (JSON.stringify(sortObject(encodeValue(actual[j].data()))) !== JSON.stringify(sortObject(expected[j].data))) throw new Error('Restored document verification failed');
        }
    }
    return { verified: snapshot.documents.length };
}

function sortObject(value) {
    if (Array.isArray(value)) return value.map(sortObject);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortObject(value[key])]));
    return value;
}
