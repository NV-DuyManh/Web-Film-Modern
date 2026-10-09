import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuotaCounter, quotaDay, nextQuotaReset, BackgroundQuotaError } from './backgroundQuota.js';
import { createPublicCatalogCache } from '../services/publicCatalogCache.js';
import { episodeSourceFingerprint } from './episodeSourceFingerprint.js';
import { prepareCatalog } from '../../server/seo/catalog.js';
import { catalogPage, createCatalogPageHandler } from '../../api/catalog-page.js';
import { publicCatalogRecord } from '../../scripts/lib/publicCatalog.mjs';
import { createPublicCatalogHandler } from '../../api/public-catalog.js';
import { createCrawlerJob, crawlOptions } from './crawlerJob.js';
import { runCrawlerJob } from '../../scripts/lib/crawlerRunner.mjs';
import { createEpisodeMetadataHandler } from '../../api/episode-metadata.js';
import { importEpisodeBatches } from '../../scripts/lib/crawlerEpisodes.mjs';

const response = () => ({ code: 0, headers: {}, status(code) { this.code = code; return this; }, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = body; return this; } });
const fixture = () => prepareCatalog({ Movies: Array.from({ length: 63 }, (_, i) => ({ id: `m${i}`, slug: `film-${i}`, name: `Movie ${i}`, otherName: i === 30 ? 'Đứa Con Của Thời Tiết' : `Phim ${i}`, planID: i % 2 ? 'premium' : 'free', rent: i % 2 ? 25000 : 0, createdAt: 10000 - i, listCategory: ['action'], countriesID: 'Nhật Bản', categoryTypeID: 'series', endEpisode: 12 })), Categories: [{ id: 'action', name: 'Hành Động' }], CategoryTypes: [{ id: 'series', name: 'Phim Bộ' }], Actors: [], Authors: [], Characters: [], Topics: [] });

test('a long series resumes after its last saved batch and restarts safely when the source changes', async () => {
    const episodes = Array.from({ length: 6100 }, (_, id) => ({ id }));
    const previous = {}, written = [];
    let remaining = 28;
    const run = signature => importEpisodeBatches({ episodes, signature, previous,
        write: async batch => { if (!remaining--) throw new BackgroundQuotaError(); written.push(...batch.map(item => item.id)); },
        saveProgress: async values => Object.assign(previous, values),
    });
    await assert.rejects(run('source-v1'), BackgroundQuotaError);
    assert.equal(previous.crawlEpisodeCursor, 5600);
    remaining = 40; await run('source-v1');
    assert.equal(written.length, 6100); assert.equal(new Set(written).size, 6100);
    written.length = 0; remaining = 40; await run('source-v2');
    assert.equal(written.length, 6100); assert.equal(previous.crawlEpisodeCursor, 6100);
});

test('shared background budget refuses extra work without resetting spent quota; Pacific midnight resets it', () => {
    let now = Date.parse('2026-10-09T20:00:00Z');
    const counter = createQuotaCounter({}, { now: () => now, readLimit: 5, writeLimit: 3 });
    counter.charge(4, 2);
    assert.throws(() => counter.charge(2, 0), BackgroundQuotaError);
    assert.equal(counter.snapshot().reads, 4);
    const resumed = createQuotaCounter(counter.snapshot(), { now: () => now, readLimit: 5, writeLimit: 3 });
    assert.throws(() => resumed.charge(0, 2), BackgroundQuotaError);
    now = nextQuotaReset(now);
    counter.charge(1, 1);
    assert.equal(counter.snapshot().reads, 1);
    assert.equal(counter.snapshot().writes, 1);
});

test('quota reset follows Pacific DST rather than the computer timezone or a 24 hour guess', () => {
    const spring = Date.parse('2026-03-08T08:00:00Z');
    assert.equal(new Date(nextQuotaReset(spring)).toISOString(), '2026-03-09T07:00:00.000Z');
    assert.equal(quotaDay(Date.parse('2026-10-09T06:59:00Z')), '2026-10-08');
    assert.equal(quotaDay(Date.parse('2026-10-09T07:00:00Z')), '2026-10-09');
});

