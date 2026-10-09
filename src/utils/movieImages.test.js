import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { movieArtwork, resolveMovieImages, movieImageCandidates, movieArtworkPatch, missingMovieArtworkPatch } from './movieImages.js';
import { stripRouteMetadata } from './nameRoutes.js';

const poster = 'https://phimimg.com/movie-poster.webp';
const banner = 'https://phimimg.com/movie-banner.webp';

test('frontend and backend use the same compatibility fixtures', () => {
    const fixtures = JSON.parse(readFileSync(new URL('../../backend/src/common/movie-artwork-fixtures.json', import.meta.url), 'utf8'));
    for (const { input, expected } of fixtures) assert.deepEqual(resolveMovieImages(input), expected);
});

test('partial movie updates retain the other actual image and non-artwork changes never erase images', () => {
    const current = { imgUrl: poster, bannerUrl: banner, rent: 25000 };
    assert.deepEqual(movieArtworkPatch({ rent: 0 }, current), {});
    assert.deepEqual(movieArtworkPatch({ imgUrl: '' }, current), { imgUrl: banner, bannerUrl: banner });
    assert.deepEqual(movieArtworkPatch({ imgUrl: 'https://film.test/new.webp' }, current), { imgUrl: 'https://film.test/new.webp', bannerUrl: banner });
    assert.deepEqual(movieArtworkPatch({ bannerUrl: '/assets/Logo5.png' }, current), { imgUrl: poster, bannerUrl: poster });
    assert.equal(current.rent, 25000);
});

test('admin upload previews use local image bytes directly and UI source metadata is never saved', () => {
    const uploaded = 'data:image/png;base64,YQ==';
    assert.deepEqual(movieImageCandidates({ imgUrl: uploaded }, 'banner', 400, 600, 'banner', false), [uploaded]);
    assert.deepEqual(movieImageCandidates({ imgUrl: poster, bannerUrl: banner }, 'banner', 400, 600, 'banner', false), [banner, poster]);
    assert.deepEqual(stripRouteMetadata({ id: 'movie', routeSlug: 'movie', _artworkSource: { imgUrl: '' }, imgUrl: poster }), { id: 'movie', imgUrl: poster });
    assert.deepEqual(missingMovieArtworkPatch({ imgUrl: poster, bannerUrl: '/assets/Logo5.png' }), { bannerUrl: poster });
});

test('missing or previously saved MFILM placeholders use the other real movie image', () => {
    for (const placeholder of ['', null, undefined, '  ', '/assets/Logo5-Ct2RjDwI.png', '/src/assets/Logo6.png', 'https://site.test/assets/Logo5-old.png', '/assets%2FLogo6.png']) {
        assert.deepEqual(resolveMovieImages({ imgUrl: poster, bannerUrl: placeholder }), { imgUrl: poster, bannerUrl: poster });
        assert.deepEqual(resolveMovieImages({ imgUrl: placeholder, bannerUrl: banner }), { imgUrl: banner, bannerUrl: banner });
    }
    assert.equal(movieArtwork('https://images.test/logorama-poster.webp'), 'https://images.test/logorama-poster.webp');
});

test('preserves both actual images and supports crawler/recommendation image field names', () => {
    assert.deepEqual(resolveMovieImages({ imgUrl: poster, bannerUrl: banner }), { imgUrl: poster, bannerUrl: banner });
    assert.deepEqual(resolveMovieImages({ poster_url: poster, thumb_url: banner }), { imgUrl: poster, bannerUrl: banner });
    assert.deepEqual(resolveMovieImages({ imgUrl: '/assets/Logo6.png', posterUrl: poster, thumbUrl: banner }), { imgUrl: poster, bannerUrl: banner });
    assert.deepEqual(resolveMovieImages({ imgUrl: '/assets/Logo6.png', bannerUrl: '/assets/Logo5.png' }), { imgUrl: '', bannerUrl: '' });
});

test('a failed proxy or original advances to the other movie image without duplicate retries', () => {
    const remote = 'https://images.test/poster.webp';
    const candidates = movieImageCandidates({ imgUrl: remote, bannerUrl: banner });
    assert.match(candidates[0], /^https:\/\/wsrv.nl\//);
    assert.equal(candidates[1], remote);
    assert.equal(candidates[2], banner);
    assert.equal(candidates.length, 3);
    assert.deepEqual(movieImageCandidates({ imgUrl: poster, bannerUrl: banner }, 'banner', 480, 270, 'thumb'), [banner, poster]);
    assert.deepEqual(movieImageCandidates({ imgUrl: poster }, 'banner'), [poster]);
    assert.deepEqual(movieImageCandidates({ imgUrl: '/assets/Logo6.png' }), []);
});
