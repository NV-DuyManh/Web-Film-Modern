import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
let server, local;
before(async () => {
    server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
    local = await server.ssrLoadModule('/src/components/client/chatBot/localCatalogAnswer.js');
});
after(async () => { await server?.close(); });
const movies = [
    { id: 'one', slug: 'tham-tu-lung-danh-conan', name: 'Detective Conan', otherName: 'Thám Tử Lừng Danh Conan', endEpisode: 1215, views: 100, listCategory: ['mystery'], listActor: ['actor'], country: 'Nhật Bản', releaseYear: 2024, description: 'Cậu thám tử bị teo nhỏ.', planID: 'paid' },
    { id: 'two', slug: 'hai-huoc', name: 'Phim Hài', endEpisode: 1, views: 30, listCategory: ['comedy'], country: 'Việt Nam', releaseYear: 2020 },
    { id: 'three', slug: 'hai-moi', name: 'Hài Mới', endEpisode: 12, views: 10, listCategory: ['comedy'], country: 'Việt Nam', releaseYear: 2025 },
];
const categories = [{ id: 'comedy', name: 'Hài Hước' }, { id: 'mystery', name: 'Bí Ẩn' }];
const plans = [{ id: 'paid', name: 'Premium', level: 3 }];
const ask = (prompt, extra = {}) => local.answerFromCatalog({ prompt, movies, categories, plans, ...extra });
test('Short movie name resolves a factual answer from actual data without an API', () => {
    const response = ask('Conan có bao nhiêu tập?');
    assert.equal(response.source, 'catalog'); assert.match(response.reply, /1215/); assert.match(response.reply, /tham-tu-lung-danh-conan/);
    assert.match(ask('Nội dung Detective Conan')?.reply || '', /teo nhỏ/);
});
test('Mood, genre, country and year recommendations keep the requested filters', () => {
    assert.ok(!ask('Tôi buồn, nên xem phim gì?').reply.includes('conan'));
    const response = ask('Gợi ý phim hài hước Việt Nam năm 2025');
    assert.match(response.reply, /hai-moi/); assert.ok(!response.reply.includes('/hai-huoc'));
});
test('Recommendations enforce account entitlement and named plan choices', () => {
    const free = ask('Phim hợp gói của tôi', { userPlanInfo: { name: 'Free', level: 0 }, isLogin: { id: 'A' } });
    assert.ok(!free.reply.includes('conan'));
    assert.match(ask('Gợi ý phim Premium').reply, /conan/);
});
test('Continuation never repeats prior cards and retains the preceding genre query', () => {
    const first = ask('Gợi ý 1 phim hài hước');
    const second = ask('tiếp', { history: [{ sender: 'user', text: 'Gợi ý 1 phim hài hước' }, { sender: 'ai', text: first.reply }] });
    assert.ok(!second.reply.includes('/phim/hai-huoc')); assert.match(second.reply, /hai-moi/);
});
test('Unknown or speculative questions defer instead of inventing catalog facts', () => {
    assert.equal(ask('Vì sao đoạn kết Detective Conan có ý nghĩa sâu sắc?'), null);
    assert.equal(ask('Conan có 9999999 tập phải không?'), null);
    assert.match(ask('Gợi ý phim Hàn Quốc')?.reply || '', /chưa tìm thấy/);
    assert.match(ask('Gợi ý phim hài', { catalogReady: false }).reply, /đang tải/);
});
test('Actor lookup and current movie facts use the catalog and avoid guessed metadata', () => {
    const actors = [{ id: 'actor', name: 'Diễn Viên A' }];
    assert.match(ask('Phim của Diễn Viên A', { actors }).reply, /conan/);
    assert.match(ask('Phim này chiếu năm nào?', { currentMovie: movies[0] }).reply, /2024/);
    assert.match(ask('Ai đóng Detective Conan?', { actors }).reply, /Diễn Viên A/);
});
test('Changed catalog or account rights invalidate factual answer memory', () => {
    const first = local.catalogContext(movies, plans, { level: 0 });
    assert.notEqual(first, local.catalogContext(movies.map(m => ({ ...m, endEpisode: m.endEpisode + 1 })), plans, { level: 0 }));
    assert.notEqual(first, local.catalogContext(movies, plans, { level: 3 }));
});
