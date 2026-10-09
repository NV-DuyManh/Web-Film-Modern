import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { FieldValue } from 'firebase-admin/firestore';
import { encryptPassword, decryptPassword, passwordDigest, matchesPassword, safeProfile, directoryEntry, profilePatch } from './credentials.js';

export const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const emailOf = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validId = id => typeof id === 'string' && /^[\w-]{1,128}$/.test(id);
const shardOf = id => createHash('sha256').update(id).digest('hex').slice(0, 2);
const authLookupId = email => createHash('sha256').update(email).digest('hex');

export function createAccountService({ db, auth, encryptionKey }) {
    if (Buffer.from(encryptionKey || '', 'base64').length !== 32) fail(503, 'Account encryption has not been configured');
    const users = db.collection('Users');
    const credentials = db.collection('AccountCredentials');
    async function byEmail(email) {
        const lookup = await db.collection('AccountEmails').doc(authLookupId(email)).get();
        if (lookup.exists) {
            const record = await users.doc(lookup.data().userId).get();
            if (record.exists && emailOf(record.data().email) === email) return { id: record.id, ...record.data() };
        }
        // Transitional lookup reads at most two profiles, never the entire Users collection.
        const snap = await users.where('email', '==', email).limit(2).get();
        if (snap.size > 1) fail(409, 'Duplicate email needs administrator review');
        return snap.empty ? null : { ...snap.docs[0].data(), id: snap.docs[0].id };
    }
    async function commit(user, password, oldEmail, { requireNewEmail = false, preserveLegacyPassword = false } = {}) {
        if (password !== undefined && (typeof password !== 'string' || !password || password.length > 256)) fail(400, 'Invalid password');
        return db.runTransaction(async batch => {
        const existing = await batch.get(users.doc(user.id));
        const previous = existing.data() || {};
        const profile = safeProfile({ ...previous, ...user });
        const email = emailOf(profile.email);
        if (email) {
            const lookup = await batch.get(db.collection('AccountEmails').doc(authLookupId(email)));
            if (lookup.exists && (requireNewEmail || lookup.data().userId !== user.id)) fail(409, 'Email already registered');
        }
        profile.email = email;
        batch.set(users.doc(user.id), { ...profile, ...(!preserveLegacyPassword ? { password: FieldValue.delete(), passwordDigest: FieldValue.delete(), passwordEnvelope: FieldValue.delete() } : {}), favoriteStatsIndexed: true }, { merge: true });
        if (password !== undefined) batch.set(credentials.doc(user.id), { passwordEnvelope: encryptPassword(password, encryptionKey, user.id), passwordDigest: passwordDigest(password), updatedAt: Date.now() });
        batch.set(db.collection('AccountDirectory').doc(shardOf(user.id)), { entries: { [user.id]: directoryEntry(profile) } }, { merge: true });
        batch.set(db.collection('PublicUsers').doc(user.id), { id: user.id, name: profile.name || '', avatarUrl: profile.avatarUrl || '', sexID: profile.sexID || '', role: profile.role || 'user', planID: profile.planID || '', selectedFrame: profile.selectedFrame || '' });
        if (email) batch.set(db.collection('AccountEmails').doc(authLookupId(email)), { userId: user.id });
        if (oldEmail && oldEmail !== email) batch.delete(db.collection('AccountEmails').doc(authLookupId(oldEmail)));
        const oldFavorites = new Set(previous.favoriteStatsIndexed ? previous.listFavorite || [] : []);
        const favorites = new Set(profile.listFavorite || []);
        const changes = {};
        for (const id of new Set([...oldFavorites, ...favorites])) {
            if (!validId(id)) continue;
            const delta = Number(favorites.has(id)) - Number(oldFavorites.has(id));
            if (delta) changes[id] = FieldValue.increment(delta);
        }
        if (Object.keys(changes).length) batch.set(db.collection('PublicStats').doc('Favorites'), { counts: changes }, { merge: true });
        return profile;
        });
    }
    async function identify(token) {
        if (!token) fail(401, 'Sign in required');
        let decoded;
        try { decoded = await auth.verifyIdToken(token, true); } catch { fail(401, 'Invalid session'); }
        const identity = await db.collection('AccountIdentities').doc(decoded.uid).get();
        if (!identity.exists) fail(401, 'Account session needs verification');
        const snap = await users.doc(identity.data().userId).get();
        if (!snap.exists) fail(401, 'Account no longer exists');
        const user = { ...snap.data(), id: snap.id };
        if (user.firebaseUid !== decoded.uid) fail(401, 'Account identity mismatch');
        return { user, uid: decoded.uid, admin: user.role === 'admin' };
    }
    async function session(user, uid) {
        // A Firebase identity may only be bound by a verified password or verified Google token.
        uid ||= user.firebaseUid || `mfilm_${user.id}`;
        let record;
        try { record = await auth.getUser(uid); } catch (error) {
            if (error.code !== 'auth/user-not-found') throw error;
            try { record = await auth.getUserByEmail(user.email); uid = record.uid; }
            catch (lookupError) {
                if (lookupError.code !== 'auth/user-not-found') throw lookupError;
                record = await auth.createUser({ uid, email: user.email, displayName: user.name || undefined });
            }
        }
        if (record.disabled) fail(403, 'Account disabled');
        const binding = await db.collection('AccountIdentities').doc(uid).get();
        if (binding.exists && binding.data().userId !== user.id) fail(409, 'Identity already linked');
        const claims = { ...(record.customClaims || {}), userId: user.id, role: user.role || 'user', admin: user.role === 'admin' };
        await auth.setCustomUserClaims(uid, claims);
        await db.collection('AccountIdentities').doc(uid).set({ userId: user.id });
        await users.doc(user.id).update({ firebaseUid: uid });
        return { user: safeProfile({ ...user, firebaseUid: uid }), customToken: await auth.createCustomToken(uid, claims) };
    }
    async function login(email, password) {
        email = emailOf(email);
        if (!email || !password) fail(401, 'Incorrect email or password');
        const user = await byEmail(email);
        const credential = user ? (await credentials.doc(user.id).get()).data() : null;
        if (!user || !matchesPassword(password, credential?.passwordDigest, user.password)) fail(401, 'Incorrect email or password');
        if (!credential) await commit({ id: user.id }, password);
        return session(user);
    }
    async function register(values) {
        const email = emailOf(values.email);
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof values.name !== 'string' || !values.name.trim() || values.name.length > 200 || typeof values.password !== 'string' || values.password.length < 6 || values.password.length > 256) fail(400, 'Valid name, email and a password of at least 6 characters required');
        if (await byEmail(email)) fail(409, 'Email already registered');
        try { await auth.getUserByEmail(email); fail(409, 'Email already has a sign-in account. Please sign in instead.'); }
        catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
        const ref = users.doc();
        const user = await commit({ id: ref.id, name: values.name.trim(), email, role: 'user', createdAt: Date.now() }, values.password, undefined, { requireNewEmail: true });
        return session(user);
    }
    async function google(token) {
        let decoded;
        try { decoded = await auth.verifyIdToken(token, true); } catch { fail(401, 'Invalid Google session'); }
        if (!decoded.email_verified || decoded.firebase?.sign_in_provider !== 'google.com') fail(401, 'Verified Google sign-in required');
        const email = emailOf(decoded.email);
        let user = await byEmail(email);
        if (!user) {
            const ref = users.doc();
            try {
                user = await commit({ id: ref.id, name: decoded.name || email.split('@')[0], email, avatarUrl: decoded.picture || '', role: 'user', createdAt: Date.now() }, undefined, undefined, { requireNewEmail: true });
            } catch (error) {
                if (error.status !== 409) throw error;
                user = await byEmail(email);
                if (!user) throw error;
            }
        }
        return session(user, decoded.uid);
    }
    async function get(identity, id, reveal = false) {
        if (!validId(id)) fail(400, 'Invalid account');
        if (!identity.admin && id !== identity.user.id) fail(403, 'Administrator required');
        if (reveal && !identity.admin) fail(403, 'Administrator required');
        const snap = await users.doc(id).get();
        if (!snap.exists) fail(404, 'Account not found');
        const record = { ...snap.data(), id: snap.id };
        const profile = safeProfile(record);
        if (reveal) {
            const credential = (await credentials.doc(id).get()).data();
            profile.password = credential?.passwordEnvelope ? decryptPassword(credential.passwordEnvelope, encryptionKey, id) : record.password || '';
            await db.collection('AccountAudit').add({ actor: identity.user.id, target: id, action: 'password-view', at: Date.now() });
        }
        return profile;
    }
    async function save(identity, values) {
        const id = values.id || (identity.admin ? users.doc().id : identity.user.id);
        if (!validId(id) || (!identity.admin && id !== identity.user.id)) fail(403, 'Administrator required');
        const snap = await users.doc(id).get();
        if (!snap.exists && !identity.admin) fail(404, 'Account not found');
        const old = snap.data() || { role: 'user', createdAt: Date.now() };
        const password = typeof values.password === 'string' && values.password.length ? values.password : undefined;
        if (password !== undefined && !identity.admin) fail(403, 'Use the password change form');
        const patch = profilePatch(values, identity.admin);
        for (const field of ['name', 'email', 'phone', 'address', 'sexID', 'avatarUrl', 'imgUrl', 'selectedFrame', 'role', 'planID']) {
            if (patch[field] !== undefined && (typeof patch[field] !== 'string' || patch[field].length > (field.endsWith('Url') ? 10000 : 1000))) fail(400, 'Invalid profile field');
        }
        if (patch.email !== undefined && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOf(patch.email)) || patch.email.length > 254)) fail(400, 'Invalid email');
        for (const field of ['listFavorite', 'listFilm', 'listRentMovie']) {
            if (patch[field] !== undefined && (!Array.isArray(patch[field]) || patch[field].length > 1000 || patch[field].some(value => !validId(value)))) fail(400, 'Invalid movie list');
        }
        if (patch.email && emailOf(patch.email) !== emailOf(old.email)) {
            if (!identity.admin) fail(400, 'Email changes require administrator verification');
            const occupied = await byEmail(emailOf(patch.email));
            if (occupied && occupied.id !== id) fail(409, 'Email already registered');
        }
        if (patch.role && !['admin', 'user'].includes(patch.role)) fail(400, 'Invalid role');
        // Keep credentials intact when editing a profile with a blank password.
        const existingCredential = await credentials.doc(id).get();
        const actualPassword = password ?? (!existingCredential.exists ? old.password : undefined);
        const updated = await commit({ ...patch, id, ...(!snap.exists ? { role: 'user', createdAt: Date.now() } : {}), updatedAt: Date.now() }, actualPassword, emailOf(old.email));
        if (old.firebaseUid && ((patch.role && patch.role !== old.role) || (patch.email && emailOf(patch.email) !== emailOf(old.email)) || password !== undefined)) {
            if (patch.email && emailOf(patch.email) !== emailOf(old.email)) await auth.updateUser(old.firebaseUid, { email: emailOf(patch.email) });
            await auth.setCustomUserClaims(old.firebaseUid, { userId: id, role: updated.role, admin: updated.role === 'admin' });
            await auth.revokeRefreshTokens(old.firebaseUid);
        }
        return updated;
    }
    async function changePassword(identity, currentPassword, newPassword) {
        const id = identity.user.id;
        const credential = (await credentials.doc(id).get()).data();
        if (!matchesPassword(currentPassword, credential?.passwordDigest, identity.user.password)) fail(400, 'Current password is incorrect');
        if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 256) fail(400, 'Password must contain at least 6 characters');
        await commit({ id }, newPassword);
        await auth.revokeRefreshTokens(identity.uid);
        return session(identity.user, identity.uid);
    }
    async function directory(identity) {
        if (!identity.admin) fail(403, 'Administrator required');
        const snap = await db.collection('AccountDirectory').limit(257).get();
        return snap.docs.flatMap(doc => Object.values(doc.data().entries || {})).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    async function remove(identity, id) {
        if (!identity.admin || !validId(id)) fail(403, 'Administrator required');
        if (id === identity.user.id) fail(400, 'Cannot delete the active administrator');
        const snap = await users.doc(id).get();
        if (!snap.exists) return;
        const user = snap.data();
        if (user.firebaseUid) await auth.updateUser(user.firebaseUid, { disabled: true });
        const batch = db.batch();
        batch.delete(users.doc(id)); batch.delete(credentials.doc(id)); batch.delete(db.collection('PublicUsers').doc(id));
        batch.update(db.collection('AccountDirectory').doc(shardOf(id)), { [`entries.${id}`]: FieldValue.delete() });
        if (user.email) batch.delete(db.collection('AccountEmails').doc(authLookupId(emailOf(user.email))));
        await batch.commit();
    }
    return { identify, login, register, google, get, save, changePassword, directory, remove, commit };
}
