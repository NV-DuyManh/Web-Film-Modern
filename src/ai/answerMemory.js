import { normalizeQuestion, KNOWLEDGE_VERSION } from './knowledgeEngine.js';

export const MEMORY_VERSION = 1;
const PRIVATE = /\b(mat khau|password|api key|token|otp|so the|tai khoan ngan hang|dia chi nha|email cua|ten toi|toi ten|tai khoan cua|goi cua|goi hien tai|ho so|thong tin ca nhan|toi song|toi o|toi bi|toi thich|minh song|minh o|minh bi|minh thich)\b/i;
const TRANSIENT = /\b(hom nay|hien nay|hien tai|moi nhat|bay gio|ngay mai|tuan nay|thang nay|nam nay|gia vang|ty gia|thoi tiet|tin tuc|lich chieu|ket qua|gia co phieu|tong thong|thu tuong|ceo|y te|chan doan|lieu thuoc|dau tu|phap luat)\b/i;
export const isContextualQuestion = prompt => /^(tiep|them|nua|the con|vay con|con no|con phim|phim do|cai do|no |bo do|phan do|so sanh chung|nhu tren|nhu vay|con gi)\b/.test(normalizeQuestion(prompt)) || /\b(phim nay|bo nay|phim do|bo do|cau tra loi tren|vua roi|da noi|dang xem)\b/.test(normalizeQuestion(prompt)) || /^(tai sao|vi sao)( vay| the| lai nhu vay)?$/.test(normalizeQuestion(prompt)) || /^(noi|giai thich|tom tat|viet|ke|rut gon).*(ro hon|them|lai|chi tiet hon|ngan gon hon)/.test(normalizeQuestion(prompt));
const containsSensitiveText = text => /[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{9,}\b|\b(?:gsk_|sk-|AIza)[\w-]{12,}/i.test(text) || PRIVATE.test(normalizeQuestion(text));
export function memoryPolicy(prompt, reply = '') {
    const question = normalizeQuestion(prompt);
    if (question.length < 10 || question.length > 1500 || !String(reply || '').trim() && reply !== '') return null;
    if (containsSensitiveText(prompt) || (reply && containsSensitiveText(reply)) || TRANSIENT.test(question) || isContextualQuestion(prompt)) return null;
    if (/\b(ignore|bo qua chi dan|bo qua huong dan|system prompt|developer message|jailbreak|gia vo|hay tra loi rang)\b/i.test(question)) return null;
    if (reply && (reply.length > 12000 || /Hệ thống báo lỗi|đang bảo trì|chưa được kích hoạt|không thể trả lời|tôi không biết|mình không biết|javascript:|data:text\/html|<script/i.test(reply))) return null;
    // Availability and access depend on live data; general film discussion can be shared.
    const catalog = /\b(mfilm|tren web|trong web|bao nhieu tap|may tap|goi|vip|premium|basic|plus|free|thue|server|gia ve)\b/.test(question);
    const film = /\b(phim|movie|conan|dien vien|dao dien|nhan vat)\b/.test(question);
    return { question, shared: !catalog, ttlMs: catalog || film ? 86400000 : 90 * 86400000 };
}

export function createAnswerMemory({ storage, scope = 'guest', now = Date.now, maxEntries = 250 } = {}) {
    const key = `mfilm_ai_memory_v${MEMORY_VERSION}_${scope}`;
    const read = () => {
        try { const records = JSON.parse(storage?.getItem(key) || '[]'); return Array.isArray(records) ? records.filter(entry => entry?.version === KNOWLEDGE_VERSION && entry.expiresAt > now()).slice(0, maxEntries) : []; }
        catch { return []; }
    };
    const write = entries => {
        try {
            let serialized = JSON.stringify(entries);
            while (serialized.length > 2000000 && entries.length) { entries.pop(); serialized = JSON.stringify(entries); }
            storage?.setItem(key, serialized);
        } catch { /* Storage full: the current answer remains usable. */ }
    };
    return {
        get(prompt, context = '') {
            const policy = memoryPolicy(prompt);
            if (!policy) return null;
            const entry = read().find(item => item.question === policy.question && item.context === (policy.shared ? 'general' : context));
            return entry && !entry.blocked ? { ...entry, source: 'memory', confidence: null } : null;
        },
        remember(prompt, reply, { context = '', source = 'provider', receipt = null } = {}) {
            const policy = memoryPolicy(prompt, reply);
            if (!policy) return false;
            const ctx = policy.shared ? 'general' : context;
            const entries = read().filter(entry => entry.question !== policy.question || entry.context !== ctx);
            const entry = { question: policy.question, prompt, reply, context: ctx, source, receipt, version: KNOWLEDGE_VERSION, createdAt: now(), expiresAt: now() + policy.ttlMs };
            write([entry, ...entries].slice(0, maxEntries));
            return true;
        },
        forget(prompt, context = '') {
            const policy = memoryPolicy(prompt);
            if (!policy) return;
            const ctx = policy.shared ? 'general' : context;
            write(read().filter(entry => entry.question !== policy.question || entry.context !== ctx));
        },
        clear() { try { storage?.removeItem(key); } catch { /* Optional storage. */ } },
        entries: read,
    };
}
