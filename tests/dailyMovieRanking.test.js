import test from 'node:test';
import assert from 'node:assert/strict';
import { FieldValue } from 'firebase-admin/firestore';
import { ACTIVITY_COOLDOWN_MS, createWatchMeter, rankDailyMovies, vietnamDay, withDailyRankingFallback } from '../src/utils/dailyMovieRanking.js';
import { createDailyActivityStore } from '../server/analytics/dailyActivity.js';
import { createDailyRankingHandler } from '../server/analytics/dailyRankingHandler.js';
import { createMovieActivityTracker } from '../src/services/dailyMovieActivity.js';

// Serialized transactions, atomic increments and merge semantics match the
// Firestore contract. The API tests use this durable store across handler instances.
function database() {
    const data = new Map();
    let queue = Promise.resolve();
    const snapshot = path => ({ data: () => structuredClone(data.get(path)) });
    const reference = path => ({ path, collection: name => collection(`${path}/${name}`) });
    const collection = path => ({ doc: id => reference(`${path}/${id}`) });
    function merge(previous = {}, values) {
        const next = { ...previous };
        for (const [key, value] of Object.entries(values)) {
            if (value?.isEqual?.(FieldValue.increment(1))) next[key] = (Number(next[key]) || 0) + 1;
            else next[key] = value && typeof value === 'object' ? merge(next[key], value) : value;
        }
        return next;
    }
    return { data, collection,
        runTransaction(callback) {
            const result = queue.then(async () => {
                const writes = [];
                const value = await callback({
                    get: async ref => { assert.equal(writes.length, 0); return snapshot(ref.path); },
                    set: (ref, value, options) => writes.push({ ref, value, merge: options?.merge }),
                });
                for (const item of writes) data.set(item.ref.path, merge(item.merge ? data.get(item.ref.path) : {}, item.value));
                return value;
            });
            queue = result.catch(() => {});
            return result;
        },
    };
}
function fixture() {
    const db = database();
    const persistence = createDailyActivityStore(db);
    const store = { record: persistence.record, read: async day => [...db.data.entries()].filter(([path]) => path.includes(`/Days/${day}/Shards/`)).map(([, row]) => row) };
    const movies = Array.from({ length: 15 }, (_, i) => ({ id: `movie-${i}`, slug: `film-${i}`, name: `Film ${i}`, views: 99999 - i }));
    let at = Date.parse('2026-10-26T16:58:00Z'); // 23:58 Vietnam.
    let reads = 0;
    const create = () => createDailyRankingHandler({ readCatalog: async () => movies, now: () => at,
        getStore: async () => ({ ...store, read: async day => { reads++; return store.read(day); } }) });
    async function request(handler, method = 'GET', body, headers = {}) {
        let status, payload, responseHeaders = {};
        await handler({ method, url: '/api/daily-ranking', body, headers: { host: 'mfilm.online', 'user-agent': 'Mozilla/5.0', ...headers } }, {
            setHeader: (key, value) => { responseHeaders[key] = value; },
            status(value) { status = value; return this; },
            end(value) { payload = value ? JSON.parse(value) : null; },
        });
        return { status, payload, headers: responseHeaders };
    }
    const body = (events, visitorId = 'visitor_123456789012345') => ({ visitorId, events: events.map(([movieId, kind]) => ({ movieId, kind, at })) });
    return { db, store, create, request, body, now: () => at, reads: () => reads, advance: ms => { at += ms; } };
}

test('ranking uses only counted daily signals, weights viewing higher, merges shards and limits to 10', () => {
    const rows = rankDailyMovies([{ movies: { click: { click: 4 }, open: { open: 3 }, watch: { watch: 2 } } }, { movies: { watch: { watch: 1 } } }]);
    assert.deepEqual(rows.map(row => [row.movieId, row.score]), [['watch', 15], ['open', 6], ['click', 4]]);
    assert.equal(rankDailyMovies([{ movies: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`m${i}`, { open: i + 1 }])) }]).length, 10);
    assert.deepEqual(rankDailyMovies([{ movies: { zero: { views: 999999 } } }]), []);
});

