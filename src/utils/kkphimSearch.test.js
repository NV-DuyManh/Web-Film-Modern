import test from 'node:test';
import assert from 'node:assert/strict';
import { searchResults, existingSourceMovie } from './kkphimSearch.js';
import { searchMovies } from '../services/kkphimService.js';

test('search uses KKPhim directly with encoded names, paging and cancellation', async context => {
    let requested;
    const controller = new AbortController();
    context.mock.method(globalThis, 'fetch', async (url, options) => {
        requested = new URL(url);
        assert.equal(options.signal.aborted, false);
        controller.abort();
        assert.equal(options.signal.aborted, true);
        return { ok: true, json: async () => ({ data: { items: [] } }) };
    });
    await searchMovies('  phim Việt & anime  ', 2, 12, { signal: controller.signal });
    assert.equal(requested.origin, 'https://phimapi.com');
    assert.equal(requested.pathname, '/v1/api/tim-kiem');
    assert.equal(requested.searchParams.get('keyword'), 'phim Việt & anime');
    assert.equal(requested.searchParams.get('page'), '2');
    assert.equal(requested.searchParams.get('limit'), '12');
});

test('search handles upstream paging, no matches and invalid responses without inventing results', () => {
    const response = { data: { items: [{ slug: 'movie-one' }, { slug: 'invalid/url' }], params: { pagination: { totalItems: 16, currentPage: 2, totalPages: 2 } } } };
    assert.deepEqual(searchResults(response), { items: [{ slug: 'movie-one' }], totalItems: 16, page: 2, totalPages: 2 });
    assert.deepEqual(searchResults({ data: { items: [] } }), { items: [], totalItems: 0, page: 1, totalPages: 1 });
    assert.throws(() => searchResults({ status: false }));
    assert.throws(() => searchResults({ data: {} }));
});

test('already imported results match source slug or legacy names', () => {
    const movies = [{ id: 'source', sourceSlug: 'movie-one' }, { id: 'legacy', name: 'Original Movie', otherName: 'Phim cũ' }];
    assert.equal(existingSourceMovie(movies, { slug: 'movie-one' }).id, 'source');
    assert.equal(existingSourceMovie(movies, { slug: 'old', origin_name: ' original movie ' }).id, 'legacy');
    assert.equal(existingSourceMovie(movies, { slug: 'new-movie', name: 'New Movie' }), undefined);
});
