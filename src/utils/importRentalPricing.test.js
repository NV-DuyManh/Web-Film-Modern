import test from 'node:test';
import assert from 'node:assert/strict';
import { rentalPriceRange, randomRentalPrice, missingRentalPricePatch } from './importRentalPricing.js';

const plans = [
    { id: 'free', level: 0, price: 0 },
    { id: 'basic', level: 1, price: 99999 },
    { id: 'plus', level: 2, price: 499999 },
    { id: 'premium', level: 3, price: 999999 },
];

test('Free has no rental charge even with a stale nonzero plan price', () => {
    assert.equal(randomRentalPrice({ ...plans[0], price: 999999 }, () => { throw new Error('Must not randomize Free'); }), 0);
    assert.deepEqual(missingRentalPricePatch({ planID: 'free', rent: 19000 }, plans), { rent: 0 });
    for (const rent of [0, undefined, null, '0']) {
        assert.equal(missingRentalPricePatch({ planID: 'free', rent }, plans), null);
    }
});

test('Paid rental prices follow the actual plan value in thousand-dong steps', () => {
    for (const [index, min, max] of [[1, 10000, 20000], [2, 50000, 100000], [3, 100000, 200000]]) {
        assert.deepEqual(rentalPriceRange(plans[index]), { min, max, step: 1000 });
        assert.equal(randomRentalPrice(plans[index], () => 0), min);
        assert.equal(randomRentalPrice(plans[index], () => 0.999999), max);
        for (let i = 0; i < 100; i++) {
            const price = randomRentalPrice(plans[index], () => i / 100);
            assert.ok(price >= min && price <= max && price % 1000 === 0);
        }
    }
    assert.deepEqual(rentalPriceRange({ level: '2', price: '250000' }), { min: 25000, max: 50000, step: 1000 });
    assert.equal(randomRentalPrice({ level: 1, price: 100 }, () => 0), 1000);
});

test('Backfill preserves paid manual prices and only patches missing or unpayable prices', () => {
    for (const rent of [39000, '39000', 260]) {
        assert.equal(missingRentalPricePatch({ planID: 'premium', rent }, plans), null);
    }
    for (const rent of [0, undefined, null, '', -1, 100, NaN]) {
        const movie = { planID: 'plus', rent, name: 'Original movie' };
        assert.deepEqual(missingRentalPricePatch(movie, plans, () => 0.5), { rent: 75000 });
        assert.equal(movie.planID, 'plus');
        assert.equal(movie.name, 'Original movie');
        assert.ok(Object.is(movie.rent, rent));
    }
});

test('Unknown or invalid plans are skipped rather than assigning a guessed charge', () => {
    for (const plan of [undefined, {}, { level: '' }, { level: -1 }, { level: 1.5 }, { level: 1 }, { level: 1, price: 0 }, { level: 1, price: Infinity }]) {
        assert.equal(randomRentalPrice(plan), null);
    }
    assert.equal(missingRentalPricePatch({ planID: 'deleted', rent: 0 }, plans), null);
    for (const value of [-1, 1, NaN]) assert.throws(() => randomRentalPrice(plans[1], () => value), RangeError);
});
