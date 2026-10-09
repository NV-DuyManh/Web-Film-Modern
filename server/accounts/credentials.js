import { Buffer } from 'node:buffer';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const keyFrom = value => {
    const key = Buffer.from(value || '', 'base64');
    if (key.length !== 32) throw new Error('ACCOUNT_ENCRYPTION_KEY must be a private 32-byte base64 key');
    return key;
};

export function encryptPassword(password, key, userId) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', keyFrom(key), iv);
    cipher.setAAD(Buffer.from(`mfilm:password:v1:${userId}`));
    const ciphertext = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
    return { version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
}

export function decryptPassword(envelope, key, userId) {
    if (envelope?.version !== 1) throw new Error('Unsupported password envelope');
    const decipher = createDecipheriv('aes-256-gcm', keyFrom(key), Buffer.from(envelope.iv, 'base64'));
    decipher.setAAD(Buffer.from(`mfilm:password:v1:${userId}`));
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

export function passwordDigest(password) {
    const salt = randomBytes(16).toString('base64');
    return { version: 1, salt, digest: scryptSync(password, salt, 32).toString('base64') };
}

export function matchesPassword(password, credential, legacy) {
    if (typeof password !== 'string' || !password || password.length > 256) return false;
    if (credential?.version === 1) {
        const expected = Buffer.from(credential.digest, 'base64');
        const actual = scryptSync(password, credential.salt, 32);
        return expected.length === actual.length && timingSafeEqual(expected, actual);
    }
    if (typeof legacy !== 'string' || !legacy) return false;
    // Fixed-size comparison also supports existing passwords shorter than six characters.
    return timingSafeEqual(scryptSync(password, 'mfilm-legacy', 32), scryptSync(legacy, 'mfilm-legacy', 32));
}

export const PROFILE_FIELDS = ['name', 'email', 'phone', 'address', 'dob', 'birthDate', 'dateOfBirth', 'sexID', 'avatarUrl', 'imgUrl', 'selectedFrame', 'listFavorite', 'listFilm'];
export const DIRECTORY_FIELDS = ['name', 'email', 'phone', 'avatarUrl', 'sexID', 'role', 'planID', 'selectedFrame', 'createdAt', 'listFavorite'];

export function safeProfile(user) {
    const profile = { ...user };
    for (const key of ['password', 'passwordEnvelope', 'passwordDigest', 'favoriteStatsIndexed']) delete profile[key];
    return profile;
}

export function directoryEntry(user) {
    return Object.fromEntries(['id', ...DIRECTORY_FIELDS].filter(key => user[key] !== undefined).map(key => [key, user[key]]));
}

export function profilePatch(values, admin = false) {
    const allowed = [...PROFILE_FIELDS, ...(admin ? ['role', 'planID', 'listRentMovie'] : [])];
    return Object.fromEntries(allowed.filter(key => Object.hasOwn(values, key)).map(key => [key, values[key]]));
}
