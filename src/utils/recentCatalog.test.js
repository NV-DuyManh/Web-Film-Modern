import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeRecentCatalog, recentMoviesSince, applyRecentMovies, applyRecentHome } from './recentCatalog.js';
import { createPublicCatalogCache } from '../services/publicCatalogCache.js';
import { createRecentCatalogReader } from '../../server/seo/recentCatalog.js';
import { createCatalogPageHandler } from '../../api/catalog-page.js';
import { createPublicCatalogHandler } from '../../api/public-catalog.js';

const movie = { id: 'imported', name: 'All of Us Are Dead', otherName: 'Ngôi Trường Xác Sống', slug: 'ngoi-truong-xac-song', createdAt: '2026-10-11T04:18:12Z', countriesID: 'Hàn Quốc', categoryTypeID: 'series', endEpisode: 12 };
const publishedAt = '2026-10-11T03:00:00Z';
const importedAt = Date.parse('2026-10-11T04:18:25Z');

test('recent cache is bounded, strips private fields and yields to published records without losing unpublished imports', () => {
    let updates = [];
    for (let i = 0; i < 250; i++) updates = mergeRecentCatalog(updates, { ...movie, id: `film-${i}`, password: 'private', email: 'private', description: 'x'.repeat(10000), gallery: ['large'] }, importedAt + i);
    assert.equal(updates.length, 200);
    assert.ok(new TextEncoder().encode(JSON.stringify(updates)).length <= 500000);
    assert.equal(updates[0].movie.password, undefined);
    assert.equal(updates[0].movie.email, undefined);
    assert.equal(updates[0].movie.gallery, undefined);
    assert.equal(updates[0].movie.description.length, 400);
    const one = mergeRecentCatalog([], movie, importedAt);
    assert.equal(recentMoviesSince(one, publishedAt).length, 1);
    assert.equal(recentMoviesSince(one, '2026-10-11T05:00:00Z', [movie]).length, 0);
    assert.equal(recentMoviesSince(one, '2026-10-11T05:00:00Z', []).length, 1);
});

test('a completed import reaches fresh browser search, collection and homepage despite an older deployment', async () => {
    let updateReads = 0, clock = importedAt;
    const version = '1234567890abcdef';
    const home = { movies: [], sections: { new: [] }, categoryTypes: [{ id: 'series', name: 'Phim Bộ' }] };
    const updates = mergeRecentCatalog([], movie, importedAt);
    const cache = createPublicCatalogCache({ now: () => clock, loadUpdates: async () => { updateReads++; return { updates }; }, fetchFn: async url => ({ ok: true, json: async () => url.endsWith('manifest.json')
        ? { version, generatedAt: publishedAt, collections: { Movies: { pages: 1 } } }
        : url.endsWith('home.json') ? { version, ...home } : { version, items: [] } }) });
    const [index, collection, result] = await Promise.all(['MovieIndex', 'Movies', 'Home'].map(name => cache.load(name)));
    assert.equal(index[0].slug, movie.slug);
    assert.equal(collection[0].endEpisode, 12);
    assert.equal(result.sections.new[0], movie.id);
    assert.equal(result.sections['country:Hàn Quốc'][0], movie.id);
    assert.equal(updateReads, 1);
    clock += 60001;
    await cache.load('Home'); assert.equal(updateReads, 2);
    assert.equal(applyRecentMovies([movie], [movie]).length, 1);
});

test('same-tab completion updates the homepage immediately and failures preserve the published catalog', async () => {
    const home = { movies: [], sections: { new: [] }, categoryTypes: [], categoryIDs: ['not-on-homepage'] };
    const version = '1234567890abcdef';
    const cache = createPublicCatalogCache({ loadUpdates: async () => { throw new Error('quota'); }, fetchFn: async url => ({ ok: true, json: async () => url.endsWith('manifest.json') ? { version, generatedAt: publishedAt } : { version, ...home } }) });
    await cache.load('Home');
    let notified;
    cache.subscribe('Home', value => { notified = value; });
    cache.patch('Movies', movie);
    assert.equal(notified.sections.new[0], movie.id);
    assert.ok(notified.categoryIDs.includes('not-on-homepage'));
    assert.equal((await cache.load('Home')).movies[0].id, movie.id);
    assert.equal(applyRecentHome(home, []).movies.length, 0);
});

test('server reader shares a single document read per minute and keeps its last good result during quota errors', async () => {
    let reads = 0, clock = importedAt, unavailable = false;
    const read = createRecentCatalogReader({ now: () => clock, read: async () => { reads++; if (unavailable) throw new Error('quota'); return [{ at: importedAt, movie: { ...movie, password: 'private' } }]; } });
    const [one, two] = await Promise.all([read(), read()]);
    assert.equal(reads, 1); assert.equal(one, two); assert.equal(one[0].movie.password, undefined);
    unavailable = true; clock += 60001;
    assert.deepEqual(await read(), one); assert.equal(reads, 2);
});

test('public listing refresh includes the imported movie when live metadata changes', async () => {
    let catalog = { Movies: [], CategoryTypes: [], Categories: [] };
    const handler = createCatalogPageHandler({ readCatalog: async () => catalog });
    const response = () => ({ status(code) { this.code = code; return this; }, setHeader() {}, end(body) { this.body = body; return this; } });
    const first = response(); await handler({ method: 'GET', url: '/api/catalog-page?kind=new&q=ngoi+truong+xac+song' }, first);
    assert.equal(JSON.parse(first.body).total, 0);
    catalog = { ...catalog, Movies: [movie] };
    const second = response(); await handler({ method: 'GET', url: '/api/catalog-page?kind=new&q=ngoi+truong+xac+song' }, second);
    assert.equal(JSON.parse(second.body).items[0].id, movie.id);
});

test('recent metadata uses the existing public endpoint without loading the full snapshot', async () => {
    const updates = mergeRecentCatalog([], movie, importedAt);
    const handler = createPublicCatalogHandler({ readSnapshot: async () => { throw new Error('Snapshot must not be read'); }, readUpdates: async () => updates });
    const response = { status(code) { this.code = code; return this; }, setHeader() {}, end(body) { this.body = body; return this; } };
    await handler({ method: 'GET', url: '/api/public-catalog?updates=1' }, response);
    assert.equal(response.code, 200);
    assert.equal(JSON.parse(response.body).updates[0].movie.id, movie.id);
});
