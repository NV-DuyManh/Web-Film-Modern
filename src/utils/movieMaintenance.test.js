import test from 'node:test';
import assert from 'node:assert/strict';
import { randomMoviePlanID, movieMaintenancePatch, kkphimDocumentID, exactDuplicateMovieGroups, canRetireEmptyImport } from './movieMaintenance.js';

const plans = [{ id: 'free', level: 0, price: 0 }, { id: 'basic', level: 1, price: 100000 }, { id: 'plus', level: 2, price: 500000 }, { id: 'premium', level: 3, price: 1000000 }];
test('Maintenance preserves assigned plans and valid prices across repeated runs', () => {
    for (const plan of plans) {
        const movie = { planID: plan.id, rent: plan.level ? 17000 : 0 };
        assert.equal(movieMaintenancePatch(movie, plans, () => { throw new Error('Must not reroll'); }), null);
    }
    const movie = { planID: 'plus', rent: 0 };
    const patch = movieMaintenancePatch(movie, plans, () => 0.5);
    assert.deepEqual(patch, { rent: 75000 });
    assert.equal(movieMaintenancePatch({ ...movie, ...patch }, plans), null);
    assert.deepEqual(movieMaintenancePatch({ planID: 'free', rent: 50000 }, plans), { rent: 0 });
});
test('Missing plans receive weighted valid plans and a matching price; invalid catalog stops writes', () => {
    for (const [draw, id] of [[0.1, 'free'], [0.4, 'basic'], [0.7, 'plus'], [0.9, 'premium']]) {
        assert.equal(randomMoviePlanID(plans, () => draw), id);
        const patch = movieMaintenancePatch({ planID: 'deleted', rent: 0 }, plans, () => draw);
        assert.equal(patch.planID, id);
        const result = { rent: 0, ...patch };
        assert.ok(id === 'free' ? result.rent === 0 : result.rent > 0);
    }
    assert.equal(movieMaintenancePatch({}, [{ id: 'broken', level: 1, price: 0 }]), null);
    assert.equal(movieMaintenancePatch({ planID: 'broken', rent: 0 }, [...plans, { id: 'broken', level: 2, price: 0 }]), null);
});
test('Concurrent KKPhim imports use the same document identity; different sources remain distinct', () => {
    assert.equal(kkphimDocumentID('dua-con-cua-thoi-tiet'), 'kkphim-dua-con-cua-thoi-tiet');
    assert.notEqual(kkphimDocumentID('film-1'), kkphimDocumentID('film-2'));
    for (const slug of ['', '../film', 'film/name', 'a'.repeat(301)]) assert.equal(kkphimDocumentID(slug), null);
});
test('Duplicate audit excludes remakes, different seasons, plans, prices and incomplete titles', () => {
    const movie = { id: 'old', name: 'Movie', slug: 'movie', releaseYear: 2024, planID: 'basic', rent: 17000, listCategory: ['action'] };
    const exact = { listCategory: ['action'], ...movie, id: 'copy', createdAt: '2026-10-08', updatedAt: 100 };
    const variants = [{ releaseYear: 2025 }, { slug: 'movie-2' }, { planID: 'premium' }, { rent: 50000 }, { listCategory: ['drama'] }].map((change, i) => ({ ...movie, ...change, id: `different-${i}` }));
    const groups = exactDuplicateMovieGroups([movie, exact, ...variants, { id: 'empty' }]);
    assert.equal(groups.length, 1);
    assert.deepEqual(groups[0].map(item => item.id), ['copy', 'old']);
});

test('Only abandoned KKPhim copies without references can be archived automatically', () => {
    const now = Date.parse('2026-10-08T12:00:00Z');
    const movie = { importSource: 'kkphim', createdAt: '2026-10-08T10:00:00Z' };
    assert.equal(canRetireEmptyImport(movie, false, now), true);
    assert.equal(canRetireEmptyImport(movie, true, now), false);
    assert.equal(canRetireEmptyImport({ ...movie, createdAt: '2026-10-08T11:30:00Z' }, false, now), false);
    assert.equal(canRetireEmptyImport({ ...movie, createdAt: 'invalid' }, false, now), false);
    assert.equal(canRetireEmptyImport({ ...movie, importSource: 'manual' }, false, now), false);
});
