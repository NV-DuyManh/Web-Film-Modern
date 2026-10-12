import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyRevenue, membershipMix, libraryPlans, movieOrigins, genreMix, polarSector } from './dashboardCharts.js';
import { completedPayments } from './adminRevenue.js';

test('Monthly stacked revenue preserves paid totals, currency and chronological order', () => {
    const records = [{ status: 'paid', price: .1, paidAt: '2026-08-01' }, { status: 'success', price: .2, paidAt: '2026-08-22' }, { status: 'pending', price: 500, paidAt: '2026-08-01' }, { status: 'paid', price: 25000, currency: 'VND', paidAt: '2026-08-01' }];
    assert.deepEqual(monthlyRevenue(completedPayments(records), [{ price: 4, paidAt: '2026-09-01' }, { price: 2, paidAt: '2026-08-08' }]), [
        { month: '2026-08', memberships: .3, rentals: 2 }, { month: '2026-09', memberships: 0, rentals: 4 },
    ]);
});

test('Each client and each movie counts once, with consistent tier colors and unknown IDs retained', () => {
    const users = [{ role: 'admin', plan: 'Premium' }, { plan: 'Free' }, { plan: 'Plus' }, { plan: 'Plus' }];
    const mix = membershipMix(users, user => ({ name: user.plan }));
    assert.equal(mix.reduce((sum, row) => sum + row.value, 0), 3);
    const library = libraryPlans([{}, { planID: 'plus' }, { planID: 'missing' }], [{ id: 'plus', name: 'Plus', level: 2 }]);
    assert.equal(library.find(row => row.name === 'Plus').color, mix.find(row => row.name === 'Plus').color);
    assert.equal(library.reduce((sum, row) => sum + row.value, 0), 3);
    assert.equal(library.find(row => row.name === 'Unknown').value, 1);
});

test('Polar country groups use one primary country and preserve all movies in top five plus Other', () => {
    const movies = [{ countriesID: ['Nhật Bản', 'Mỹ'] }, { countriesID: 'Japan' }, ...['Trung Quốc', 'Âu Mỹ', 'Hàn Quốc', 'Thái Lan', 'Pháp', 'Việt Nam', ''].map(countriesID => ({ countriesID }))];
    const origins = movieOrigins(movies);
    assert.equal(origins.find(row => row.name === 'Japan').value, 2);
    assert.equal(origins.length, 6);
    assert.equal(origins.reduce((sum, row) => sum + row.value, 0), movies.length);
});

test('Radar compares film and series counts on the same scale, without double-counting secondary genres', () => {
    const categories = [{ id: 'a', name: 'Hành Động' }, { id: 'r', name: 'Lãng Mạn' }];
    const types = [{ id: 'f', name: 'Phim Lẻ' }, { id: 's', name: 'Phim Bộ' }, { id: 'anime', name: 'Hoạt Hình' }];
    const movies = [{ categoryTypeID: 'f', listCategory: ['a', 'r'] }, { categoryTypeID: 's', listCategory: ['a'] }, { categoryTypeID: 'anime', listCategory: ['a'] }];
    assert.deepEqual(genreMix(movies, categories, types), [{ name: 'Action', films: 1, series: 1 }]);
});

test('Polar sectors scale area with count and render a full disk for a single group', () => {
    const quarter = polarSector(0, 4, 25, 100, 100);
    assert.match(quarter, /A 50 50/);
    assert.equal((polarSector(0, 1, 100, 100).match(/ A /g) || []).length, 2);
    assert.deepEqual(movieOrigins([]), []);
    assert.deepEqual(genreMix([]), []);
});
