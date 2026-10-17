import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { createPasswordRecovery, RECOVERY_TTL } from '../server/accounts/recovery.js';
import { createRecoveryMailer, recoveryMailConfigured } from '../server/accounts/recoveryMail.js';
import { matchesPassword, decryptPassword } from '../server/accounts/credentials.js';
import recoveryHandler from '../api/password-recovery.js';
import process from 'node:process';

// A transaction fake that serializes concurrent operations, commits only on
// success, and rejects reads after writes like Firestore. No real accounts/mail.
function database(seed) {
    const data = new Map(Object.entries(seed));
    let queue = Promise.resolve();
    const snapshot = path => ({ id: path.split('/').at(-1), exists: data.has(path), data: () => data.get(path) && structuredClone(data.get(path)) });
    const ref = path => ({ path, get: async () => snapshot(path), collection: name => collection(`${path}/${name}`) });
    const collection = path => ({
        doc: id => ref(`${path}/${id}`),
        where: (field, operator, value) => ({ limit: limit => ({ get: async () => {
            assert.equal(operator, '==');
            const docs = [...data.entries()].filter(([key, item]) => key.startsWith(`${path}/`) && key.split('/').length === path.split('/').length + 1 && item[field] === value)
                .slice(0, limit).map(([key]) => snapshot(key));
            return { size: docs.length, docs };
        } }) }),
    });
    return {
        data, collection,
        runTransaction(callback) {
            const run = queue.then(async () => {
                const writes = [];
                const result = await callback({
                    get: async reference => { assert.equal(writes.length, 0, 'read after write'); return snapshot(reference.path); },
                    set: (reference, value, options) => writes.push({ path: reference.path, value, merge: options?.merge }),
                    update: (reference, value) => { assert.ok(data.has(reference.path)); writes.push({ path: reference.path, value, merge: true }); },
                });
                for (const { path, value, merge } of writes) {
                    const next = merge ? { ...data.get(path) } : {};
                    for (const [key, item] of Object.entries(value)) {
                        if (typeof item?.isEqual === 'function' && item.isEqual(FieldValue.delete())) delete next[key];
                        else next[key] = structuredClone(item);
                    }
                    data.set(path, next);
                }
                return result;
            });
            queue = run.catch(() => {});
            return run;
        },
    };
}
function fixture(options = {}) {
    let at = 2_000_000_000_000;
    const db = database({ 'Users/alice': { email: 'alice@example.test', password: 'old-password', firebaseUid: 'firebase-alice', role: 'user', listFavorite: ['film-1'] }, ...options.seed });
    const sent = [], authCalls = [];
    const auth = {
        getUser: async uid => ({ uid, email: 'alice@example.test' }),
        getUserByEmail: async email => ({ uid: 'firebase-alice', email }),
        updateUser: async (...args) => { authCalls.push(['update', ...args]); },
        revokeRefreshTokens: async uid => { authCalls.push(['revoke', uid]); },
        ...options.auth,
    };
    const key = randomBytes(32).toString('base64');
    const service = createPasswordRecovery({ db, auth, signingKey: key,
        sendCode: async values => { sent.push(values); if (options.mailFailure) throw new Error('provider failure'); },
        now: () => at, secureAccounts: options.secureAccounts, encryptionKey: options.encryptionKey });
    return { service, db, sent, authCalls, advance: ms => { at += ms; }, challenge: () => [...db.data.entries()].find(([path]) => path.includes('/Challenges/'))?.[1] };
}
const email = 'alice@example.test', ip = '192.0.2.1';
const rejected = (promise, status, message) => assert.rejects(promise, error => error.status === status && (!message || error.message === message));
async function verified(f) {
    const request = await f.service.request(email, ip);
    const grant = await f.service.verify(email, request.challengeId, f.sent.at(-1).code, ip);
    return { ...request, ...grant };
}

