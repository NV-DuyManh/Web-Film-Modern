import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCatalog, resolvePublicPage, indexableCatalogPaths } from './catalog.js';
import { renderPageHtml } from './render.js';
import { canonicalUrl, movieSchema, safeJsonLd, robotsForPath } from '../../src/utils/seo.js';
import { buildSitemap } from '../../src/utils/sitemap.js';
import { createPageHandler } from '../../api/page.js';
import { createCatalogLoader } from './loadCatalog.js';
import { createPublicCatalogHandler } from '../../api/public-catalog.js';

const template = '<html><head><title>Old title</title><meta name="description" content="old"><meta property="og:title" content="old"><script src="/app-recovery.js"></script></head><body><div id="root"></div><script type="module" src="/assets/app-abc.js"></script></body></html>';
const catalog = {
    Movies: [{ id: 'movie-id', slug: 'phim-mau', name: 'Sample', otherName: 'Phim mẫu', releaseYear: 2024, duration: 95, endEpisode: 1, hasSub: true, description: 'Nội dung phim mẫu.', imgUrl: 'https://example.com/poster.jpg', listActor: ['actor-id'], listAuthor: ['author-id'], listCategory: ['action'], countriesID: 'Việt Nam', createdAt: '2024-08-02T10:00:00Z' }],
    Actors: [{ id: 'actor-id', name: 'Diễn viên A' }, { id: 'unused', name: 'Chưa có phim', description: 'Đang cập nhật...' }],
    Authors: [{ id: 'author-id', name: 'Tác giả A' }], Categories: [{ id: 'action', name: 'Hành Động' }], CategoryTypes: [],
};
const prepared = prepareCatalog(catalog);
const response = () => ({ code: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.code = code; return this; }, end(body) { this.body = body; return this; } });

test('Navigation hubs have actual category/country links and public HTML instead of 404s', () => {
    for (const [path, child] of [['/category', '/category/H%C3%A0nh%20%C4%90%E1%BB%99ng'], ['/country', '/country/Vi%E1%BB%87t%20Nam']]) {
        const page = resolvePublicPage(path, prepared);
        assert.equal(page.status, 200);
        assert.equal(page.kind, 'hub');
        assert.ok(page.links.some(link => link.path === child));
        assert.match(renderPageHtml(template, page), new RegExp(`href="${child}"`));
        assert.ok(indexableCatalogPaths(prepared).includes(path));
    }
});

test('Sitemap discovers real pagination, excludes duplicate filtered lists and keeps FAQ visible', () => {
    const many = prepareCatalog({ ...catalog, Movies: Array.from({ length: 60 }, (_, i) => ({ ...catalog.Movies[0], id: `m${i}`, slug: `movie-${i}` })) });
    const paths = indexableCatalogPaths(many);
    assert.ok(paths.includes('/film-new?page=2'));
    assert.ok(paths.includes('/film-new?page=3'));
    assert.ok(!paths.includes('/film-new?page=4'));
    const xml = buildSitemap(many.catalog);
    assert.match(xml, /film-new\?page=2/);
    for (const param of ['search=x', 'sort=views', 'year=2024', 'plan=free']) assert.match(resolvePublicPage(`/film-new?${param}`, many).robots, /noindex/);
    const html = renderPageHtml(template, resolvePublicPage('/ho-tro', many));
    assert.match(html, /Câu hỏi thường gặp/);
    assert.match(html, /Thuê phim được xem trong bao lâu/);
    assert.match(html, /30 ngày kể từ khi thanh toán thành công/);
    const schemas = resolvePublicPage('/', many).schemas;
    const organization = schemas.find(schema => schema['@type'] === 'Organization');
    assert.ok(organization.logo.startsWith('https://www.mfilm.online/'));
    assert.equal(schemas.find(schema => schema['@type'] === 'WebSite').publisher['@id'], organization['@id']);
    assert.equal(organization.address, undefined);
});

