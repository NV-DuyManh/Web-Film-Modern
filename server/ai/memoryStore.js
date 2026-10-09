import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { KNOWLEDGE_VERSION } from '../../src/ai/knowledgeEngine.js';
import { memoryPolicy } from '../../src/ai/answerMemory.js';

export function resolveMemorySecret(env = process.env) {
    // An independent secret is preferred. Existing server-only secret material enables migration
    // without putting any secret in the browser; changing that material invalidates old records.
    const raw = env.AI_MEMORY_SECRET || env.FIREBASE_PRIVATE_KEY || env.GROQ_API_KEYS || env.GROQ_API_KEY || env.GEMINI_API_KEYS || env.GEMINI_API_KEY;
    return raw ? createHash('sha256').update(`MFILM encrypted answer memory v1\n${raw}`).digest() : null;
}
export function sealRecord(record, key, id) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(id));
    const data = Buffer.concat([cipher.update(JSON.stringify(record), 'utf8'), cipher.final()]);
    return { version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64'), expiresAt: record.expiresAt };
}
export function openRecord(envelope, key, id) {
    try {
        if (envelope?.version !== 1 || typeof envelope.data !== 'string' || envelope.data.length > 100000) return null;
        const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
        decipher.setAAD(Buffer.from(id)); decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
        return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data, 'base64')), decipher.final()]).toString('utf8'));
    } catch { return null; }
}

async function documentRef(id) {
    const { accountServices } = await import('../accounts/firebase.js');
    return accountServices().db.collection('AIAnswerMemory').doc(id);
}
const cloud = {
    async read(id) { return (await (await documentRef(id)).get()).data(); },
    async write(id, value) { await (await documentRef(id)).set(value); },
    async remove(id) { await (await documentRef(id)).delete(); },
};

export function createSharedMemory({ secret = resolveMemorySecret(), adapter = cloud, now = Date.now, timeoutMs = 1800 } = {}) {
    const idFor = prompt => secret && createHmac('sha256', secret).update(`${KNOWLEDGE_VERSION}\n${memoryPolicy(prompt)?.question || ''}`).digest('hex');
    const receipt = (id, record) => createHmac('sha256', secret).update(`forget\n${id}\n${record.createdAt}`).digest('hex');
    const bounded = async promise => {
        let timer;
        try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('memory timeout')), timeoutMs); })]); }
        finally { clearTimeout(timer); }
    };
    return {
        async get(prompt) {
            const policy = memoryPolicy(prompt);
            if (!secret || !policy?.shared) return null;
            const id = idFor(prompt);
            let record;
            // Read the common store so another visitor's correction is visible immediately.
            try { record = openRecord(await bounded(adapter.read(id)), secret, id); } catch { return null; }
            if (!record || record.expiresAt <= now() || record.version !== KNOWLEDGE_VERSION || record.question !== policy.question || !memoryPolicy(prompt, record.reply)) return null;
            return { ...record, source: 'memory', model: 'mfilm-shared-memory', provider: 'mfilm', memoryReceipt: receipt(id, record) };
        },
        async remember(prompt, result) {
            const policy = memoryPolicy(prompt, result.reply);
            if (!secret || !policy?.shared || result.success !== true) return false;
            const id = idFor(prompt);
            const record = { question: policy.question, reply: result.reply, version: KNOWLEDGE_VERSION, createdAt: now(), expiresAt: now() + policy.ttlMs, learnedFrom: result.provider, model: result.model };
            try {
                await bounded(adapter.write(id, sealRecord(record, secret, id)));
                return receipt(id, record);
            } catch { return false; }
        },
        async forget(prompt, proof) {
            const found = await this.get(prompt);
            if (!found || !/^[a-f0-9]{64}$/.test(proof || '')) return false;
            const id = idFor(prompt);
            if (!timingSafeEqual(Buffer.from(proof, 'hex'), Buffer.from(receipt(id, found), 'hex'))) return false;
            try { await bounded(adapter.remove(id)); return true; } catch { return false; }
        },
    };
}
export const sharedMemory = createSharedMemory();
