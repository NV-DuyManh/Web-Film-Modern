import test from 'node:test';
import assert from 'node:assert/strict';
import { movieFormatMix, membershipMix, libraryPlans, movieOrigins, genreMix, genreBalance, polarSector } from './dashboardCharts.js';

test('Format distribution counts each title once and retains unknown formats in Other', () => {
    const types = [{ id: 'f', name: 'Phim Lẻ' }, { id: 's', name: 'Phim Bộ' }, { id: 'a', name: 'Hoạt Hình' }, { id: 'tv', name: 'TV Shows' }];
    const movies = ['f', 's', 's', 'a', 'tv', 'missing'].map(categoryTypeID => ({ categoryTypeID }));
    const result = movieFormatMix(movies, types);
    assert.deepEqual(result, [{ name: 'Films', value: 1 }, { name: 'Series', value: 2 }, { name: 'Animation', value: 1 }, { name: 'TV Shows', value: 1 }, { name: 'Other', value: 1 }]);
    assert.equal(result.reduce((sum, row) => sum + row.value, 0), movies.length);
    assert.deepEqual(movieFormatMix([], types), []);
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

test('Radar balances each genre to 100 percent while preserving original title counts', () => {
    const raw = [{ name: 'Drama', films: 4, series: 12 }, { name: 'Comedy', films: 2, series: 1 }, { name: 'Empty', films: 0, series: 0 }];
    const result = genreBalance(raw);
    assert.equal(result.length, 2);
    assert.deepEqual(result[0], { name: 'Drama', films: 4, series: 12, filmShare: 25, seriesShare: 75 });
    assert.equal(result[1].filmShare + result[1].seriesShare, 100);
    assert.equal(raw[0].filmShare, undefined);
});