test('legacy flow validates a six-digit code, resets both password stores, preserves profile and prevents replay', async () => {
    const f = fixture();
    const flow = await verified(f);
    assert.match(f.sent[0].code, /^\d{6}$/);
    assert.equal(flow.code, undefined);
    const saved = f.challenge();
    assert.ok(!JSON.stringify(saved).includes(f.sent[0].code));
    assert.ok(!JSON.stringify(saved).includes(flow.resetToken));
    await f.service.reset(email, flow.challengeId, flow.resetToken, 'new-password', ip);
    assert.equal(f.db.data.get('Users/alice').password, 'new-password');
    assert.deepEqual(f.db.data.get('Users/alice').listFavorite, ['film-1']);
    assert.equal(f.db.data.get('Users/alice').role, 'user');
    assert.deepEqual(f.authCalls.map(call => call[0]), ['update', 'revoke']);
    await rejected(f.service.reset(email, flow.challengeId, flow.resetToken, 'other-password', ip), 400, 'INVALID_RESET');
    assert.equal(f.authCalls.length, 2);
});
test('secure mode saves encrypted password and digest without a plaintext field', async () => {
    const encryptionKey = randomBytes(32).toString('base64');
    const f = fixture({ secureAccounts: true, encryptionKey });
    const flow = await verified(f);
    await f.service.reset(email, flow.challengeId, flow.resetToken, 'new-password', ip);
    assert.equal(f.db.data.get('Users/alice').password, undefined);
    const credential = f.db.data.get('AccountCredentials/alice');
    assert.equal(matchesPassword('new-password', credential.passwordDigest), true);
    assert.equal(matchesPassword('old-password', credential.passwordDigest), false);
    assert.equal(decryptPassword(credential.passwordEnvelope, encryptionKey, 'alice'), 'new-password');
});
test('five wrong codes lock the challenge, including a subsequent correct code', async () => {
    const f = fixture(), request = await f.service.request(email, ip);
    const wrong = f.sent[0].code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) await rejected(f.service.verify(email, request.challengeId, wrong, ip), 400, 'INVALID_CODE');
    assert.equal(f.challenge().attempts, 5);
    await rejected(f.service.verify(email, request.challengeId, f.sent[0].code, ip), 400);
});
test('expired codes and expired grants are rejected', async () => {
    const f = fixture(), request = await f.service.request(email, ip);
    f.advance(RECOVERY_TTL);
    await rejected(f.service.verify(email, request.challengeId, f.sent[0].code, ip), 400);
    const g = fixture(), flow = await verified(g);
    g.advance(RECOVERY_TTL);
    await rejected(g.service.reset(email, flow.challengeId, flow.resetToken, 'new-password', ip), 400);
    assert.equal(g.authCalls.length, 0);
});
test('resend requires cooldown and invalidates an old verified grant', async () => {
    const f = fixture(), old = await verified(f);
    await rejected(f.service.request(email, '192.0.2.2'), 429);
    f.advance(60_001);
    const fresh = await f.service.request(email, '192.0.2.2');
    assert.notEqual(fresh.challengeId, old.challengeId);
    await rejected(f.service.reset(email, old.challengeId, old.resetToken, 'new-password', ip), 400);
    assert.equal(f.authCalls.length, 0);
});
test('unknown and Google-only email return the same response shape without sending a code', async () => {
    const f = fixture({ seed: { 'Users/google': { email: 'google@example.test', firebaseUid: 'google-id' } } });
    const missing = await f.service.request('missing@example.test', ip);
    f.advance(1101);
    const google = await f.service.request('google@example.test', ip);
    assert.deepEqual(Object.keys(missing), Object.keys(google));
    assert.equal(f.sent.length, 0);
    assert.equal(missing.expiresIn, 300);
});
test('code and grant are bound to the email and request, and verification is single-use', async () => {
    const f = fixture(), flow = await verified(f);
    await rejected(f.service.verify(email, flow.challengeId, f.sent[0].code, ip), 400);
    await rejected(f.service.reset('other@example.test', flow.challengeId, flow.resetToken, 'new-password', ip), 400);
    await rejected(f.service.reset(email, randomBytes(32).toString('base64url'), flow.resetToken, 'new-password', ip), 400);
    await rejected(f.service.reset(email, flow.challengeId, randomBytes(32).toString('base64url'), 'new-password', ip), 400);
    assert.equal(f.authCalls.length, 0);
});
test('concurrent reset requests consume a grant only once', async () => {
    const f = fixture(), flow = await verified(f);
    const results = await Promise.allSettled([1, 2].map(() => f.service.reset(email, flow.challengeId, flow.resetToken, 'new-password', ip)));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(f.authCalls.filter(call => call[0] === 'update').length, 1);
});
test('changing a password after code issuance invalidates the grant', async () => {
    const f = fixture(), flow = await verified(f);
    f.db.data.get('Users/alice').password = 'changed-elsewhere';
    await rejected(f.service.reset(email, flow.challengeId, flow.resetToken, 'new-password', ip), 400);
    assert.equal(f.authCalls.length, 0);
});
test('failed Firebase update consumes the grant and leaves MFilm password unchanged', async () => {
    const f = fixture({ auth: { updateUser: async () => { throw new Error('Firebase unavailable'); } } });
    const flow = await verified(f);
    await assert.rejects(f.service.reset(email, flow.challengeId, flow.resetToken, 'new-password', ip));
    assert.equal(f.db.data.get('Users/alice').password, 'old-password');
    assert.equal(f.challenge().state, 'failed');
    await rejected(f.service.reset(email, flow.challengeId, flow.resetToken, 'new-password', ip), 400);
});
test('disabled or mismatched Firebase identity cannot be reset', async () => {
    for (const user of [{ disabled: true, email }, { email: 'another@example.test' }]) {
        const f = fixture({ auth: { getUser: async () => ({ uid: 'firebase-alice', ...user }) } });
        const flow = await verified(f);
        await rejected(f.service.reset(email, flow.challengeId, flow.resetToken, 'new-password', ip), 400);
        assert.equal(f.authCalls.length, 0);
    }
});
test('duplicate email profiles do not receive a reset code', async () => {
    const f = fixture({ seed: { 'Users/duplicate': { email, password: 'duplicate-password' } } });
    await f.service.request(email, ip);
    assert.equal(f.sent.length, 0);
});
test('per-IP and per-email quotas prevent repeated sends across requests', async () => {
    const f = fixture();
    for (let i = 0; i < 5; i++) { await f.service.request(email, `192.0.2.${i}`); f.advance(60_001); }
    await rejected(f.service.request(email, '192.0.2.100'), 429);
    const g = fixture();
    for (let i = 0; i < 10; i++) { await g.service.request(`missing${i}@example.test`, ip); g.advance(1101); }
    await rejected(g.service.request('another@example.test', ip), 429);
});
test('mail errors invalidate the challenge instead of claiming delivery', async () => {
    const f = fixture({ mailFailure: true });
    await rejected(f.service.request(email, ip), 503);
    assert.equal(f.challenge().state, 'failed');
});
test('mail adapter sends the server code only to the configured EmailJS template', async () => {
    const env = { EMAILJS_SERVICE_ID: 'test-service', EMAILJS_PUBLIC_KEY: 'test-public', EMAILJS_PRIVATE_KEY: 'test-private', EMAILJS_RESET_TEMPLATE_ID: 'test-template', PASSWORD_RESET_SECRET: 'test-secret' };
    let payload;
    const send = createRecoveryMailer(env, async (url, options) => {
        assert.equal(url, 'https://api.emailjs.com/api/v1.0/email/send');
        payload = JSON.parse(options.body); return { ok: true };
    });
    assert.equal(recoveryMailConfigured(env), true);
    assert.equal(recoveryMailConfigured({}), false);
    await send({ email, code: '012345', expiresInMinutes: 5, requestId: 'request-1' });
    assert.equal(payload.accessToken, 'test-private');
    assert.deepEqual(payload.template_params, { mfilm_reset: true, to_email: email, code: '012345', expires_minutes: 5, app_name: 'MFilm', request_id: 'request-1' });
});
test('legacy mixed-case email resolves using the linked Firebase identity', async () => {
    const f = fixture({ seed: { 'Users/alice': { email: 'Alice@Example.Test', password: 'old-password', firebaseUid: 'firebase-alice' } } });
    const flow = await verified(f);
    assert.equal(f.sent[0].email, email);
    await f.service.reset(email, flow.challengeId, flow.resetToken, 'new-password', ip);
    assert.equal(f.db.data.get('Users/alice').password, 'new-password');
});
test('unverified requests cannot change passwords, and weak passwords do not consume a valid grant', async () => {
    const f = fixture(), request = await f.service.request(email, ip);
    await rejected(f.service.reset(email, request.challengeId, randomBytes(32).toString('base64url'), 'new-password', ip), 400);
    const grant = await f.service.verify(email, request.challengeId, f.sent[0].code, ip);
    await rejected(f.service.reset(email, request.challengeId, grant.resetToken, 'short', ip), 400, 'INVALID_PASSWORD');
    await f.service.reset(email, request.challengeId, grant.resetToken, 'new-password', ip);
});
test('API fails closed without configuration and rejects unsafe methods, origins and oversized payloads', async () => {
    const previous = process.env.PASSWORD_RECOVERY_ENABLED;
    delete process.env.PASSWORD_RECOVERY_ENABLED;
    const call = async (request = {}) => {
        const headers = {};
        const res = { setHeader: (key, value) => { headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
        await recoveryHandler({ method: 'POST', headers: { 'content-type': 'application/json' }, body: { action: 'status' }, ...request }, res);
        assert.match(headers['Cache-Control'], /no-store/);
        return res;
    };
    try {
        assert.deepEqual((await call()).body, { data: { available: false } });
        assert.equal((await call({ method: 'GET' })).code, 405);
        assert.equal((await call({ headers: { 'content-type': 'text/plain' } })).code, 415);
        assert.equal((await call({ headers: { 'content-type': 'application/json', origin: 'https://example.test' } })).code, 403);
        assert.equal((await call({ body: '{invalid-json' })).code, 400);
        assert.equal((await call({ body: { action: 'request', email: 'x'.repeat(5000) } })).code, 400);
        assert.equal((await call({ body: { action: 'request', email } })).code, 503);
    } finally {
        if (previous === undefined) delete process.env.PASSWORD_RECOVERY_ENABLED;
        else process.env.PASSWORD_RECOVERY_ENABLED = previous;
    }
});
