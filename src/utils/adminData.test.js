import test from 'node:test';
import assert from 'node:assert/strict';
import { completedPayments, dailyRevenue, movieMatchesFilters, safeAuditFields, paymentDay } from './adminData.js';

test('Revenue excludes unpaid, invalid dates, negative values and other currencies', () => {
    const base = { startDate: '2026-10-08T01:00:00Z', status: 'success', price: 10 };
    const rows = [base, { ...base, status: 'pending' }, { ...base, status: 'failed' }, { ...base, price: -1 }, { ...base, currency: 'VND' }, { ...base, startDate: 'bad' }, { ...base, status: 'COMPLETED', price: 0.2 }];
    assert.equal(completedPayments(rows).length, 2);
    assert.deepEqual(dailyRevenue(completedPayments(rows)), [{ date: '2026-10-08', revenue: 10.2 }]);
    assert.equal(completedPayments(rows, { from: '2026-10-09' }).length, 0);
    assert.equal(paymentDay({ createdAt: '2026-10-07T18:00:00Z' }), '2026-10-08');
});

test('Movie filters combine accented searches, categories, plans and missing rental price', () => {
    const movie = { id: 'kkphim-conan', name: 'Thám Tử Lừng Danh', planID: 'paid', listCategory: ['anime'], releaseYear: 2024, endEpisode: 12, rent: 0 };
    assert.equal(movieMatchesFilters(movie, { category: 'anime', year: '2024', source: 'kkphim', quality: 'rent' }, 'tham tu'), true);
    assert.equal(movieMatchesFilters(movie, { planID: 'free' }, ''), false);
    assert.equal(movieMatchesFilters({ ...movie, planID: 'free' }, { quality: 'rent' }, '', ['free']), false);
    assert.equal(movieMatchesFilters(movie, { quality: 'episodes' }), false);
});

test('Audit logs record field names without credentials or uploaded content', () => {
    assert.deepEqual(safeAuditFields({ id: 'x', name: 'N', password: 'p', accessToken: 't', avatarUrl: 'a', imgFile: {}, role: 'user' }), ['name', 'role']);
});
