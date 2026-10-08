import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { knowledgeBase, KNOWLEDGE_VERSION } from '../src/ai/knowledgeBase.js';
import { retrieveKnowledge, normalizeQuestion } from '../src/ai/knowledgeEngine.js';
import { extendedKnowledge } from '../src/ai/extendedKnowledge.js';
import { largeKnowledge } from '../src/ai/largeKnowledge.js';

const samples = [];
const questions = new Map();
const ids = new Set();
assert.ok(extendedKnowledge.length >= 200, 'At least 200 separately authored additional questions are required.');
assert.ok(largeKnowledge.length >= 1000, 'At least 1000 further question/answer pairs are required.');
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
await writeFile(new URL('training-report.json', output), JSON.stringify({ version: KNOWLEDGE_VERSION, topics: knowledgeBase.length, newlyAuthoredTopics: extendedKnowledge.length + largeKnowledge.length, latestBatchQuestions: largeKnowledge.length, uniqueQuestions: questions.size, samples: samples.length, retrievalPassed: samples.length, categories: [...new Set([...extendedKnowledge, ...largeKnowledge].flatMap(entry => entry.tags))] }, null, 2) + '\n');
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
    'large-shots-1': ['Cỡ cảnh và góc máy — Adobe', 'https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles.html'],
    'large-shots-2': ['Cỡ cảnh và góc máy — Adobe', 'https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles.html'],
    'large-shots-3': ['Cỡ cảnh và góc máy — Adobe', 'https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles.html'],
    'large-shots-4': ['Cỡ cảnh và góc máy — Adobe', 'https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles.html'],
    'large-shots-5': ['Cỡ cảnh và góc máy — Adobe', 'https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles.html'],
    'large-shots-12': ['Cỡ cảnh và góc máy — Adobe', 'https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles.html'],
    'large-shots-13': ['Cỡ cảnh và góc máy — Adobe', 'https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles.html'],
    'large-shots-16': ['Cỡ cảnh và góc máy — Adobe', 'https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles.html'],
    'large-captions-5': ['WebVTT — MDN', 'https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API'],
    'large-captions-7': ['WebVTT — MDN', 'https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API'],
    'large-security-17': ['Hash function — MDN', 'https://developer.mozilla.org/en-US/docs/Glossary/Hash_function'],
    'large-security-19': ['Authentication — MDN', 'https://developer.mozilla.org/en-US/docs/Glossary/Authentication'],
    'large-space-1': ['Các hành tinh — NASA', 'https://science.nasa.gov/solar-system/planets/'],
    'large-space-2': ['Các hành tinh — NASA', 'https://science.nasa.gov/solar-system/planets/'],
    'large-space-3': ['Các hành tinh — NASA', 'https://science.nasa.gov/solar-system/planets/'],
    'large-space-18': ['Nhật thực và nguyệt thực — NASA', 'https://science.nasa.gov/moon/eclipses/'],
    'large-space-19': ['Nhật thực và nguyệt thực — NASA', 'https://science.nasa.gov/moon/eclipses/'],
};
let number = 0;
const groups = new Map();
for (const entry of knowledgeBase) {
    const group = entry.tags[0] || 'Kiến thức MFILM ban đầu';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(entry);
}
const lines = ['# Bộ câu hỏi và câu trả lời MFILM AI', '',
    `Phiên bản: ${KNOWLEDGE_VERSION}. **${largeKnowledge.length} cặp hỏi đáp bổ sung ở đợt mới nhất**, cộng ${extendedKnowledge.length} cặp đã biên soạn trước đó; tổng ${knowledgeBase.length} mục kiến thức và ${questions.size} câu hỏi độc nhất.`, '',
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
