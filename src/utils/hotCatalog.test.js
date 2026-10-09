import test from 'node:test';
import assert from 'node:assert/strict';
import { hotCatalogEdit, hotCatalogMovies } from './hotCatalog.js';
import { createHomeHotHandler } from '../../api/home-hot.js';
import { createPublicCatalogCache } from '../services/publicCatalogCache.js';

const films = [{ id: 'old', name: 'Old hot', isHot: true }, { id: 'other', name: 'Other', isHot: true }, { id: 'cold', name: 'Cold', isHot: false }];
const response = () => ({ code: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, end(body) { this.body = body; return this; } });

test('false admin choice beats the old snapshot, enabling/deleting works and private fields never reach Hot', () => {
    const added = hotCatalogEdit({ id: 'new', name: 'New hot', isHot: true, password: 'secret', email: 'private' });
    const items = hotCatalogMovies(films, { old: { isHot: false }, cold: { isHot: true }, new: added });
    assert.deepEqual(new Set(items.map(m => m.id)), new Set(['other', 'cold', 'new']));
    assert.equal(items.find(m => m.id === 'new').password, undefined);
    assert.equal(added.movieJson.includes('private'), false);
    assert.deepEqual(hotCatalogEdit({ id: 'old' }, true), { isHot: false });
    assert.equal(hotCatalogEdit({ id: 'old', views: 2 }), null);
    assert.equal(hotCatalogMovies([{ id: 'a', isHot: 'false' }]).length, 0);
});

test('Hot endpoint shares one controls read, refreshes after a minute and retains confirmed choices during quota errors', async () => {
    let clock = 100000, reads = 0, fail = false;
    const handler = createHomeHotHandler({ now: () => clock, readSnapshot: async () => JSON.stringify({ catalog: { Movies: films } }),
        readEdits: async () => { reads++; if (fail) throw new Error('Quota exceeded'); return { old: { isHot: false } }; } });
    const one = response(), two = response();
    await Promise.all([handler({ method: 'GET' }, one), handler({ method: 'GET' }, two)]);
    assert.equal(reads, 1);
    assert.deepEqual(JSON.parse(one.body).items.map(m => m.id), ['other']);
    clock += 60001; fail = true;
    const outage = response(); await handler({ method: 'GET' }, outage);
    assert.equal(reads, 2); assert.deepEqual(JSON.parse(outage.body).items.map(m => m.id), ['other']);
    clock += 60001; await handler({ method: 'GET' }, response()); assert.equal(reads, 2);
    const post = response(); await handler({ method: 'POST' }, post); assert.equal(post.code, 405);
    assert.match(one.headers['Cache-Control'], /s-maxage=60/);
});

test('browser Hot cache removes confirmed admin edits immediately and does not revive them from a stale response', async () => {
    let clock = 100000, calls = 0, items = films.filter(m => m.isHot), observed;
    const cache = createPublicCatalogCache({ now: () => clock, fetchFn: async url => {
        assert.equal(url, '/api/home-hot'); calls++;
        return { ok: true, json: async () => ({ items }) };
    } });
    await Promise.all([cache.load('Hot'), cache.load('Hot')]); assert.equal(calls, 1);
    cache.subscribe('Hot', value => { observed = value; });
    cache.patch('Movies', { id: 'old', isHot: false });
    assert.deepEqual(observed.map(m => m.id), ['other']);
    clock += 60001; assert.deepEqual((await cache.load('Hot')).map(m => m.id), ['other']);
    items = [films[1]]; clock += 60001; await cache.load('Hot');
    // Once the shared endpoint has acknowledged the change, a later admin enable wins.
    items = films.filter(m => m.isHot); clock += 60001;
    assert.deepEqual(new Set((await cache.load('Hot')).map(m => m.id)), new Set(['old', 'other']));
    cache.patch('Movies', { id: 'other' }, true);
    assert.deepEqual(observed.map(m => m.id), ['old']);
});

test('an empty authoritative Hot list stays empty; failures fall back to the bounded public Home cache', async () => {
    const empty = createPublicCatalogCache({ fetchFn: async () => ({ ok: true, json: async () => ({ items: [] }) }) });
    assert.deepEqual(await empty.load('Hot'), []);
    const version = '1234567890abcdef', urls = [];
    const offline = createPublicCatalogCache({ fetchFn: async url => {
        urls.push(url); if (url === '/api/home-hot') throw new Error('Offline');
        return { ok: true, json: async () => url.endsWith('manifest.json') ? { version } : { version, movies: films, sections: { hot: ['old', 'other'] } } };
    } });
    assert.equal((await offline.load('Hot')).length, 2);
    assert.equal(urls.some(url => url.includes('Movies-')), false);
});
