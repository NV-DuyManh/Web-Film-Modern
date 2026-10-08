import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { knowledgeBase, KNOWLEDGE_VERSION } from '../src/ai/knowledgeBase.js';
import { retrieveKnowledge, normalizeQuestion } from '../src/ai/knowledgeEngine.js';

const samples = [];
const questions = new Map();
for (const entry of knowledgeBase) {
    assert.ok(entry.id && entry.answer && entry.questions.length, `Incomplete knowledge: ${entry.id}`);
    for (const question of entry.questions) {
        const normalized = normalizeQuestion(question);
        assert.ok(!questions.has(normalized) || questions.get(normalized) === entry.id, `Conflicting question: ${question}`);
        questions.set(normalized, entry.id);
        for (const variant of new Set([question, normalized, `Bạn giúp tôi ${question.toLowerCase()} nhé`])) {
            assert.equal(retrieveKnowledge(variant)?.knowledgeId, entry.id, `Failed retrieval: ${variant}`);
            samples.push({ id: entry.id, version: KNOWLEDGE_VERSION, messages: [{ role: 'system', content: 'Bạn là trợ lý MFILM. Trả lời theo kiến thức đã duyệt, không bịa dữ liệu.' }, { role: 'user', content: variant }, { role: 'assistant', content: entry.answer }] });
        }
    }
}
const output = new URL('../data/ai/', import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL('mfilm-training.jsonl', output), samples.map(sample => JSON.stringify(sample)).join('\n') + '\n');
await writeFile(new URL('training-report.json', output), JSON.stringify({ version: KNOWLEDGE_VERSION, topics: knowledgeBase.length, uniqueQuestions: questions.size, samples: samples.length, retrievalPassed: samples.length }, null, 2) + '\n');
console.log(`MFILM knowledge: ${knowledgeBase.length} topics, ${questions.size} questions, ${samples.length} verified examples. Exported data/ai/mfilm-training.jsonl.`);
