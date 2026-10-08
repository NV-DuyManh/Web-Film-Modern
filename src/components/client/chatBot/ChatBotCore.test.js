import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { withNameRoutes, routeSegment } from '../../../utils/nameRoutes.js';

let server;
let core;
before(async () => {
    server = await createServer({
        configFile: false,
        optimizeDeps: { noDiscovery: true },
        server: { middlewareMode: true, hmr: false },
        appType: 'custom',
    });
    core = await server.ssrLoadModule('/src/components/client/chatBot/ChatBotCore.jsx');
});
after(async () => { await server?.close(); });

const movies = [
    { id: 'm1', slug: 'na-tra-ma-dong-giang-the', otherName: 'Na Tra: Ma Đồng Giáng Thế', endEpisode: 1 },
    { id: 'm2', slug: 'dau-la-dai-luc', name: 'Đấu La Đại Lục', endEpisode: 260, planID: 'premium' },
];
const plans = [{ id: 'premium', name: 'Premium', level: 3 }];
const screenshotReply = '- [na-tra-ma-dong-giang-the] "Na Tra: Ma Đồng Giáng Thế" | 1 tập | Hài Hước\n- [dau-la-dai-luc] "Đấu La Đại Lục" | 260 tập';

test('screenshot response renders movie links, posters and watch/detail buttons', () => {
    const html = renderToStaticMarkup(React.createElement(
        MemoryRouter, null, core.renderMessage(screenshotReply, undefined, movies, plans)
    ));
    for (const movie of movies) {
        assert.ok(html.includes(`href="/phim/${movie.slug}"`));
        assert.ok(html.includes(`href="/xem-phim/${movie.slug}"`));
    }
    assert.equal((html.match(/Xem ngay/g) || []).length, 2);
    assert.equal((html.match(/Chi tiết/g) || []).length, 2);
    assert.equal((html.match(/<img /g) || []).length, 2);
    assert.ok(!html.includes('[na-tra-ma-dong-giang-the]'));
    assert.ok(html.includes('260 tập'));
});

test('repairs bracket references and relative slug links using exact catalog IDs', () => {
    const input = '[M1]\n[Đấu La](dau-la-dai-luc)\n[m2] “Đấu La Đại Lục”';
    const normalized = core.normalizeMovieLinks(input, movies);
    assert.equal(normalized, '[Na Tra: Ma Đồng Giáng Thế](/phim/na-tra-ma-dong-giang-the)\n[Đấu La](/phim/dau-la-dai-luc)\n[Đấu La Đại Lục](/phim/dau-la-dai-luc)');
    assert.equal(core.normalizeMovieLinks(normalized, movies), normalized);
});

test('preserves valid links, unrelated brackets and unknown references', () => {
    const input = '[Na Tra](/phim/na-tra-ma-dong-giang-the)\n[Gói Premium L3]\n[unknown-slug] "Phim lạ"\n[Trang khác](https://example.com)';
    assert.equal(core.normalizeMovieLinks(input, movies), input);
    assert.equal(core.normalizeMovieLinks(screenshotReply, []), screenshotReply);
    assert.equal(core.normalizeMovieLinks(null, movies), null);
});

test('chatbot cards use names for movies without slugs, including duplicate and Unicode titles', () => {
    const catalog = withNameRoutes([
        { id: 'old-movie-id', name: 'Phim Mới' },
        { id: 'second-movie-id', name: 'Phim Mới' },
        { id: 'unicode-movie-id', name: '梁朝偉' },
    ], { preferSlug: true });
    const reply = catalog.map(movie => `[${movie.id}]`).join('\n');
    const html = renderToStaticMarkup(React.createElement(
        MemoryRouter, null, core.renderMessage(reply, undefined, catalog, [])
    ));
    for (const movie of catalog) {
        assert.ok(html.includes(`href="/phim/${routeSegment(movie)}"`));
        assert.ok(html.includes(`href="/xem-phim/${routeSegment(movie)}"`));
        assert.ok(!html.includes(`href="/phim/${movie.id}"`));
    }
    assert.equal((html.match(/Xem ngay/g) || []).length, 3);
});

test('normalizes new responses before checking subscription access', () => {
    const normalized = core.validateAndFilterAiResponse(screenshotReply, movies, plans);
    assert.ok(normalized.includes('/phim/na-tra-ma-dong-giang-the'));
    const filtered = core.validateAndFilterAiResponse(screenshotReply, movies, plans, { name: 'Free', level: 0 }, true);
    assert.ok(filtered.includes('/phim/na-tra-ma-dong-giang-the'));
    assert.ok(!filtered.includes('dau-la-dai-luc'));
});

test('catalog gives the AI usable movie links instead of bare slug markers', () => {
    const catalog = core.buildMovieCatalogSummary(movies, [], plans);
    assert.ok(catalog.includes('[Na Tra: Ma Đồng Giáng Thế](/phim/na-tra-ma-dong-giang-the)'));
    assert.ok(catalog.includes('[Đấu La Đại Lục](/phim/dau-la-dai-luc)'));
    assert.ok(!catalog.includes('[na-tra-ma-dong-giang-the]'));
});

test('saved replies render cards after catalog loading and deduplicate by slug without IDs', () => {
    const catalog = movies.map(movie => {
        const entry = { ...movie };
        delete entry.id;
        return entry;
    });
    const html = renderToStaticMarkup(React.createElement(
        MemoryRouter, null, core.renderMessage(`${screenshotReply}\n[na-tra-ma-dong-giang-the]`, undefined, catalog, plans)
    ));
    assert.equal((html.match(/Xem ngay/g) || []).length, 2);
});