test('Movie HTML has unique metadata, readable content and links before JavaScript starts', () => {
    const page = resolvePublicPage('/phim/phim-mau', prepared);
    const html = renderPageHtml(template, page);
    assert.equal(page.status, 200);
    assert.match(html, /Phim mẫu \(2024\) Vietsub \| MFILM/);
    assert.match(html, /<h1>Phim mẫu<\/h1>/);
    assert.match(html, /Nội dung phim mẫu/);
    assert.match(html, /href="\/dien-vien\/dien-vien-a"/);
    assert.match(html, /rel="canonical" href="https:\/\/www.mfilm.online\/phim\/phim-mau"/);
    assert.equal((html.match(/name="description"/g) || []).length, 1);
    assert.equal((html.match(/<title\b/g) || []).length, 1);
    assert.match(html, /app-recovery.js/);
    assert.match(html, /assets\/app-abc.js/);
});
test('Public schema uses actual duration and credits and does not invent ratings or episode counts', () => {
    const schema = resolvePublicPage('/phim/phim-mau', prepared).schemas[0];
    assert.equal(schema.duration, 'PT95M');
    assert.equal(schema['@type'], 'Movie');
    assert.equal(schema.actor[0].name, 'Diễn viên A');
    assert.equal(schema.creator[0].name, 'Tác giả A');
    assert.equal(schema.director, undefined);
    assert.equal(schema.aggregateRating, undefined);
    const series = movieSchema({ ...catalog.Movies[0], endEpisode: 603604605 });
    assert.equal(series['@type'], 'TVSeries');
    assert.equal(series.numberOfEpisodes, undefined);
    assert.equal(series.duration, undefined);
});
test('IDs redirect permanently; missing entities and pages return genuine 404', async () => {
    const handler = createPageHandler({ readTemplate: async () => template, readCatalog: async () => catalog });
    const redirect = response(); await handler({ method: 'GET', url: '/phim/movie-id' }, redirect);
    assert.equal(redirect.code, 308); assert.equal(redirect.headers.Location, '/phim/phim-mau');
    for (const path of ['/phim/missing', '/dien-vien/missing', '/category/missing', '/unknown', '/phim/%E0%A4%A']) {
        const res = response(); await handler({ method: 'GET', url: path }, res);
        assert.equal(res.code, 404, path); assert.match(res.headers['X-Robots-Tag'], /noindex/);
    }
});
test('Internal rewrite preserves paths, pagination and HEAD without affecting assets', async () => {
    const many = { ...catalog, Movies: Array.from({ length: 60 }, (_, i) => ({ ...catalog.Movies[0], id: `m${i}`, slug: `phim-${i}` })) };
    const handler = createPageHandler({ readTemplate: async () => template, readCatalog: async () => many });
    const res = response(); await handler({ method: 'GET', url: '/api/page?path=/film-new&page=2&utm_source=x' }, res);
    assert.equal(res.code, 200); assert.match(res.body, /canonical" href="https:\/\/www.mfilm.online\/film-new\?page=2/);
    assert.match(res.body, /Trang 2/);
    const head = response(); await handler({ method: 'HEAD', url: '/film-new' }, head); assert.equal(head.body, '');
    const missing = response(); await handler({ method: 'GET', url: '/film-new?page=999' }, missing); assert.equal(missing.code, 404);
    const post = response(); await handler({ method: 'POST', url: '/' }, post); assert.equal(post.code, 405);
});
test('Private and watch pages stay outside the index and canonical parameters cannot multiply detail URLs', () => {
    for (const path of ['/users', '/magicImport', '/account/account', '/payMovie/phim-mau', '/xem-phim/phim-mau']) {
        const page = resolvePublicPage(path, prepared);
        assert.match(page.robots, /noindex/); assert.equal(page.kind, 'private');
    }
    assert.equal(canonicalUrl('https://mfilm.online/phim/phim-mau?tap=42&utm_source=x&page=2#x'), 'https://www.mfilm.online/phim/phim-mau');
    assert.equal(canonicalUrl('/xem-phim/phim-mau?tap=2'), 'https://www.mfilm.online/phim/phim-mau');
    assert.equal(canonicalUrl('/series?page=2&utm_source=x'), 'https://www.mfilm.online/series?page=2');
    assert.match(robotsForPath('/', { admin: true }), /noindex/);
    assert.match(robotsForPath('/series', { search: '?q=abc' }), /noindex/);
});
test('Untrusted catalog content cannot close scripts or inject HTML', () => {
    const malicious = { ...catalog, Movies: [{ ...catalog.Movies[0], otherName: '</script><script>alert(1)</script>', description: '<img src=x onerror=alert(1)>Story' }] };
    const html = renderPageHtml(template, resolvePublicPage('/phim/phim-mau', prepareCatalog(malicious)));
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>|onerror=/);
    assert.doesNotThrow(() => JSON.parse(safeJsonLd({ value: '</script>\u2028<&' })));
});
test('Sitemap matches canonical names and excludes thin orphan profiles and private routes', () => {
    const xml = buildSitemap(catalog);
    assert.match(xml, /https:\/\/www.mfilm.online\/phim\/phim-mau/);
    assert.match(xml, /image:loc>https:\/\/example.com\/poster.jpg/);
    assert.match(xml, /<lastmod>2024-08-02T10:00:00.000Z<\/lastmod>/);
    assert.doesNotMatch(xml, /movie-id|chua-co-phim|\/account|\/payMovie/);
    assert.ok(indexableCatalogPaths(prepared).includes('/category/H%C3%A0nh%20%C4%90%E1%BB%99ng'));
});
test('Daily catalog refresh coalesces requests and a database outage preserves the snapshot', async () => {
    const snapshot = JSON.stringify({ generatedAt: '2024-01-01T00:00:00Z', catalog });
    let reads = 0;
    const handler = createPublicCatalogHandler({ readSnapshot: async () => snapshot, readCatalog: async () => { reads++; return catalog; }, now: () => Date.parse('2026-10-09T00:00:00Z') });
    const first = response(), second = response();
    await Promise.all([handler({ method: 'GET' }, first), handler({ method: 'GET' }, second)]);
    assert.equal(reads, 1); assert.equal(first.code, 200); assert.equal(second.code, 200);
    await handler({ method: 'GET' }, response()); assert.equal(reads, 1);
    const outage = createPublicCatalogHandler({ readSnapshot: async () => snapshot, readCatalog: async () => { throw new Error('offline'); } });
    const fallback = response(); await outage({ method: 'GET' }, fallback); assert.equal(fallback.code, 200);
    assert.deepEqual(JSON.parse(fallback.body).catalog, catalog);
});
test('Page catalog loader uses fresh snapshots without network and retries stale CDN failures later', async () => {
    let fetches = 0;
    const fresh = createCatalogLoader({ readSnapshot: async () => JSON.stringify({ generatedAt: '2026-10-09T00:00:00Z', catalog }), fetchCatalog: async () => { fetches++; throw new Error('offline'); }, now: () => Date.parse('2026-10-09T01:00:00Z') });
    await fresh(); assert.equal(fetches, 0);
    const stale = createCatalogLoader({ readSnapshot: async () => JSON.stringify({ generatedAt: '2024-01-01T00:00:00Z', catalog }), fetchCatalog: async () => { fetches++; throw new Error('offline'); } });
    assert.deepEqual(await stale(), catalog); assert.deepEqual(await stale(), catalog); assert.equal(fetches, 1);
});
test('New imports resolve before daily refresh and lookup outages are retryable instead of false 404s', async () => {
    let lookups = 0;
    const handler = createPageHandler({ readTemplate: async () => template, readCatalog: async () => catalog, lookupMovie: async () => { lookups++; return { id: 'new', slug: 'new-movie', name: 'New movie' }; } });
    const res = response(); await handler({ method: 'GET', url: '/phim/new-movie' }, res);
    assert.equal(res.code, 200); assert.match(res.body, /New movie/);
    await handler({ method: 'GET', url: '/phim/new-movie' }, response()); assert.equal(lookups, 1);
    const offline = createPageHandler({ readTemplate: async () => template, readCatalog: async () => catalog, lookupMovie: async () => { throw new Error('offline'); } });
    const failed = response(); await offline({ method: 'GET', url: '/phim/new-movie' }, failed);
    assert.equal(failed.code, 503); assert.equal(failed.headers['Retry-After'], '60');
});
