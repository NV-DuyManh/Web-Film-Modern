import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCatalog } from '../../server/seo/catalog.js';
import { catalogPage } from './publicCatalogPage.js';
import { homeCatalog } from './homeCatalog.js';
import { applyCatalogChanges } from '../../scripts/lib/catalogDelta.mjs';
import { nextDailyCrawlerJob, vietnamDay } from './dailyCrawler.js';
import { createPublicCatalogCache } from '../services/publicCatalogCache.js';
import { changesPublicCatalog } from './publicCatalogFields.js';

const fixture = count => ({ Movies: Array.from({ length: count }, (_, i) => ({ id: `m${i}`, slug: `movie-${i}`, name: `Movie ${i}`,
    otherName: i === count - 1 ? 'Phim kiểm tra cuối danh sách' : `Phim ${i}`, createdAt: count - i, isHot: i < 8,
    countriesID: i % 2 ? 'Nhật Bản' : 'Trung Quốc', listCategory: ['action'], categoryTypeID: 'anime', planID: i % 2 ? 'premium' : 'free', rent: i % 2 ? 25000 : 0 })),
    Categories: [{ id: 'action', name: 'Hành Động' }], CategoryTypes: [{ id: 'anime', name: 'Anime' }], Actors: [], Authors: [], Characters: [], Topics: [] });

test('10,000 films stay complete across pagination/search while homepage payload has a fixed bound', () => {
    const prepared = prepareCatalog(fixture(10000)), ids = new Set();
    for (let page = 1; page <= 358; page++) {
        const result = catalogPage(prepared, new URLSearchParams({ kind: 'new', page: String(page) }));
        assert.equal(result.total, 10000); assert.equal(result.totalPages, 358);
        for (const movie of result.items) { assert.equal(ids.has(movie.id), false); ids.add(movie.id); }
    }
    assert.equal(ids.size, 10000);
    assert.equal(catalogPage(prepared, new URLSearchParams({ kind: 'new', q: 'kiem tra cuoi' })).items[0].id, 'm9999');
    const home = homeCatalog(prepared);
    assert.equal(home.sections.new.length, 15); assert.equal(home.sections['country:Nhật Bản'].length, 60);
    assert.ok(home.movies.length <= 345); assert.deepEqual(home.categoryIDs, ['action']);
    assert.equal(home.movies.find(movie => movie.planID === 'free').rent, 0);
});

test('daily crawler queues only once per Vietnam day, preserves active work and respects disabled scheduling', () => {
    const now = Date.parse('2026-10-09T18:23:00Z'), job = nextDailyCrawlerJob(null, now);
    assert.equal(vietnamDay(now), '2026-10-10'); assert.equal(job.options.pageStart, 1); assert.equal(job.options.pageEnd, 5);
    assert.equal(nextDailyCrawlerJob(job, now + 86400000), null);
    assert.equal(nextDailyCrawlerJob({ ...job, status: 'done' }, now + 1000), null);
    assert.ok(nextDailyCrawlerJob({ ...job, status: 'done' }, now + 86400000));
    assert.equal(nextDailyCrawlerJob({ enabled: false }, now), null);
});

test('incremental cache reads only changed records, handles deletions and excludes pending imports/private fields', async () => {
    const snapshot = { catalog: fixture(10000) }, reads = [];
    const markers = ['m9', 'm10', 'm11', 'm-new'].map((id, index) => ({ collection: 'Movies', recordID: id, cursor: { id, seconds: index + 1, nanoseconds: 0 } }));
    const result = await applyCatalogChanges(snapshot, { loadChanges: async cursor => cursor ? [] : markers, readRecord: async (_, id) => {
        reads.push(id);
        if (id === 'm10') return null;
        if (id === 'm11') return { crawlImportState: 'pending' };
        return { name: 'Updated ' + id, planID: 'premium', rent: 30000, password: 'private', paymentToken: 'private' };
    } });
    assert.deepEqual(reads, ['m9', 'm10', 'm11', 'm-new']); assert.equal(result.processed, 4);
    const movies = result.materialize().Movies;
    assert.equal(movies.length, 10000); assert.equal(movies.some(movie => movie.id === 'm10'), false);
    assert.equal(movies.find(movie => movie.id === 'm11').name, 'Movie 11');
    assert.equal(movies.find(movie => movie.id === 'm9').password, undefined);
    assert.equal(movies.find(movie => movie.id === 'm-new').rent, 30000);
    assert.equal(result.changeCursor.id, 'm-new');
});

test('budget exhaustion publishes completed deltas and keeps the failed change for retry', async () => {
    const markers = ['m1', 'm2', 'm3'].map((id, i) => ({ collection: 'Movies', recordID: id, cursor: { id, seconds: i, nanoseconds: 0 } }));
    const result = await applyCatalogChanges({ catalog: fixture(4) }, { loadChanges: async () => markers,
        readRecord: async (_, id) => { if (id === 'm2') throw Object.assign(new Error('budget'), { code: 'background-quota' }); return { name: 'Changed' }; } });
    assert.equal(result.waiting, true); assert.equal(result.processed, 1); assert.equal(result.changeCursor.id, 'm1');
    assert.equal(result.materialize().Movies.find(movie => movie.id === 'm2').name, 'Movie 2');
});

test('cached homepage coalesces requests and does not download the entire Movies collection', async () => {
    const version = '1234567890abcdef', urls = [], home = homeCatalog(prepareCatalog(fixture(10000)));
    const cache = createPublicCatalogCache({ fetchFn: async url => { urls.push(url); return { ok: true, json: async () => url.endsWith('manifest.json') ? { version } : { version, ...home } }; } });
    const [one, two] = await Promise.all([cache.load('Home'), cache.load('Home')]);
    assert.equal(one, two); assert.equal(urls.length, 2); assert.equal(urls.some(url => url.includes('Movies-')), false);
    assert.equal(changesPublicCatalog('Movies', { views: 10, episodeMetadataVersion: 5 }), false);
    assert.equal(changesPublicCatalog('Movies', { rent: 30000 }), true);
    assert.equal(changesPublicCatalog('Users', { name: 'private' }), false);
});

test('confirmed movie edits and deletes stay visible through a stale index refresh until CDN publication catches up', async () => {
    let clock = 1000000;
    let items = [{ id: 'm1', name: 'Old title', slug: 'old-title' }, { id: 'm2', name: 'Second' }];
    const version = '1234567890abcdef';
    const cache = createPublicCatalogCache({ now: () => clock, fetchFn: async url => ({ ok: true, json: async () => url.endsWith('manifest.json') ? { version } : { version, items } }) });
    await cache.load('MovieIndex');
    cache.patch('Movies', { id: 'm1', name: 'New title', slug: 'new-title' });
    cache.patch('Movies', { id: 'm2' }, true);
    cache.patch('Movies', { id: 'm3', name: 'New film', slug: 'new-film' });
    clock += 300001;
    assert.deepEqual((await cache.load('MovieIndex')).map(item => item.name), ['New title', 'New film']);
    items = [{ id: 'm1', name: 'New title', slug: 'new-title' }, { id: 'm3', name: 'New film', slug: 'new-film' }];
    clock += 300001;
    assert.deepEqual(await cache.load('MovieIndex'), items);
    // Once a change is published, a later server edit is authoritative again.
    items = [{ id: 'm1', name: 'Server title', slug: 'new-title' }];
    clock += 300001;
    assert.deepEqual(await cache.load('MovieIndex'), items);
});
