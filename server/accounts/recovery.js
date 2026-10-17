import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { FieldValue } from 'firebase-admin/firestore';
import { passwordDigest, encryptPassword } from './credentials.js';
import { fail } from './service.js';

export const RECOVERY_TTL = 5 * 60_000;
export const RECOVERY_COOLDOWN = 60_000;
const MAX_ATTEMPTS = 5;
const emailOf = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const token = () => randomBytes(32).toString('base64url');
const validToken = value => typeof value === 'string' && /^[\w-]{43}$/.test(value);

// All recovery documents live BELOW a private document. The legacy rules grant
// root-document access, so putting codes or rate limits in a root collection is unsafe.
export function createPasswordRecovery({ db, auth, signingKey, sendCode, secureAccounts = false, encryptionKey, now = Date.now }) {
    if (Buffer.from(signingKey || '', 'base64').length !== 32) fail(503, 'Password recovery is not configured');
    const privateRoot = db.collection('AccountRecovery').doc('private');
    const challenges = privateRoot.collection('Challenges');
    const limits = privateRoot.collection('Limits');
    const users = db.collection('Users');
    const credentials = db.collection('AccountCredentials');
    const hash = (purpose, value) => createHmac('sha256', Buffer.from(signingKey, 'base64')).update(`${purpose}:${value}`).digest('hex');
    const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
    const fingerprint = (user, credential) => hash('password-version', JSON.stringify([
        emailOf(user.email), user.firebaseUid || '', user.password || '', credential?.passwordDigest || null,
    ]));
    const emailInput = value => {
        const email = emailOf(value);
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'INVALID_EMAIL');
        return email;
    };
    async function ipLimit(ip, action, maximum) {
        const ref = limits.doc(hash('ip', `${action}:${ip}`));
        await db.runTransaction(async tx => {
            const snap = await tx.get(ref);
            const at = now(), window = Math.floor(at / 900_000);
            const count = snap.data()?.window === window ? snap.data().count : 0;
            if (count >= maximum) fail(429, 'TOO_MANY_ATTEMPTS');
            tx.set(ref, { window, count: count + 1, expiresAt: new Date(at + 24 * 3600_000) });
        });
    }
    async function request(value, ip) {
        const email = emailInput(value);
        await ipLimit(ip, 'send', 10);
        const emailId = hash('email', email);
        const ref = challenges.doc(emailId);
        const emailLimit = limits.doc(`email-${emailId}`);
        const mailLimit = limits.doc('emailjs-global');
        const challengeId = token(), code = String(randomInt(0, 1_000_000)).padStart(6, '0');
        const expires = now() + RECOVERY_TTL;
        await db.runTransaction(async tx => {
            const [previous, quota, global] = await Promise.all([tx.get(ref), tx.get(emailLimit), tx.get(mailLimit)]);
            const at = now(), window = Math.floor(at / 3600_000);
            const count = quota.data()?.window === window ? quota.data().count : 0;
            if (previous.data()?.state === 'resetting' && previous.data().lockedUntil > at) fail(429, 'PLEASE_WAIT');
            if (quota.data()?.sentAt > at - RECOVERY_COOLDOWN || count >= 5 || global.data()?.sentAt > at - 1100) fail(429, 'PLEASE_WAIT');
            tx.set(emailLimit, { window, count: count + 1, sentAt: at, expiresAt: new Date(at + 24 * 3600_000) });
            tx.set(mailLimit, { sentAt: at });
            // Invalidate the old code/grant in the same transaction as the cooldown.
            tx.set(ref, { challengeId, codeDigest: hash('code', `${challengeId}:${code}`),
                userId: null, passwordVersion: null, state: 'preparing', attempts: 0,
                expires, expiresAt: new Date(expires + 24 * 3600_000) });
        });
        const snap = await users.where('email', '==', email).limit(2).get();
        let user = snap.size === 1 ? { ...snap.docs[0].data(), id: snap.docs[0].id } : null;
        // Older profiles may contain mixed-case email addresses. Resolve their
        // existing Firebase identity with a bounded lookup, never a Users scan.
        if (snap.size === 0) {
            let firebaseUser;
            try { firebaseUser = await auth.getUserByEmail(email); }
            catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
            if (firebaseUser) {
                const linked = await users.where('firebaseUid', '==', firebaseUser.uid).limit(2).get();
                if (linked.size === 1 && emailOf(linked.docs[0].data().email) === email) user = { ...linked.docs[0].data(), id: linked.docs[0].id };
            }
        }
        const credential = user ? (await credentials.doc(user.id).get()).data() : null;
        const eligible = user && (typeof user.password === 'string' && user.password.length > 0 || !!credential?.passwordDigest);
        // Unknown / Google-only / duplicate emails receive the same public response.
        await db.runTransaction(async tx => {
            const current = (await tx.get(ref)).data();
            if (current?.challengeId !== challengeId || current.state !== 'preparing') fail(400, 'INVALID_CODE');
            tx.update(ref, { userId: eligible ? user.id : null, passwordVersion: eligible ? fingerprint(user, credential) : null, state: 'pending' });
        });
        if (eligible) {
            try { await sendCode({ email, code, expiresInMinutes: 5, requestId: challengeId }); }
            catch {
                await db.runTransaction(async tx => {
                    if ((await tx.get(ref)).data()?.challengeId === challengeId) tx.update(ref, { state: 'failed' });
                });
                fail(503, 'Email delivery unavailable');
            }
        }
        return { challengeId, expiresIn: RECOVERY_TTL / 1000, retryAfter: RECOVERY_COOLDOWN / 1000 };
    }
    async function verify(value, challengeId, code, ip) {
        const email = emailInput(value);
        await ipLimit(ip, 'verify', 40);
        if (!validToken(challengeId)) fail(400, 'INVALID_CODE');
        const ref = challenges.doc(hash('email', email));
        const resetToken = token();
        const result = await db.runTransaction(async tx => {
            const challenge = (await tx.get(ref)).data();
            if (!challenge || challenge.challengeId !== challengeId || challenge.state !== 'pending' || challenge.expires <= now() || challenge.attempts >= MAX_ATTEMPTS) return false;
            const matches = typeof code === 'string' && /^\d{6}$/.test(code) && equal(challenge.codeDigest, hash('code', `${challengeId}:${code}`));
            if (!matches || !challenge.userId) {
                const attempts = challenge.attempts + 1;
                tx.update(ref, { attempts, ...(attempts >= MAX_ATTEMPTS ? { state: 'locked' } : {}) });
                return false;
            }
            tx.update(ref, { state: 'verified', grantDigest: hash('grant', resetToken), codeDigest: FieldValue.delete() });
            return true;
        });
        if (!result) fail(400, 'INVALID_CODE');
        return { resetToken };
    }
    async function reset(value, challengeId, resetToken, newPassword, ip) {
        const email = emailInput(value);
        await ipLimit(ip, 'reset', 20);
        if (!validToken(challengeId) || !validToken(resetToken)) fail(400, 'INVALID_RESET');
        if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 256) fail(400, 'INVALID_PASSWORD');
        if (secureAccounts && Buffer.from(encryptionKey || '', 'base64').length !== 32) fail(503, 'Password recovery is not configured');
        const ref = challenges.doc(hash('email', email));
        // Atomically consume the grant BEFORE external Firebase calls. Parallel
        // submissions cannot change the password twice, and resends cannot overlap.
        const record = await db.runTransaction(async tx => {
            const challenge = (await tx.get(ref)).data();
            if (!challenge || challenge.challengeId !== challengeId || challenge.state !== 'verified' || challenge.expires <= now() || !equal(challenge.grantDigest, hash('grant', resetToken))) fail(400, 'INVALID_RESET');
            const user = (await tx.get(users.doc(challenge.userId))).data();
            const credential = (await tx.get(credentials.doc(challenge.userId))).data();
            if (!user || emailOf(user.email) !== email || !equal(challenge.passwordVersion, fingerprint(user, credential))) fail(400, 'INVALID_RESET');
            tx.update(ref, { state: 'resetting', grantDigest: FieldValue.delete(), lockedUntil: now() + 120_000 });
            return { user: { ...user, id: challenge.userId }, credential, passwordVersion: challenge.passwordVersion };
        });
        try {
            let firebaseUser;
            try { firebaseUser = record.user.firebaseUid ? await auth.getUser(record.user.firebaseUid) : await auth.getUserByEmail(email); }
            catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
            if (firebaseUser) {
                if (firebaseUser.disabled || emailOf(firebaseUser.email) !== email) fail(400, 'INVALID_RESET');
                await auth.updateUser(firebaseUser.uid, { password: newPassword });
                await auth.revokeRefreshTokens(firebaseUser.uid);
            }
            const digest = passwordDigest(newPassword);
            await db.runTransaction(async tx => {
                const [challenge, user, credential] = await Promise.all([
                    tx.get(ref), tx.get(users.doc(record.user.id)), tx.get(credentials.doc(record.user.id)),
                ]);
                if (challenge.data()?.challengeId !== challengeId || challenge.data()?.state !== 'resetting' || !user.exists || !equal(record.passwordVersion, fingerprint(user.data(), credential.data()))) fail(400, 'INVALID_RESET');
                tx.update(users.doc(record.user.id), { password: secureAccounts ? FieldValue.delete() : newPassword, updatedAt: now() });
                if (secureAccounts || credential.exists) tx.set(credentials.doc(record.user.id), {
                    passwordDigest: digest, updatedAt: now(),
                    passwordEnvelope: encryptionKey ? encryptPassword(newPassword, encryptionKey, record.user.id) : FieldValue.delete(),
                }, { merge: true });
                tx.update(ref, { state: 'used', userId: FieldValue.delete(), passwordVersion: FieldValue.delete() });
            });
        } catch (error) {
            // A consumed grant is never restored after a partial external failure.
            // A fresh emailed code is required for the next attempt.
            await db.runTransaction(async tx => {
                const current = (await tx.get(ref)).data();
                if (current?.challengeId === challengeId && current.state === 'resetting') tx.update(ref, { state: 'failed' });
            });
            throw error;
        }
        return { changed: true };
    }
    return { request, verify, reset };
}
