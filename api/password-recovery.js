import process from 'node:process';
import { Buffer } from 'node:buffer';
import { accountServices } from '../server/accounts/firebase.js';
import { createPasswordRecovery } from '../server/accounts/recovery.js';
import { recoveryMailConfigured, createRecoveryMailer } from '../server/accounts/recoveryMail.js';
import { fail } from '../server/accounts/service.js';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
        if (req.method !== 'POST') fail(405, 'POST required');
        if (!String(req.headers['content-type'] || '').startsWith('application/json')) fail(415, 'JSON required');
        if (req.headers.origin) {
            const origin = new URL(req.headers.origin);
            const dev = process.env.NODE_ENV !== 'production' && /^(localhost|127\.0\.0\.1)$/.test(origin.hostname);
            if (!dev && (origin.protocol !== 'https:' || !['mfilm.online', 'www.mfilm.online', process.env.VERCEL_URL, 'web-film-modern-beige.vercel.app'].includes(origin.host))) fail(403, 'Origin not allowed');
        }
        let body;
        try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { fail(400, 'Invalid request'); }
        if (!body || typeof body !== 'object' || JSON.stringify(body).length > 4000) fail(400, 'Invalid request');
        const available = process.env.PASSWORD_RECOVERY_ENABLED === 'true' && recoveryMailConfigured()
            && Buffer.from(process.env.PASSWORD_RESET_SECRET || '', 'base64').length === 32
            && !!process.env.FIREBASE_PRIVATE_KEY && !!process.env.FIREBASE_CLIENT_EMAIL;
        if (body.action === 'status') return res.status(200).json({ data: { available } });
        if (!available) fail(503, 'RECOVERY_UNAVAILABLE');
        if (!['request', 'verify', 'reset'].includes(body.action)) fail(400, 'Unknown recovery action');
        const { db, auth } = accountServices();
        const recovery = createPasswordRecovery({ db, auth, signingKey: process.env.PASSWORD_RESET_SECRET,
            sendCode: createRecoveryMailer(), secureAccounts: process.env.SECURE_ACCOUNTS_ENABLED === 'true', encryptionKey: process.env.ACCOUNT_ENCRYPTION_KEY });
        const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
        let data;
        if (body.action === 'request') data = await recovery.request(body.email, ip);
        if (body.action === 'verify') data = await recovery.verify(body.email, body.challengeId, body.code, ip);
        if (body.action === 'reset') data = await recovery.reset(body.email, body.challengeId, body.resetToken, body.newPassword, ip);
        return res.status(200).json({ data });
    } catch (error) {
        const status = error.status || 500;
        if (status >= 500) console.error('Password recovery unavailable', { code: error.code || 'recovery-error' });
        return res.status(status).json({ error: status >= 500 ? 'RECOVERY_UNAVAILABLE' : error.message });
    }
}