test('empty daily rankings use the previous list by descending views, partial rankings fill ten without duplicating or fabricating daily counts', () => {
    const previous = Array.from({ length: 10 }, (_, index) => ({ id: `m${index}`, views: index + 1 }));
    const original = structuredClone(previous);
    const empty = withDailyRankingFallback([], previous);
    assert.equal(empty.length, 10);
    assert.deepEqual(empty.map(movie => movie.views), [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    assert.ok(empty.every(movie => movie.dailyActivity === null));
    const daily = [{ id: 'm1', dailyActivity: { score: 9, watch: 1 } }, { id: 'new', dailyActivity: { score: 3, watch: 0 } }];
    const filled = withDailyRankingFallback(daily, previous);
    assert.equal(filled.length, 10);
    assert.equal(new Set(filled.map(movie => movie.id)).size, 10);
    assert.deepEqual(filled.slice(0, 2), daily);
    assert.deepEqual(previous, original);
});

test('watching requires 30 elapsed playback seconds; seeking, paused time and repeated callbacks do not inflate it', () => {
    let at = 1000;
    const meter = createWatchMeter(() => at);
    assert.equal(meter.sample(0), false);
    at += 1000; assert.equal(meter.sample(1800), false);
    at += 60000; assert.equal(meter.sample(1800), false);
    for (let i = 1; i < 30; i++) { at += 1000; assert.equal(meter.sample(1800 + i), false); }
    at += 1000; assert.equal(meter.sample(1830), true);
    at += 1000; assert.equal(meter.sample(1831), false);
    meter.reset(); at += 1000; assert.equal(meter.sample(1832), false);
});

test('the player cadence also qualifies slow playback without counting a large seek or a long pause', () => {
    let at = 1000;
    const meter = createWatchMeter(() => at);
    meter.sample(0);
    for (let i = 1; i < 10; i++) { at += 6000; assert.equal(meter.sample(i * 3), false); }
    at += 6000; assert.equal(meter.sample(30), true);
});

test('guest and signed-in browser activity uses the same store, resolves slugs, rejects duplicates across concurrent cold functions', async () => {
    const f = fixture(), first = f.create(), second = f.create();
    const payload = f.body([['film-0', 'click'], ['movie-0', 'open'], ['movie-0', 'open'], ['movie-1', 'watch']]);
    const results = await Promise.all([f.request(first, 'POST', payload), f.request(second, 'POST', payload)]);
    assert.equal(results.reduce((sum, r) => sum + r.payload.accepted, 0), 3);
    assert.equal((await f.request(second, 'POST', f.body([['movie-0', 'open']], 'another_browser_1234567'))).payload.accepted, 1);
    const ranked = await f.request(f.create());
    assert.equal(ranked.status, 200);
    assert.deepEqual(ranked.payload.items.map(row => [row.id, row.dailyActivity.score]), [['movie-1', 5], ['movie-0', 5]]);
    assert.equal(ranked.payload.items.find(row => row.id === 'movie-0').dailyActivity.watch, 0);
    f.advance(ACTIVITY_COOLDOWN_MS);
    assert.equal((await f.request(first, 'POST', f.body([['movie-0', 'open']]))).payload.accepted, 1);
});

test('calendar switches at midnight in Vietnam, cached reads cannot leak yesterday, late batches stay on their actual day', async () => {
    const f = fixture(), handler = f.create();
    assert.equal(vietnamDay(f.now()), '2026-10-26');
    await f.request(handler, 'POST', f.body([['movie-0', 'open']]));
    assert.equal((await f.request(handler)).payload.items.length, 1);
    await f.request(handler); assert.equal(f.reads(), 1);
    f.advance(90000);
    const late = f.body([['movie-2', 'open']]);
    f.advance(31000);
    assert.equal(vietnamDay(f.now()), '2026-10-27');
    await f.request(handler, 'POST', late);
    assert.deepEqual((await f.request(handler)).payload.items, []);
    await f.request(handler, 'POST', f.body([['movie-0', 'open']]));
    assert.equal((await f.request(f.create())).payload.items[0].dailyActivity.open, 1);
});

test('API rejects forged scores, unknown movies, stale events and cross-origin posts; bots cannot affect ranking', async () => {
    const f = fixture(), handler = f.create();
    for (const events of [[['no-such-film', 'watch']], [['movie-0', 'score']]]) assert.equal((await f.request(handler, 'POST', f.body(events))).status, 400);
    const payload = f.body([['movie-0', 'watch']]);
    payload.events[0].at -= 300001;
    assert.equal((await f.request(handler, 'POST', payload)).status, 400);
    assert.equal((await f.request(handler, 'POST', f.body([['movie-0', 'open']]), { origin: 'https://another.example' })).status, 403);
    assert.equal((await f.request(handler, 'POST', f.body([['movie-0', 'open']]), { 'user-agent': 'Googlebot' })).payload.accepted, 0);
    assert.deepEqual((await f.request(handler)).payload.items, []);
});

test('storage failure returns an unavailable response rather than claiming an empty or fabricated top', async () => {
    const f = fixture();
    const handler = createDailyRankingHandler({ readCatalog: async () => [], getStore: async () => { throw new Error('quota'); } });
    const response = await f.request(handler);
    assert.equal(response.status, 503);
    assert.equal(response.headers['Cache-Control'], 'no-store');
});

test('client batches signals, survives storage denial, retries failed writes and suppresses reload duplicates', async () => {
    let at = Date.parse('2026-10-26T14:00:00Z'), fail = true;
    const sent = [], values = new Map();
    const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
    const options = { storage, now: () => at, makeId: () => 'visitor_123456789012345', network: { onLine: true },
        win: { setTimeout: () => 1, clearTimeout() {} }, send: async (url, request) => { sent.push(JSON.parse(request.body)); return { ok: !fail, status: fail ? 503 : 202 }; } };
    const client = createMovieActivityTracker(options);
    client.track('movie-0', 'open'); client.track('movie-0', 'open'); client.track('film-0', 'click');
    await client.flush(); assert.equal(sent[0].events.length, 2);
    fail = false; await client.flush(); assert.deepEqual(sent[1], sent[0]);
    const reload = createMovieActivityTracker(options);
    reload.track('movie-0', 'open'); await reload.flush(); assert.equal(sent.length, 2);
    at += ACTIVITY_COOLDOWN_MS; reload.track('movie-0', 'open'); await reload.flush(); assert.equal(sent.length, 3);
    const privateClient = createMovieActivityTracker({ ...options, storage: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } } });
    privateClient.track('movie-2', 'open'); privateClient.track('movie-2', 'open');
    await privateClient.flush(); assert.equal(sent.at(-1).events.length, 1);
});
