import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withNameRoutes, routeSegment, findRouteEntity, findMovieReference, stripRouteMetadata } from './nameRoutes.js';

test('movie URLs retain valid published slugs; missing slugs and ID slugs use titles', () => {
    const source = [
        { id: 'movie-a', name: 'Đứa Trẻ Mồ Côi', slug: 'dua-tre-mo-coi', rent: 15000 },
        { id: 'movie-b', name: 'Phim Mới', actor: ['actor-id'] },
        { id: 'movie-c', name: 'Tên Cũ', slug: 'movie-c' },
    ];
    const catalog = withNameRoutes(source, { preferSlug: true });
    assert.deepEqual(catalog.map(routeSegment), ['dua-tre-mo-coi', 'phim-moi', 'ten-cu']);
    assert.equal(source[1].routeSlug, undefined);
    assert.equal(catalog[0].rent, source[0].rent);
    assert.equal(catalog[1].actor, source[1].actor);
    for (const movie of catalog) {
        for (const prefix of ['/phim', '/xem-phim', '/pay', '/payMovie']) {
            const path = `${prefix}/${routeSegment(movie)}`;
            assert.ok(!path.includes(movie.id));
            assert.equal(findRouteEntity(catalog, decodeURIComponent(path.split('/').pop())).id, movie.id);
        }
        assert.equal(findRouteEntity(catalog, movie.id), movie);
    }
});

test('movie editions with duplicate slugs stay distinct in every navigation surface', () => {
    const catalog = withNameRoutes([
        { id: 'b', name: 'Phim Trùng', slug: 'phim-trung' },
        { id: 'a', name: 'Phim Trùng', slug: 'phim-trung' },
        { id: 'c', name: 'Phim Trùng 2', slug: 'phim-trung-2' },
    ], { preferSlug: true });
    assert.deepEqual(catalog.map(routeSegment), ['phim-trung-3', 'phim-trung', 'phim-trung-2']);
    for (const movie of catalog) {
        assert.equal(findRouteEntity(catalog, decodeURIComponent(routeSegment({ ...movie }))), movie);
    }
});

test('topics, authors, characters and plans resolve name paths and old IDs to original data', () => {
    for (const source of [
        [{ id: 'topic-id', title: 'Bộ Sưu Tập Mùa Thu', movieID: ['movie-id'] }],
        [{ id: 'author-id', name: 'Jaume Collet-Serra' }],
        [{ id: 'character-id', name: 'Tôn Ngộ Không' }],
        [{ id: 'plan-id', name: 'Premium', price: 79000 }],
    ]) {
        const catalog = withNameRoutes(source);
        const item = catalog[0];
        assert.equal(findRouteEntity(catalog, item.id), item);
        assert.equal(findRouteEntity(catalog, decodeURIComponent(routeSegment(item))), item);
        assert.ok(!routeSegment(item).includes(item.id));
        assert.equal(item.id, source[0].id);
    }
});

test('AI references resolve encoded Unicode paths, old IDs and mixed-case stored slugs', () => {
    const catalog = withNameRoutes([{ id: 'OriginalID', name: '梁朝偉' }, { id: 'B', name: 'Film', slug: 'valid-film' }], { preferSlug: true });
    assert.equal(findMovieReference(catalog, routeSegment(catalog[0])), catalog[0]);
    assert.equal(findMovieReference(catalog, 'originalid'), catalog[0]);
    assert.equal(findMovieReference(catalog, 'VALID-FILM'), catalog[1]);
    assert.equal(findMovieReference(catalog, '%broken'), undefined);
    assert.equal(findRouteEntity(catalog, 'unknown'), undefined);
});

test('a name-only recommendation can resolve a movie whose published slug differs from its title', () => {
    const catalog = withNameRoutes([{ id: 'movie-id', name: 'Phim Mới', otherName: 'New Movie', slug: 'published-movie' }], { preferSlug: true });
    assert.equal(findRouteEntity(catalog, 'phim-moi'), catalog[0]);
    assert.equal(findRouteEntity(catalog, 'new-movie'), catalog[0]);
    assert.equal(routeSegment(catalog[0]), 'published-movie');
});

test('saving an edited catalog item excludes derived route metadata and preserves database relations', () => {
    const edited = Object.freeze({ id: 'movie-id', name: 'New title', slug: 'published-title', routeSlug: 'old-title', actor: ['actor-id'], planID: 'premium-id', rent: 12000 });
    const persisted = stripRouteMetadata(edited);
    assert.equal(persisted.routeSlug, undefined);
    assert.equal(edited.routeSlug, 'old-title');
    assert.deepEqual(persisted, { id: 'movie-id', name: 'New title', slug: 'published-title', actor: ['actor-id'], planID: 'premium-id', rent: 12000 });
});
