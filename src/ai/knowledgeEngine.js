import { knowledgeBase, KNOWLEDGE_VERSION } from './knowledgeBase.js';

export { KNOWLEDGE_VERSION };
export function normalizeQuestion(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase()
        .replace(/\b(ko|k0)\b/g, 'khong').replace(/\bhong\b(?!\s+kong)/g, 'khong').replace(/(?<!\d)\.|\.(?!\d)/g, ' ')
        .replace(/[^a-z0-9+*/%().\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
const filler = new Set('ban toi minh cho giup nhe nha a oi voi xin lam on cach nhu the nao vay di duoc'.split(' '));
export const questionTokens = value => normalizeQuestion(value).split(' ').filter(token => token && !filler.has(token));
const discriminators = /\b(khong|chua|co|mua|thue|gia|xoa|doi|bao|may|tai|mat|dang|tien|truyen|hau|fps|4k|1080p|anime|manga|ova|ona|oad|vietsub|thuyet|long)\b/g;
const indexed = knowledgeBase.map(entry => ({ ...entry, variants: entry.questions.map(q => ({ normalized: normalizeQuestion(q), tokens: questionTokens(q) })) }));
const exactQuestions = new Map(indexed.flatMap(entry => entry.variants.map(variant => [variant.normalized, entry])));

// Confidence is lexical coverage, not a claim that an external model answer is true.
export function retrieveKnowledge(prompt) {
    const q = normalizeQuestion(prompt);
    if (!q || q.length > 500) return null;
    if (/^(xin chao|chao|hello|hi|hey|alo)( ban| ai| mfilm)?$/.test(q)) return { reply: 'Chào bạn! Bạn muốn tìm phim, gợi ý theo tâm trạng hay cần hướng dẫn sử dụng MFILM?', source: 'knowledge', confidence: 1, knowledgeId: 'greeting' };
    if (/^(cam on|thank you|thanks)( ban| nhe| nha)?$/.test(q)) return { reply: 'Rất vui được giúp bạn! Khi cần tìm phim hoặc hỗ trợ, cứ nhắn mình nhé. 🍿', source: 'knowledge', confidence: 1, knowledgeId: 'thanks' };
    // Strip a conversational request only when its remainder is a complete known question.
    const unwrapped = q.replace(/^(?:(?:toi|minh) )?(?:muon biet|can biet|muon hoi|can hoi|cho toi biet|cho minh biet|hay giai thich|giai thich)(?: cho (?:toi|minh))? /, '');
    const exact = exactQuestions.get(q) || exactQuestions.get(unwrapped);
    if (exact) return { reply: exact.answer, source: 'knowledge', confidence: 1, knowledgeId: exact.id };
    const tokens = questionTokens(q);
    let best;
    let runner = 0;
    for (const entry of indexed) {
        let score = 0;
        for (const variant of entry.variants) {
            if (q === variant.normalized || tokens.join(' ') === variant.tokens.join(' ')) { score = 1; break; }
            // Never fuzzy-match one film's guide to a different title. Exact
            // normalized questions and conversational wrappers still work.
            if (entry.scope === 'film-guide') continue;
            const queryWords = new Set(tokens);
            const words = new Set(variant.tokens);
            const overlap = [...queryWords].filter(token => words.has(token)).length;
            const coverage = overlap / Math.max(1, queryWords.size);
            const specificity = overlap / Math.max(1, words.size);
            const critical = q.match(discriminators) || [];
            if (queryWords.size < 3 || coverage < .86 || specificity < .75 || critical.some(word => !words.has(word))) continue;
            score = Math.max(score, .65 * coverage + .35 * specificity);
        }
        if (score > (best?.confidence || 0)) { runner = best?.confidence || 0; best = { reply: entry.answer, source: 'knowledge', confidence: score, knowledgeId: entry.id }; }
        else runner = Math.max(runner, score);
    }
    return best && (best.confidence === 1 || (best.confidence >= .93 && best.confidence - runner > .08)) ? best : null;
}

// Small deterministic calculator; parsing never evaluates JavaScript or arbitrary code.
export function calculateAnswer(prompt) {
    const expression = normalizeQuestion(prompt).replace(/^(tinh|tinh giup|bao nhieu la)\s+/, '').replace(/\s*(bang bao nhieu|la bao nhieu|bang|=)$/, '').trim();
    if (expression.length > 100 || !/^[\d\s.+\-*/()%]+$/.test(expression) || !/[+*/%()-]/.test(expression)) return null;
    const tokens = expression.match(/\d+(?:\.\d+)?|[()+\-*/%]/g) || [];
    let position = 0;
    const primary = () => {
        const token = tokens[position++];
        if (token === '+' || token === '-') return (token === '-' ? -1 : 1) * primary();
        if (token === '(') { const value = sum(); if (tokens[position++] !== ')') throw new Error('parenthesis'); return value; }
        if (!/^\d+(?:\.\d+)?$/.test(token || '')) throw new Error('number');
        return Number(token);
    };
    const product = () => {
        let value = primary();
        while (['*', '/', '%'].includes(tokens[position])) {
            const operator = tokens[position++]; const right = primary();
            if ((operator === '/' || operator === '%') && right === 0) throw new Error('zero');
            value = operator === '*' ? value * right : operator === '/' ? value / right : value % right;
        }
        return value;
    };
    const sum = () => {
        let value = product();
        while (['+', '-'].includes(tokens[position])) { const op = tokens[position++]; const right = product(); value = op === '+' ? value + right : value - right; }
        return value;
    };
    try { const result = sum(); if (position !== tokens.length || !Number.isFinite(result) || Math.abs(result) > 1e15) return null; return { reply: `${expression} = **${Number(result.toPrecision(12))}**`, source: 'calculation', confidence: 1 }; }
    catch { return null; }
}

export function localKnowledgeAnswer(prompt) { return calculateAnswer(prompt) || retrieveKnowledge(prompt); }
