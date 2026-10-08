import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { knowledgeBase, KNOWLEDGE_VERSION } from '../src/ai/knowledgeBase.js';
import { retrieveKnowledge, normalizeQuestion } from '../src/ai/knowledgeEngine.js';
import { extendedKnowledge } from '../src/ai/extendedKnowledge.js';

const samples = [];
const questions = new Map();
const ids = new Set();
assert.ok(extendedKnowledge.length >= 200, 'At least 200 separately authored additional questions are required.');
for (const entry of knowledgeBase) {
    assert.ok(entry.id && entry.answer && entry.questions.length, `Incomplete knowledge: ${entry.id}`);
    assert.ok(!ids.has(entry.id), `Duplicate topic ID: ${entry.id}`);
    ids.add(entry.id);
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
await writeFile(new URL('training-report.json', output), JSON.stringify({ version: KNOWLEDGE_VERSION, topics: knowledgeBase.length, newlyAuthoredTopics: extendedKnowledge.length, uniqueQuestions: questions.size, samples: samples.length, retrievalPassed: samples.length, categories: [...new Set(extendedKnowledge.flatMap(entry => entry.tags))] }, null, 2) + '\n');
const references = {
    'technology-1': ['Khái niệm xử lý video — MDN', 'https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Video_processing_concepts'],
    'technology-3': ['Codec video — MDN', 'https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs'],
    'technology-4': ['Codec video — MDN', 'https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs'],
    'technology-5': ['Codec video — MDN', 'https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs'],
    'technology-6': ['Codec video — MDN', 'https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs'],
    'technology-7': ['Hình ảnh HDR — Adobe', 'https://helpx.adobe.com/in/photoshop/using/high-dynamic-range-images.html'],
    'technology-15': ['HTTP caching — MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'],
    'technology-17': ['Duyệt riêng tư — Mozilla', 'https://www.mozilla.org/en-US/firefox/browsers/incognito-browser/'],
    'genres-25': ['Các nhãn thể loại — BFI', 'https://www.bfi.org.uk/features/genres-where-draw-line'],
    'assistant-19': ['Vì sao bầu trời xanh — NASA', 'https://spaceplace.nasa.gov/blue-sky/en/'],
    'assistant-20': ['Hành vi của sóng ánh sáng — NASA', 'https://science.nasa.gov/ems/03_behaviors/'],
};
let number = 0;
const groups = new Map();
for (const entry of knowledgeBase) {
    const group = entry.tags[0] || 'Kiến thức MFILM ban đầu';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(entry);
}
const lines = ['# Bộ câu hỏi và câu trả lời MFILM AI', '',
    `Phiên bản: ${KNOWLEDGE_VERSION}. **${extendedKnowledge.length} chủ đề hỏi đáp mới tự biên soạn**, tổng ${knowledgeBase.length} chủ đề và ${questions.size} câu hỏi độc nhất.`, '',
    'Danh sách dưới đây chứa tất cả câu hỏi đã lưu và đáp án tương ứng. Các mẫu bỏ dấu hoặc thêm lời lịch sự trong tệp JSONL không được tính thành câu hỏi mới.', '',
    'Thông tin giá, quyền xem, lịch phát hành và trạng thái tài khoản cần kiểm tra dữ liệu hiện tại. Các hướng dẫn có điều kiện không khẳng định tính năng hoặc chính sách chưa được xác nhận.', ''];
for (const [group, entries] of groups) {
    lines.push(`## ${group}`, '');
    for (const entry of entries) for (const question of entry.questions) {
        lines.push(`### ${++number}. ${question}`, '', entry.answer, '');
        if (references[entry.id]) { const [label, url] = references[entry.id]; lines.push(`Tham khảo: [${label}](${url}).`, ''); }
    }
}
assert.equal(number, questions.size, 'Review list must include every stored question exactly once.');
await writeFile(new URL('bo-cau-hoi-tra-loi.md', output), lines.join('\n') + '\n');
console.log(`MFILM knowledge: ${knowledgeBase.length} topics, ${questions.size} questions, ${samples.length} verified examples. Exported data/ai/mfilm-training.jsonl.`);
