import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assetCachePlugin } from './assetCache.js';

test('a 200 HTML fallback cannot enter or leave the JavaScript/CSS cache', async () => {
    for (const path of ['index-old.js', 'page-old.css']) {
        const request = new Request(`https://mfilm.online/assets/${path}`);
        const html = new Response('<!doctype html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
        assert.equal(await assetCachePlugin.cacheWillUpdate({ request, response: html }), null);
        assert.equal(await assetCachePlugin.cachedResponseWillBeUsed({ request, cachedResponse: html }), null);
    }
});

test('valid scripts and styles remain available offline; 404s and incorrect MIME types are rejected', async () => {
    for (const [path, type] of [['index.js', 'application/javascript; charset=utf-8'], ['page.js', 'text/javascript'], ['page.css', 'text/css'], ['font.woff2', 'font/woff2']]) {
        const request = new Request(`https://mfilm.online/assets/${path}`);
        const response = new Response('asset', { headers: { 'content-type': type } });
        assert.equal(await assetCachePlugin.cacheWillUpdate({ request, response }), response);
        assert.equal(await assetCachePlugin.cachedResponseWillBeUsed({ request, cachedResponse: response }), response);
        const missing = new Response('missing', { status: 404, headers: { 'content-type': type } });
        assert.equal(await assetCachePlugin.cacheWillUpdate({ request, response: missing }), null);
    }
    const request = new Request('https://mfilm.online/assets/index.js');
    const json = new Response('{}', { headers: { 'content-type': 'application/json' } });
    assert.equal(await assetCachePlugin.cachedResponseWillBeUsed({ request, cachedResponse: json }), null);
});

test('SPA routes keep their fallback, while missing files and API requests never return the app HTML', () => {
    const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
    const route = new RegExp(`^${config.rewrites[0].source}$`);
    for (const path of ['/', '/actors', '/dien-vien/01Qzckaud2ON8GtsmLsU', '/phim/loi-nguyen-sijjin-4', '/account/account']) assert.equal(route.test(path), true, path);
    for (const path of ['/assets/index-old.js', '/assets/missing.webp', '/api/ai/chat', '/api', '/sw.js', '/app-recovery.js', '/manifest.webmanifest']) assert.equal(route.test(path), false, path);
});
