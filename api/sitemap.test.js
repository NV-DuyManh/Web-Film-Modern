import test from 'node:test';
import assert from 'node:assert/strict';
import { createSitemapHandler } from './sitemap.js';

function response() {
    return { code: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; },
        status(code) { this.code = code; return this; }, end(body) { this.body = body; return this; } };
}

test('Fresh sitemap snapshot serves GET and HEAD without reading Firestore', async () => {
    let reads = 0;
    const xml = '<?xml version="1.0"?><!-- generatedAt: 2026-10-08T00:00:00.000Z -->';
    const handler = createSitemapHandler({ readCatalog: async () => { reads++; return {}; }, readSnapshot: async () => xml, now: () => Date.parse('2026-10-08T01:00:00Z') });
    const get = response(); await handler({ method: 'GET' }, get);
    assert.equal(get.body, xml); assert.equal(get.code, 200);
    const head = response(); await handler({ method: 'HEAD' }, head);
    assert.equal(head.body, ''); assert.equal(reads, 0);
    assert.match(get.headers['Cache-Control'], /s-maxage=86400/);
});

test('Stale sitemap refresh coalesces concurrent requests and caches the result', async () => {
    let reads = 0;
    const handler = createSitemapHandler({ readSnapshot: async () => '<urlset />', readCatalog: async () => { reads++; return { Movies: [{ id: 'id', name: 'Tên Phim' }] }; } });
    const first = response(), second = response();
    await Promise.all([handler({ method: 'GET' }, first), handler({ method: 'GET' }, second)]);
    assert.equal(reads, 1); assert.equal(first.body, second.body);
    assert.match(first.body, /\/phim\/ten-phim/);
    await handler({ method: 'GET' }, response()); assert.equal(reads, 1);
});

test('Catalog failure serves the existing sitemap and rejects unsupported methods', async () => {
    const handler = createSitemapHandler({ readSnapshot: async () => '<urlset />', readCatalog: async () => { throw new Error('offline'); } });
    const fallback = response(); await handler({ method: 'GET' }, fallback);
    assert.equal(fallback.code, 200); assert.equal(fallback.body, '<urlset />');
    const post = response(); await handler({ method: 'POST' }, post); assert.equal(post.code, 405);
});
