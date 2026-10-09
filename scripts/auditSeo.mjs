import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { prepareCatalog, indexableCatalogPaths, resolvePublicPage } from '../server/seo/catalog.js';
import { renderPageHtml } from '../server/seo/render.js';
import { SITE_ORIGIN } from '../src/utils/seo.js';

const { catalog } = JSON.parse(await readFile(new URL('../server/seo/catalog.json', import.meta.url), 'utf8'));
const template = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const prepared = prepareCatalog(catalog);
const paths = indexableCatalogPaths(prepared);
for (const path of paths) {
    const page = resolvePublicPage(path, prepared);
    assert.equal(page.status, 200, path);
    assert.equal(page.redirect, undefined, path);
    assert.ok(page.robots.startsWith('index'), path);
    assert.ok(page.canonical.startsWith(SITE_ORIGIN), path);
    const html = renderPageHtml(template, page);
    assert.equal((html.match(/<title\b/g) || []).length, 1, path);
    assert.equal((html.match(/name="description"/g) || []).length, 1, path);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, path);
    assert.match(html, /<h1>/, path);
    assert.match(html, /\/assets\/[^" ]+\.js/, path);
    assert.doesNotThrow(() => JSON.parse(html.match(/id="mfilm-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || '[]'), path);
}
console.log(`SEO audit passed: ${paths.length} public canonical pages, ${catalog.Movies.length} movies.`);
