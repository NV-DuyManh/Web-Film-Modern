import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countryCardLayout, countryCycleCount, countryWindow, countryWindowStart, wrapCountryPosition } from './countryCarousel.js';

const catalog = length => Array.from({ length }, (_, id) => ({ id, slug: `movie-${id}` }));

test('a large catalog mounts a bounded window that covers the viewport with a buffer', () => {
    const movies = catalog(1000);
    for (const width of [224, 399, 400, 768, 899, 900, 1279, 1280, 1800]) {
        const layout = countryCardLayout(width);
        for (const position of [0, layout.step * 400.9, layout.step * 999.999]) {
            const start = countryWindowStart(position, layout.step);
            const window = countryWindow(movies, start, Math.ceil(layout.width / layout.step));
            assert.ok(window.length <= 9, `${width}px should not mount the whole catalog`);
            const left = start * layout.step - position;
            const right = left + window.length * layout.step - layout.gap;
            assert.ok(left <= -layout.step);
            assert.ok(right >= width + layout.step);
            assert.equal(new Set(window.map(movie => movie._slideKey)).size, window.length);
        }
    }
});

test('every movie remains reachable in the original order in both directions', () => {
    const movies = catalog(177);
    const layout = countryCardLayout(1000);
    const cycleWidth = countryCycleCount(movies.length) * layout.step;
    for (let i = -200; i < 400; i++) {
        const position = wrapCountryPosition(i * layout.step + 0.25, cycleWidth);
        const start = countryWindowStart(position, layout.step);
        const window = countryWindow(movies, start, Math.ceil(layout.width / layout.step));
        const firstVisible = window[2];
        assert.equal(firstVisible.id, ((i % movies.length) + movies.length) % movies.length);
        assert.equal(firstVisible.slug, `movie-${firstVisible.id}`);
        assert.equal(window[3].id, (firstVisible.id + 1) % movies.length);
    }
});

test('small and empty catalogs preserve the padded infinite cycle', () => {
    assert.equal(countryCycleCount(0), 0);
    assert.deepEqual(countryWindow([], -2, 4), []);
    for (const count of [1, 2, 5, 11, 12, 14]) {
        const padded = countryCycleCount(count);
        assert.ok(padded >= 12);
        assert.equal(padded % count, 0);
        const layout = countryCardLayout(1400);
        const atEnd = wrapCountryPosition(padded * layout.step, padded * layout.step);
        assert.equal(atEnd, 0);
        assert.equal(countryWindow(catalog(count), countryWindowStart(atEnd, layout.step), 4)[2].id, 0);
    }
});

test('responsive breakpoints preserve card proportions, spacing and fractional movie position', () => {
    let position = 23.375 * countryCardLayout(1400).step;
    let previous = countryCardLayout(1400);
    for (const width of [390, 640, 1000, 1400]) {
        const next = countryCardLayout(width);
        position *= next.step / previous.step;
        assert.ok(Math.abs(position / next.step - 23.375) < 1e-10);
        assert.ok(Math.abs(next.cardWidth * next.count + next.gap * (next.count - 1) - width) < 1e-10);
        previous = next;
    }
});

test('wrapping remains bounded across multi-cycle drags and button movement at either seam', () => {
    const cycle = 1200;
    for (const position of [-1000000, -1201, -1, 0, 1199, 1200, 1201, 1000000]) {
        const wrapped = wrapCountryPosition(position, cycle);
        assert.ok(wrapped >= 0 && wrapped < cycle);
        assert.equal(wrapCountryPosition(position + cycle, cycle), wrapped);
    }
    assert.equal(wrapCountryPosition(-1, cycle), 1199);
    assert.equal(wrapCountryPosition(1201, cycle), 1);
});
