import process from 'node:process';
import { createHash } from 'node:crypto';
import { accountServices } from '../server/accounts/firebase.js';
import { createAccountService, fail } from '../server/accounts/service.js';
import { validWorkerSecret, encryptedBackup, migrateAccounts } from '../server/accounts/worker.js';
import { createPaymentService } from '../server/accounts/payments.js';

const PRIVATE_ACTIONS = new Set(['me', 'directory', 'profiles', 'get', 'save', 'delete', 'change-password', 'migrate', 'backup', 'payment-demo']);

export async function enforceLoginLimit(db, req, action) {
    const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const window = Math.floor(Date.now() / 600_000);
    const id = createHash('sha256').update(`${action}:${ip}`).digest('hex');
    const ref = db.collection('AccountAttempts').doc(id);
    await db.runTransaction(async tx => {
        const snap = await tx.get(ref);
        const count = snap.data()?.window === window ? snap.data().count : 0;
        if (count >= (action === 'register' ? 5 : 20)) fail(429, 'Too many attempts. Please try again later.');
        tx.set(ref, { window, count: count + 1, expiresAt: new Date(Date.now() + 24 * 3600_000) });
    });
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Vary', 'Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
        if (process.env.SECURE_ACCOUNTS_ENABLED !== 'true') fail(503, 'Account service is not enabled');
        if (req.method !== 'POST') fail(405, 'POST required');
        if (!String(req.headers['content-type'] || '').startsWith('application/json')) fail(415, 'JSON required');
        const origin = req.headers.origin;
        if (origin) {
            const host = new URL(origin).host;
            const allowed = new Set(['mfilm.online', 'www.mfilm.online', process.env.VERCEL_URL, ...(process.env.NODE_ENV !== 'production' ? ['localhost:5173', '127.0.0.1:5173'] : [])]);
            if (!allowed.has(host) && !(process.env.NODE_ENV !== 'production' && /^(localhost|127\.0\.0\.1):\d+$/.test(host))) fail(403, 'Origin not allowed');
        }
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (!body || JSON.stringify(body).length > 200_000) fail(400, 'Invalid request');
        const { db, auth } = accountServices();
        const service = createAccountService({ db, auth, encryptionKey: process.env.ACCOUNT_ENCRYPTION_KEY });
        const action = body.action;
        let result;
        if (['login', 'register'].includes(action)) await enforceLoginLimit(db, req, action);
        if (action === 'worker-token' || action === 'worker-backup') {
            if (!validWorkerSecret(req.headers['x-mfilm-worker'])) fail(401, 'Worker authentication required');
            result = action === 'worker-token' ? { customToken: await auth.createCustomToken('mfilm_catalog_worker', { catalogWorker: true }) } : await encryptedBackup(db);
        }
        else if (action === 'login') result = await service.login(body.email, body.password);
        else if (action === 'register') result = await service.register(body);
        else if (action === 'google') result = await service.google(body.token);
        else if (action === 'public-profiles') {
            const ids = [...new Set(body.ids || [])];
            if (ids.length > 30 || ids.some(id => typeof id !== 'string' || !/^[\w-]{1,128}$/.test(id))) fail(400, 'At most 30 profile IDs allowed');
            const docs = ids.length ? await db.getAll(...ids.map(id => db.collection('PublicUsers').doc(id))) : [];
            result = docs.filter(doc => doc.exists).map(doc => doc.data());
        } else if (PRIVATE_ACTIONS.has(action)) {
            const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
            const identity = await service.identify(token);
            if (action === 'me') result = await service.get(identity, identity.user.id);
            if (action === 'payment-demo') result = await createPaymentService(db).recordDemo(identity, body);
            if (action === 'directory') result = await service.directory(identity);
            if (action === 'migrate' || action === 'backup') {
                if (!identity.admin) fail(403, 'Administrator required');
                result = action === 'migrate' ? await migrateAccounts(db, service, body.cursor) : await encryptedBackup(db);
            }
            if (action === 'get') result = await service.get(identity, body.id, body.reveal === true);
            if (action === 'profiles') {
                if (!identity.admin || !Array.isArray(body.ids) || body.ids.length > 20) fail(403, 'Administrator required; at most 20 profiles');
                result = await Promise.all(body.ids.map(id => service.get(identity, id)));
            }
            if (action === 'save') result = await service.save(identity, body.user || {});
            if (action === 'delete') { await service.remove(identity, body.id); result = { deleted: true }; }
            if (action === 'change-password') result = await service.changePassword(identity, body.currentPassword, body.newPassword);
        } else fail(400, 'Unknown account action');
        return res.status(200).json({ data: result });
    } catch (error) {
        const status = error.status || 500;
        // Never log credentials, request bodies, tokens or Firebase private keys.
        if (status >= 500) console.error('Account request failed', { code: error.code || 'account-service-error' });
        return res.status(status).json({ error: status >= 500 ? 'Account service temporarily unavailable' : error.message });
    }
}
