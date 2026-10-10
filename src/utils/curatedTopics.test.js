import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { curatedTopics, selectTopicMovies, topicEnabledOverrides } from './curatedTopics.js';
import { prepareCatalog, resolvePublicPage, indexableCatalogPaths } from '../../server/seo/catalog.js';
import { createTopicControlsLoader } from '../../server/topics/controls.js';
import { createPageHandler } from '../../api/page.js';

test('All twenty curated topics have actual matching films in the published catalog', async () => {
    const { catalog } = JSON.parse(await readFile(new URL('../../server/seo/catalog.json', import.meta.url), 'utf8'));
    const topics = curatedTopics();
    assert.equal(topics.length, 20);
    assert.equal(new Set(topics.map(item => item.id)).size, 20);
    for (const topic of topics) {
        const movies = selectTopicMovies(topic, catalog.Movies, catalog.Categories, catalog.CategoryTypes);
        assert.ok(movies.length > 0, topic.name);
        assert.equal(new Set(movies.map(item => item.id)).size, movies.length);
    }
});

test('Anime requires Japanese animation and a matching action/adventure genre', () => {
    const topic = curatedTopics().find(item => item.id === 'anime-hanh-dong');
    const base = { listCategory: ['action'], categoryTypeID: 'anime', countriesID: 'Nhật Bản' };
    const movies = [{ ...base, id: 'old', updatedAt: 100 }, { ...base, id: 'new', updatedAt: 200 }, { ...base, id: 'live-action', categoryTypeID: 'series' }, { ...base, id: 'china', countriesID: 'Trung Quốc' }, { ...base, id: 'wrong-genre', listCategory: ['romance'] }];
    assert.deepEqual(selectTopicMovies(topic, movies, [{ id: 'action', name: 'Hành Động' }], [{ id: 'anime', name: 'Hoạt Hình' }]).map(item => item.id), ['new', 'old']);
    assert.deepEqual(selectTopicMovies({ ...topic, enabled: false }, movies, [{ id: 'action', name: 'Hành Động' }], [{ id: 'anime', name: 'Hoạt Hình' }]), []);
});

test('New Vietnamese and animation topics select actual origin/type instead of matching unrelated titles', () => {
    const topics = curatedTopics();
    const movies = [
        { id: 'viet', countriesID: 'Việt Nam', listCategory: [] },
        { id: 'english-origin', countriesID: 'Vietnam', listCategory: [] },
        { id: 'foreign', countriesID: 'Hàn Quốc', name: 'Phim Việt', listCategory: [] },
        { id: 'animation-type', categoryTypeID: 'animation', listCategory: [] },
        { id: 'animation-genre', categoryTypeID: 'series', listCategory: ['animated'] },
        { id: 'documentary', listCategory: ['documentary'] },
    ];
    const categories = [{ id: 'animated', name: 'Hoạt Hình' }, { id: 'documentary', name: 'Tài Liệu' }];
    const types = [{ id: 'animation', name: 'Hoạt Hình' }];
    const selected = id => selectTopicMovies(topics.find(topic => topic.id === id), movies, categories, types).map(movie => movie.id).sort();
    assert.deepEqual(selected('phim-viet'), ['english-origin', 'viet']);
    assert.deepEqual(selected('hoat-hinh'), ['animation-genre', 'animation-type']);
    assert.deepEqual(selected('tai-lieu'), ['documentary']);
});

test('Visibility accepts booleans for known topics and rejects arbitrary legacy definitions', () => {
    assert.deepEqual(topicEnabledOverrides({ 'hai-huoc-thu-gian': false, 'phim-hot': false, 'vo-thuat-dinh-cao': 'false' }), { 'hai-huoc-thu-gian': false });
    const catalog = { Movies: [], Topics: curatedTopics({ 'hai-huoc-thu-gian': false }) };
    const prepared = prepareCatalog(catalog);
    for (const version of [prepared, prepareCatalog(prepared.catalog)]) {
        assert.equal(resolvePublicPage('/topic/hai-huoc-thu-gian', version).status, 404);
        assert.ok(!resolvePublicPage('/topic', version).items.some(item => item.id === 'hai-huoc-thu-gian'));
        assert.ok(!indexableCatalogPaths(version).includes('/topic/hai-huoc-thu-gian'));
    }
    assert.equal(resolvePublicPage('/topic/phim-hot', prepared).status, 404);
});

test('Shared controls coalesce reads, refresh toggles and retain confirmed settings on quota failure', async () => {
    let time = 0, reads = 0, fail = false;
    const load = createTopicControlsLoader({ now: () => time, read: async () => { reads++; if (fail) throw new Error('quota'); return { 'hai-huoc-thu-gian': reads === 1 }; } });
    await Promise.all([load(), load()]); assert.equal(reads, 1);
    time = 30001; assert.equal((await load()).find(item => item.id === 'hai-huoc-thu-gian').enabled, false);
    fail = true; time = 60002;
    assert.equal((await load()).find(item => item.id === 'hai-huoc-thu-gian').enabled, false);
    await load(); assert.equal(reads, 3);
});

test('Server HTML also blocks disabled direct topic URLs', async () => {
    const handler = createPageHandler({ readTemplate: async () => '<html><head></head><body><div id="root"></div></body></html>', readCatalog: async () => ({ Movies: [] }), readTopics: async () => curatedTopics({ 'hai-huoc-thu-gian': false }) });
    const res = { code: 0, setHeader() {}, status(code) { this.code = code; return this; }, end() {} };
    await handler({ method: 'GET', url: '/topic/hai-huoc-thu-gian' }, res);
    assert.equal(res.code, 404);
});
