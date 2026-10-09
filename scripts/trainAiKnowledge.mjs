import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { knowledgeBase, KNOWLEDGE_VERSION } from '../src/ai/knowledgeBase.js';
import websiteKnowledge from '../src/ai/websiteKnowledge.json' with { type: 'json' };
import { retrieveKnowledge, normalizeQuestion } from '../src/ai/knowledgeEngine.js';
const samples = [], questions = new Map(), ids = new Set();
const latestQuestions = websiteKnowledge.flatMap(entry => entry.questions);
assert.ok(latestQuestions.length >= 1000, 'At least 1000 new MFILM website questions required.');
for (const entry of knowledgeBase) {
    assert.ok(entry.id && entry.answer && entry.questions.length, entry.id);
    assert.ok(!ids.has(entry.id), `Duplicate ID: ${entry.id}`); ids.add(entry.id);
    for (const question of entry.questions) {
        const normalized = normalizeQuestion(question);
        assert.ok(!questions.has(normalized), `Duplicate question: ${question}`); questions.set(normalized, entry.id);
        for (const variant of new Set([question, normalized, `Bạn giúp tôi ${question.toLowerCase()} nhé`])) {
            assert.equal(retrieveKnowledge(variant)?.knowledgeId, entry.id, `Failed retrieval: ${variant}`);
            samples.push({ id: entry.id, version: KNOWLEDGE_VERSION, messages: [{ role: 'system', content: 'Bạn là trợ lý MFILM. Hướng dẫn sử dụng web, tìm phim trong kho. Không đoán giá, số tập, quyền cá nhân hoặc trạng thái giao dịch từ kiến thức cố định.' }, { role: 'user', content: variant }, { role: 'assistant', content: entry.answer }] });
        }
    }
}
const output = new URL('../data/ai/', import.meta.url); await mkdir(output, { recursive: true });
await writeFile(new URL('mfilm-training.jsonl', output), samples.map(sample => JSON.stringify(sample)).join('\n') + '\n');
const report = { version: KNOWLEDGE_VERSION, topics: knowledgeBase.length, uniqueQuestions: questions.size, latestBatchQuestions: latestQuestions.length, websiteGuideQuestions: websiteKnowledge.filter(entry => entry.scope === 'website').flatMap(entry => entry.questions).length, filmGuideQuestions: websiteKnowledge.filter(entry => entry.scope === 'film-guide').length, realMoviesCovered: new Set(websiteKnowledge.map(entry => entry.publicPath).filter(Boolean)).size, samples: samples.length, retrievalPassed: samples.length, excludedLegacyGroups: ['125 older broad-topic entries', '1000 older general knowledge entries'], runtime: 'Reviewed answer retrieval, not model weight training' };
await writeFile(new URL('training-report.json', output), JSON.stringify(report, null, 2) + '\n');
let number = 0; const groups = new Map();
for (const entry of knowledgeBase) { const group = entry.tags[0] || 'Kiến thức MFILM'; if (!groups.has(group)) groups.set(group, []); groups.get(group).push(entry); }
const lines = ['# Bộ câu hỏi và câu trả lời MFILM AI', '', `Phiên bản: ${KNOWLEDGE_VERSION}. Đợt này thêm **${latestQuestions.length} câu hỏi** liên quan MFILM: ${report.websiteGuideQuestions} câu hướng dẫn web và ${report.filmGuideQuestions} tình huống trên ${report.realMoviesCovered} phim thật trong kho. Tổng đang sử dụng: ${questions.size} câu hỏi.`, '', 'Mỗi câu dưới đây có đáp án tương ứng. Mẫu viết không dấu hoặc thêm lời lịch sự trong JSONL không tính thêm câu mới.', '', 'Bộ kiến thức phổ thông ngoài sử dụng MFILM đã đưa ra khỏi bộ trả lời sẵn. Nguồn cũ giữ để đối chiếu. Giá, gói của phim, quyền cá nhân, số tập và ngày cập nhật phải kiểm tra dữ liệu hiện tại.', '', 'Hỏi đáp theo phim hướng dẫn thao tác; không khẳng định phim luôn có nguồn hay giá cố định. Đây là truy xuất đáp án, chưa huấn luyện trọng số mô hình mới.', ''];
for (const [group, entries] of groups) { lines.push(`## ${group}`, ''); for (const entry of entries) for (const question of entry.questions) lines.push(`### ${++number}. ${question}`, '', entry.answer, ''); }
assert.equal(number, questions.size); await writeFile(new URL('bo-cau-hoi-tra-loi.md', output), lines.join('\n') + '\n');
console.log(`MFILM: ${latestQuestions.length} new website questions; ${questions.size} active questions; ${samples.length} verified examples.`);