test('a quota pause saves the current item and resumes on the next day without retrying or skipping it', async () => {
    let now = 1000, remaining = true;
    let job = createCrawlerJob(crawlOptions(1, 1, 500), 'budget-job', now);
    const imported = [];
    const run = () => runCrawlerJob({ now: () => now, sleep: async () => {},
        store: { read: async () => structuredClone(job), patch: async (_, values) => { Object.assign(job, structuredClone(values)); return true; } },
        fetchPage: async () => [{ slug: 'film-one' }, { slug: 'film-two' }],
        budgetPauseAt: () => remaining ? 0 : 2000,
        importMovie: async item => { imported.push(item.slug); remaining = false; return { movies: 1 }; },
    });
    assert.equal((await run()).state, 'budget-wait');
    assert.equal(job.cursor.index, 1);
    assert.equal(job.status, 'queued');
    assert.equal((await run()).state, 'budget-wait');
    assert.equal(imported.length, 1);
    now = 2001; remaining = true;
    await run();
    assert.equal(new Set(imported).size, 2);
    assert.equal(job.stats.errors, 0);
});

test('public pages paginate the whole catalog, preserve paid/free fields and search accents before slicing', () => {
    const catalog = fixture();
    const first = catalogPage(catalog, new URLSearchParams('kind=new&page=1&limit=28'));
    const second = catalogPage(catalog, new URLSearchParams('kind=new&page=2&limit=28'));
    assert.equal(first.total, 63); assert.equal(first.totalPages, 3);
    assert.equal(first.items.length, 28); assert.equal(second.items[0].id, 'm28');
    assert.equal(first.items[1].planID, 'premium'); assert.equal(first.items[1].rent, 25000);
    const found = catalogPage(catalog, new URLSearchParams('kind=new&q=dua+con&page=1'));
    assert.equal(found.total, 1); assert.equal(found.items[0].id, 'm30');
    assert.equal(catalogPage(catalog, new URLSearchParams('kind=category&name=Hành+Động')).total, 63);
    assert.equal(catalogPage(catalog, new URLSearchParams('kind=country&name=Nhật+Bản')).total, 63);
    assert.equal(catalogPage(catalog, new URLSearchParams('kind=anime')).total, 0);
    assert.throws(() => catalogPage(catalog, new URLSearchParams('kind=Users')));
});

test('catalog page handler reads the deployment snapshot once and has no database fallback', async () => {
    let reads = 0;
    const handler = createCatalogPageHandler({ readSnapshot: async () => { reads++; return JSON.stringify({ catalog: fixture().catalog }); } });
    for (const url of ['/api/catalog-page?kind=new&page=1', '/api/catalog-page?kind=new&page=2']) {
        const res = response(); await handler({ method: 'GET', url }, res);
        assert.equal(res.code, 200); assert.match(res.headers['Cache-Control'], /public/);
        assert.equal(JSON.parse(res.body).items.length, 28);
    }
    assert.equal(reads, 1);
});

test('CDN collection requests coalesce, stay bounded by chunk size and never accept private collections', async () => {
    const calls = [];
    const cache = createPublicCatalogCache({ fetchFn: async url => {
        calls.push(url);
        return { ok: true, json: async () => url.includes('manifest') ? { version: '0123456789abcdef', collections: { Movies: { pages: 2 } } } : { version: '0123456789abcdef', items: [{ id: url.endsWith('-1.json') ? 'one' : 'two' }] } };
    } });
    const [a, b] = await Promise.all([cache.load('Movies'), cache.load('Movies')]);
    assert.deepEqual(a, b); assert.equal(a.length, 2); assert.equal(calls.length, 3);
    await cache.load('Movies'); assert.equal(calls.length, 3);
    await assert.rejects(cache.load('Users'), /not public/);
    assert.ok(calls.every(url => url.startsWith('/catalog/')));
});

test('offline public cache preserves browsing without scanning Firestore or caching account data', async () => {
    const storage = new Map([['mfilm-public-Movies', JSON.stringify([{ id: 'saved', planID: 'premium', rent: 25000 }])]]);
    const cache = createPublicCatalogCache({ storage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }, fetchFn: async () => { throw new Error('Offline'); } });
    assert.equal((await cache.load('Movies'))[0].id, 'saved');
    await assert.rejects(cache.load('RentMovies'), /not public/);
    const publicRecord = publicCatalogRecord({ id: 'm', name: 'Film', planID: 'premium', rent: 25000, password: 'secret', rentedMovies: ['private'], email: 'private', firebaseUid: 'private' });
    assert.equal(publicRecord.planID, 'premium'); assert.equal(publicRecord.rent, 25000);
    for (const field of ['password', 'email', 'rentedMovies', 'firebaseUid']) assert.equal(publicRecord[field], undefined);
});

