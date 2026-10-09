import { Buffer } from 'node:buffer';
import process from 'node:process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { Timestamp, GeoPoint } from 'firebase-admin/firestore';
import { encryptPassword, decryptPassword, passwordDigest, matchesPassword, safeProfile, directoryEntry, profilePatch } from './credentials.js';
import { encodeValue, decodeValue, sealBackup, openBackup, restoreBackup } from './backup.js';
import { validWorkerSecret } from './worker.js';

const secret = randomBytes(32).toString('base64');
test('Recoverable passwords retain exact bytes including legacy short passwords', () => {
    for (const password of ['123', ' secret with spaces ', 'Mật khẩu đặc biệt🔐']) {
        const envelope = encryptPassword(password, secret, 'account-a');
        assert.equal(decryptPassword(envelope, secret, 'account-a'), password);
        assert.equal(matchesPassword(password, passwordDigest(password)), true);
        assert.equal(matchesPassword(password + 'x', passwordDigest(password)), false);
        assert.equal(matchesPassword(password, null, password), true);
        assert.equal(JSON.stringify(envelope).includes(password), false);
    }
});
test('Encrypted credentials cannot be moved to another account or tampered with', () => {
    const envelope = encryptPassword('private-example', secret, 'account-a');
    assert.throws(() => decryptPassword(envelope, secret, 'account-b'));
    assert.throws(() => decryptPassword(envelope, randomBytes(32).toString('base64'), 'account-a'));
    assert.throws(() => decryptPassword({ ...envelope, tag: randomBytes(16).toString('base64') }, secret, 'account-a'));
    assert.throws(() => encryptPassword('secret', 'missing-key', 'account-a'));
});
test('Public/session/directory data never includes credentials and users cannot grant themselves a role or paid access', () => {
    const user = { id: 'a', name: 'Name', email: 'a@example.invalid', password: 'secret', passwordEnvelope: {}, passwordDigest: {}, rentedMovies: ['paid'], address: 'private' };
    for (const output of [safeProfile(user), directoryEntry(user)]) {
        assert.equal('password' in output, false); assert.equal('passwordDigest' in output, false); assert.equal('passwordEnvelope' in output, false);
    }
    assert.equal('address' in directoryEntry(user), false);
    const input = { name: 'Updated', role: 'admin', planID: 'premium', rentedMovies: ['paid'], firebaseUid: 'victim', password: 'hack', id: 'victim' };
    assert.deepEqual(profilePatch(input), { name: 'Updated' });
    assert.deepEqual(profilePatch(input, true), { name: 'Updated', role: 'admin', planID: 'premium' });
});
test('Private backup authenticates all content, keeps typed fields and rejects corruption', () => {
    const payload = { date: new Date('2026-10-09T00:00:00Z'), time: new Timestamp(123, 456), point: new GeoPoint(10, 20), bytes: Buffer.from('a'), nested: { ids: ['one', 'two'], number: 0, bool: false } };
    const data = encodeValue(payload);
    const snapshot = { format: 'mfilm-private-backup-v1', complete: true, documents: [{ path: 'Users/a', data }] };
    const envelope = sealBackup(snapshot, secret);
    assert.deepEqual(openBackup(envelope, secret), snapshot);
    assert.equal(JSON.stringify(envelope).includes('Users/a'), false);
    const decoded = decodeValue(data);
    assert.ok(decoded.time.isEqual(payload.time)); assert.ok(decoded.point.isEqual(payload.point)); assert.deepEqual(decoded, payload);
    assert.throws(() => openBackup({ ...envelope, ciphertext: randomBytes(24).toString('base64') }, secret));
    assert.throws(() => openBackup(envelope, randomBytes(32).toString('base64')));
});
test('Restore verifier refuses a production target before making any writes', async () => {
    const old = process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    try { await assert.rejects(restoreBackup({}, { complete: true, format: 'mfilm-private-backup-v1', documents: [] }), /local Firestore emulator/); }
    finally { if (old) process.env.FIRESTORE_EMULATOR_HOST = old; }
});
test('Workers require a long private server credential', () => {
    const worker = randomBytes(48).toString('base64url');
    assert.equal(validWorkerSecret(worker, worker), true);
    assert.equal(validWorkerSecret(worker + 'x', worker), false);
    assert.equal(validWorkerSecret('123', '123'), false);
    assert.equal(validWorkerSecret(undefined, worker), false);
});
