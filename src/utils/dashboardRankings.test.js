import test from 'node:test';
import assert from 'node:assert/strict';
import { rankedRentals, createRankingMovieCache } from './dashboardRankings.js';

test('Rental rankings aggregate current records without mutating them or changing count semantics', () => {
    const rentals = [{ movieID: 'a' }, { movieID: 'b' }, { movieID: 'b', status: 'pending' }, {}, ...['c', 'd', 'e', 'f'].map(movieID => ({ movieID }))];
    assert.deepEqual(rankedRentals(rentals), [['b', 2], ['a', 1], ['c', 1], ['d', 1], ['e', 1]]);
    assert.equal(rentals[0].movieID, 'a');
    assert.deepEqual(rankedRentals([]), []);
});

test('Concurrent consumers and repeat dashboard visits reuse one movie read', async () => {
    let reads = 0;
    const cache = createRankingMovieCache(async id => { reads++; return { id, name: 'Movie' }; });
    const [first, second] = await Promise.all([cache.load('a'), cache.load('a')]);
    assert.equal(reads, 1);
    assert.equal(first, second);
    assert.equal(await cache.load('a'), first);
    assert.equal(cache.peek('a'), first);
    cache.remember([{ id: 'b', name: 'Live ranking movie' }]);
    assert.equal((await cache.load('b')).name, 'Live ranking movie');
    assert.equal(reads, 1);
});

test('Failed reads can retry and deleted movies resolve without perpetual loading', async () => {
    let reads = 0;
    const cache = createRankingMovieCache(async () => { if (++reads === 1) throw new Error('offline'); return null; });
    await assert.rejects(cache.load('gone'), /offline/);
    assert.equal(cache.peek('gone'), undefined);
    assert.equal(await cache.load('gone'), null);
    assert.equal(cache.peek('gone'), null);
    assert.equal(await cache.load('gone'), null);
    assert.equal(reads, 2);
});
