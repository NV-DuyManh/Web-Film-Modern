import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicRequestCache } from '../src/services/publicRequestCache.js';
import { createSharedCatalogPolling } from '../src/utils/sharedCatalogPolling.js';
import { createPublicCatalogCache } from '../src/services/publicCatalogCache.js';

function storage() {
    const values = new Map();
    return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), values };
}
function locks() {
    const queues = new Map();
    return { request(key, callback) {
        const pending = (queues.get(key) || Promise.resolve()).then(callback);
        queues.set(key, pending.catch(() => {}));
        return pending;
    } };
}
const response = data => ({ ok: true, json: async () => data });

test('many components share one request and cached navigation remains instant without changing the freshness interval', async () => {
    let at = 100000, requests = 0;
    const cache = createPublicRequestCache({ now: () => at, fetchFn: async () => { requests++; return response({ items: ['hot'] }); } });
    const options = { maxAgeMs: 60000 };
    await Promise.all(Array.from({ length: 12 }, () => cache.read('/api/home-hot', options)));
    assert.equal(requests, 1);
    at += 59999;
    assert.deepEqual(await cache.read('/api/home-hot', options), { items: ['hot'] });
    assert.equal(requests, 1);
    at++;
    await cache.read('/api/home-hot', options);
    assert.equal(requests, 2);
});

test('three tabs coalesce public requests through browser locks and preserve the original response expiry', async () => {
    let at = 100000, requests = 0;
    const saved = storage(), sharedLocks = locks();
    const options = { now: () => at, storage: saved, locks: sharedLocks, fetchFn: async () => { requests++; return response({ items: ['new'] }); } };
    const tabs = Array.from({ length: 3 }, () => createPublicRequestCache(options));
    await Promise.all(tabs.map(tab => tab.read('/api/topics', { maxAgeMs: 30000 })));
    assert.equal(requests, 1);
    at += 30000;
    await Promise.all(tabs.map(tab => tab.read('/api/topics', { maxAgeMs: 30000 })));
    assert.equal(requests, 2);
    assert.equal(saved.values.size, 1);
});

test('blocked storage and unavailable locks do not break loading, and network failures can retry immediately', async () => {
    let requests = 0;
    const cache = createPublicRequestCache({ storage: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } },
        locks: { request: async () => { throw new Error('not available'); } },
        fetchFn: async () => { requests++; if (requests === 1) throw new Error('offline'); return response({ items: [] }); } });
    await assert.rejects(cache.read('/api/home-hot'), /offline/);
    assert.deepEqual(await cache.read('/api/home-hot'), { items: [] });
    assert.equal(requests, 2);
});

test('midnight validation bypasses both memory and another tab’s previous-day ranking', async () => {
    let date = '2026-10-28', requests = 0;
    const cache = createPublicRequestCache({ storage: storage(), fetchFn: async () => { requests++; return response({ date, items: [] }); } });
    const options = { accept: data => data.date === date };
    await cache.read('/api/daily-ranking', options);
    date = '2026-10-29';
    assert.equal((await cache.read('/api/daily-ranking', options)).date, date);
    assert.equal(requests, 2);
});

test('private endpoints are rejected and oversized public responses stay in memory', async () => {
    const saved = storage();
    let requests = 0;
    const cache = createPublicRequestCache({ storage: saved, maxStoredBytes: 100, fetchFn: async () => { requests++; return response({ items: ['x'.repeat(1000)] }); } });
    await assert.rejects(cache.read('/api/accounts'), /approved public/);
    await cache.read('/api/home-hot');
    await cache.read('/api/home-hot');
    assert.equal(saved.values.size, 0);
    assert.equal(requests, 1);
});

test('shared sections use one scheduler, preserve patches and stop requests after the last visible reader leaves', async () => {
    let tick, patch, starts = 0, stops = 0, loads = 0;
    const subscribe = createSharedCatalogPolling({
        load: async () => { loads++; return { version: loads }; },
        subscribe: (_name, callback) => { patch = callback; return () => {}; },
        startPolling: update => { starts++; tick = update; void update(); return () => { stops++; tick = null; }; },
    });
    const received = Array.from({ length: 10 }, () => []);
    const unsubscribers = received.map(values => subscribe('Home', value => values.push(value), null, 60000));
    await tick();
    assert.equal(starts, 1); assert.equal(loads, 1);
    assert.ok(received.every(values => values.length === 1));
    patch({ version: 'admin-edit' });
    assert.ok(received.every(values => values.at(-1).version === 'admin-edit'));
    unsubscribers.slice(0, 9).forEach(stop => stop());
    assert.equal(stops, 0);
    await tick();
    assert.equal(loads, 2);
    unsubscribers[9]();
    assert.equal(stops, 1); assert.equal(tick, null);
    assert.equal(received[0].length, 2, 'offscreen consumers no longer receive updates');
    const resumed = [];
    const stop = subscribe('Home', value => resumed.push(value), null, 60000);
    await tick();
    assert.equal(starts, 2); assert.equal(loads, 3);
    assert.equal(resumed.at(-1).version, 3);
    stop();
});

test('a returning visible section immediately receives shared data without an extra fetch', async () => {
    let loads = 0, tick;
    const subscribe = createSharedCatalogPolling({ load: async () => { loads++; return ['ready']; }, subscribe: () => () => {},
        startPolling: update => { tick = update; void update(); return () => {}; } });
    const stop = subscribe('Home', () => {}, null, 60000);
    await tick();
    let data;
    const otherStop = subscribe('Home', value => { data = value; }, null, 60000);
    assert.deepEqual(data, ['ready']); assert.equal(loads, 1);
    otherStop(); stop();
});

test('optimistic Hot additions and removals remain immediate while shared metadata catches up', async () => {
    let at = 100000;
    let published = [{ id: 'a', name: 'A', isHot: true }, { id: 'b', name: 'B', isHot: true }];
    const cache = createPublicCatalogCache({ now: () => at, readDynamic: async () => ({ items: published, stale: false }) });
    await cache.load('Hot');
    cache.patch('Movies', { id: 'a', isHot: false });
    cache.patch('Movies', { id: 'c', name: 'C', isHot: true });
    assert.deepEqual((await cache.load('Hot')).map(movie => movie.id), ['b', 'c']);
    at += 60000;
    assert.deepEqual((await cache.load('Hot')).map(movie => movie.id), ['b', 'c']);
    published = [{ id: 'b', name: 'B', isHot: true }, { id: 'c', name: 'C', isHot: true }];
    at += 60000;
    assert.deepEqual((await cache.load('Hot')).map(movie => movie.id), ['b', 'c']);
});