test('even an old public snapshot is served without a visitor-triggered collection scan', async () => {
    const handler = createPublicCatalogHandler({ now: () => Date.parse('2026-10-09'), readSnapshot: async () => JSON.stringify({ generatedAt: '2025-01-01', catalog: { Movies: [{ id: 'cached' }] } }) });
    const res = response(); await handler({ method: 'GET' }, res);
    assert.equal(res.code, 200); assert.equal(JSON.parse(res.body).catalog.Movies[0].id, 'cached');
});

test('episode signatures avoid repeated reads but detect new episodes and repaired stream links', async () => {
    const source = { status: 'ongoing', episode_total: '12', lang: 'Vietsub' };
    const servers = [{ server_data: [{ name: '1', link_embed: 'https://film.test/embed', link_m3u8: 'https://film.test/stream' }] }];
    const first = await episodeSourceFingerprint(source, servers);
    assert.equal(first, await episodeSourceFingerprint({ ...source }, structuredClone(servers)));
    const changed = structuredClone(servers); changed[0].server_data[0].link_m3u8 = 'https://film.test/new-stream';
    assert.notEqual(first, await episodeSourceFingerprint(source, changed));
    changed[0].server_data.push({ name: '2', link_embed: 'https://film.test/2' });
    assert.notEqual(first, await episodeSourceFingerprint(source, changed));
});

test('episode metadata cache is shared across server instances, omits stream URLs and rebuilds after an episode edit', async () => {
    let stored, reads = 0, version = 1;
    const dependencies = {
        readMovie: async () => ({ episodeMetadataVersion: version }), readCache: async () => stored,
        readEpisodes: async () => { reads++; return [{ id: 'ep1', movieID: 'movie', nameEpisode: 'Tập 1', numberEpisode: 1, url: 'https://private-stream/embed', urlM3u8: 'https://private-stream/hls', url2: 'https://private-stream/server2' }]; },
        saveCache: async (_, value) => { stored = value; }, now: () => 1000,
    };
    const first = response(); await createEpisodeMetadataHandler(dependencies)({ method: 'GET', url: '/api/episode-metadata?movieId=movie' }, first);
    assert.equal(first.code, 200); assert.equal(reads, 1);
    assert.equal(JSON.parse(first.body).items[0].hasSecondServer, true);
    assert.equal(JSON.parse(first.body).items[0].hasFirstServer, true);
    assert.ok(!first.body.includes('private-stream')); assert.ok(!Object.hasOwn(stored.items[0], 'url'));
    const second = response(); await createEpisodeMetadataHandler(dependencies)({ method: 'GET', url: '/api/episode-metadata?movieId=movie' }, second);
    assert.equal(reads, 1);
    version = 2;
    await createEpisodeMetadataHandler(dependencies)({ method: 'GET', url: '/api/episode-metadata?movieId=movie' }, response());
    assert.equal(reads, 2);
});

test('cached episode numbers remain available during a quota error; invalid IDs never touch the database', async () => {
    let time = 1000, offline = false, calls = 0;
    const handler = createEpisodeMetadataHandler({ now: () => time, readMovie: async () => { calls++; if (offline) throw new Error('Quota exceeded'); return {}; }, readCache: async () => null,
        readEpisodes: async () => [{ id: 'e', movieID: 'm', nameEpisode: 'OVA 1', numberEpisode: 1, url: 'https://film.test' }], saveCache: async () => {} });
    const invalid = response(); await handler({ method: 'GET', url: '/api/episode-metadata?movieId=../Users' }, invalid);
    assert.equal(invalid.code, 400); assert.equal(calls, 0);
    const first = response(); await handler({ method: 'GET', url: '/api/episode-metadata?movieId=m' }, first);
    time += 300001; offline = true;
    const cached = response(); await handler({ method: 'GET', url: '/api/episode-metadata?movieId=m' }, cached);
    assert.equal(cached.code, 200); assert.equal(JSON.parse(cached.body).items[0].nameEpisode, 'OVA 1');
});

test('older episodes without a label still render correctly when optional cache persistence fails synchronously', async () => {
    const handler = createEpisodeMetadataHandler({ readMovie: async () => ({}), readCache: async () => null,
        readEpisodes: async () => [{ id: 'old', movieID: 'm', numberEpisode: 12, url: 'https://film.test' }],
        saveCache: () => { throw new Error('Cache storage unavailable'); } });
    const res = response(); await handler({ method: 'GET', url: '/api/episode-metadata?movieId=m' }, res);
    assert.equal(res.code, 200); assert.equal(JSON.parse(res.body).items[0].nameEpisode, '12');
});
