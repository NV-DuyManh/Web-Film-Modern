import test from 'node:test';
import assert from 'node:assert/strict';
import { rentalExpiry, RENTAL_DURATION_MS, validRentalPrice } from './rentalPolicy.js';
import { retryImport, isChunkLoadError } from './lazyRetry.js';
import { episodeSyncChanges } from './episodeSync.js';
import { nextPlayableEpisode, episodeSource } from './playback.js';
import { buildSitemap } from './sitemap.js';

test('Rental grants exactly 30 days; active rentals extend, expired rentals restart now', () => {
    const now = Date.parse('2026-10-08T08:00:00Z');
    assert.equal(RENTAL_DURATION_MS, 30 * 86400000);
    assert.equal(rentalExpiry(null, now), '2026-11-07T08:00:00.000Z');
    assert.equal(rentalExpiry('2026-10-12T08:00:00Z', now), '2026-11-11T08:00:00.000Z');
    assert.equal(rentalExpiry('2026-10-01T08:00:00Z', now), rentalExpiry(null, now));
    assert.equal(rentalExpiry('invalid', now), rentalExpiry(null, now));
    for (const value of [undefined, '', 0, -1, Infinity, NaN, 100]) assert.equal(validRentalPrice(value), false);
    assert.equal(validRentalPrice('39000'), true);
});

test('Lazy import recovers from transient failure with the actual module and stops after the retry budget', async () => {
    const module = { default: () => null };
    let attempts = 0;
    assert.equal(await retryImport(async () => {
        if (++attempts < 3) throw new Error('Failed to fetch dynamically imported module');
        return module;
    }, 3, 0), module);
    assert.equal(attempts, 3);
    attempts = 0;
    await assert.rejects(retryImport(async () => { attempts++; throw new Error('invalid module'); }, 2, 0), /invalid module/);
    assert.equal(attempts, 3);
    assert.equal(isChunkLoadError(new Error('Expected a JavaScript module script')), true);
    assert.equal(isChunkLoadError(new Error('invalid prop')), false);
});

test('Episode sync is idempotent and preserves alternate servers and existing IDs', () => {
    const movie = { id: 'movie', name: 'Movie', endEpisode: 1 };
    const old = { id: 'legacy-id', numberEpisode: 1, nameEpisode: '1', url: 'https://old', url2: 'https://alternate', urlM3u8: '' };
    const source = [{ name: '1', link_embed: 'https://new' }, { name: '2', link_m3u8: 'https://video/2.m3u8' }, { name: '2', link_m3u8: 'https://video/2.m3u8' }, { name: '3' }];
    const changes = episodeSyncChanges(movie, source, [old]);
    assert.equal(changes.creates.length, 1);
    assert.equal(changes.creates[0].id, 'movie_2');
    assert.equal(changes.updates[0].id, old.id);
    assert.equal(changes.updates[0].url2, undefined); // patch does not overwrite the alternate server
    const existing = [{ ...old, ...changes.updates[0] }, ...changes.creates];
    const again = episodeSyncChanges({ ...movie, endEpisode: 2 }, source, existing);
    assert.deepEqual(again, { creates: [], updates: [], highest: 2 });
});

test('Next episode skips missing sources, respects episode order and stops at the last episode', () => {
    const episodes = [{ id: 'three', numberEpisode: 3, urlM3u8: 'stream' }, { id: 'one', numberEpisode: 1, url: 'url' }, { id: 'two', numberEpisode: 2 }];
    assert.equal(nextPlayableEpisode(episodes, episodes[1]).id, 'three');
    assert.equal(nextPlayableEpisode(episodes, episodes[0]), null);
    assert.equal(nextPlayableEpisode(episodes, null), null);
    assert.equal(episodeSource({ url: 'embed', urlM3u8: 'stream', url2: 'alternate' }), 'stream');
    assert.equal(episodeSource({ url: 'embed', urlM3u8: 'stream', url2: 'alternate' }, 2), 'alternate');
    assert.equal(episodeSource({ url: 'embed' }, 2), 'embed');
});

test('Sitemap uses all named entities, resolves duplicate names and escapes XML without private routes', () => {
    const xml = buildSitemap({
        Movies: [{ id: 'opaque', name: 'Đứa Con', slug: 'dua-con', updatedAt: '2026-10-08T00:00:00Z' }],
        Actors: [{ id: 'b', name: 'CCH Pounder' }, { id: 'a', name: 'CCH Pounder' }, { id: 'c', name: 'CCH Pounder 2' }],
        Authors: [{ id: 'd', name: 'Tác Giả' }], Characters: [{ id: 'e', name: 'Nhân Vật' }], Topics: [{ id: 'f', name: 'Chủ Đề' }],
    }, 'https://mfilm.online');
    assert.match(xml, /\/phim\/dua-con<\/loc>/);
    assert.match(xml, /\/dien-vien\/cch-pounder-3<\/loc>/);
    assert.match(xml, /\/tac-gia\/tac-gia<\/loc>/);
    assert.match(xml, /<lastmod>2026-10-08T00:00:00.000Z<\/lastmod>/);
    assert.doesNotMatch(xml, /opaque|\/pay|\/account|\/xem-phim/);
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
    assert.equal(new Set(urls).size, urls.length);
    assert.match(buildSitemap({ Movies: [{ id: 'x', name: 'Test', slug: 'a&b' }] }), /a%26b/);
    assert.match(buildSitemap({}, 'https://example.com?a=1&b=2'), /a=1&amp;b=2/);
});
