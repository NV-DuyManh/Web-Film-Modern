import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { createKkphimImporter } from './kkphimImporter.js';

const db = getFirestore(initializeApp({ projectId: 'demo-import-test' }, 'import-test'));
function fixture(context, failBatch = false) {
    const records = new Map();
    const calls = [];
    const catalog = { Movies: [], Categories: [], CategoryTypes: [], Actors: [], Authors: [], Plans: [{ id: 'free', level: 0, price: 0 }] };
    context.mock.method(globalThis, 'fetch', async url => {
        calls.push(url);
        return { ok: true, json: async () => url.includes('/images') ? { data: {} } : {
            movie: { name: 'Phim chọn', origin_name: 'Chosen Movie', type: 'single', category: [{ name: 'Hành Động' }],
                country: [{ slug: 'viet-nam' }], actor: ['Actor One'], director: [], year: 2024, lang: 'Vietsub', time: '100 phút',
                poster_url: 'https://phimimg.com/poster.jpg', status: 'completed' },
            episodes: [{ server_name: 'Vietsub', server_data: [{ name: 'Full', link_embed: 'https://player.example/full', link_m3u8: 'https://player.example/full.m3u8' }] }],
        } };
    });
    const save = (reference, values) => records.set(reference.path, { ...records.get(reference.path), ...values });
    let fail = failBatch;
    const io = {
        read: async reference => ({ data: () => records.get(reference.path) }),
        query: async () => ({ docs: [] }),
        set: async (reference, values) => save(reference, values),
        update: async (reference, values) => save(reference, values),
        batch: async items => {
            if (fail) { fail = false; throw new Error('Connection lost'); }
            items.forEach(item => save(item.ref, item.values));
        },
    };
    return { records, calls, importer: createKkphimImporter({ db, io, catalog: async () => catalog }) };
}

test('immediate import persists movie, artwork, entities and playable episodes; repeats do not duplicate', async context => {
    const f = fixture(context);
    const item = { slug: 'chosen-movie', name: 'Phim chọn', origin_name: 'Chosen Movie' };
    const stats = await f.importer(item, { jobId: 'direct-one', page: 1 });
    assert.equal(stats.movies, 1);
    assert.equal(stats.episodes, 1);
    const movie = f.records.get('Movies/kkphim-chosen-movie');
    assert.equal(movie.sourceSlug, 'chosen-movie');
    assert.equal(movie.planID, 'free');
    assert.equal(movie.rent, 0);
    assert.equal(movie.bannerUrl, movie.imgUrl);
    assert.equal(movie.crawlImportState, 'complete');
    assert.equal(movie.listActor.length, 1);
    const episodes = [...f.records.entries()].filter(([path]) => path.startsWith('Episodes/'));
    assert.equal(episodes.length, 1);
    assert.equal(episodes[0][1].urlM3u8, 'https://player.example/full.m3u8');
    assert.deepEqual(await f.importer(item, { jobId: 'direct-two', page: 1 }), { skipped: 1 });
    assert.equal(f.calls.filter(url => !url.includes('/images')).length, 1);
});

test('an interrupted immediate import can be retried without duplicate movie, entities or episodes', async context => {
    const f = fixture(context, true);
    const item = { slug: 'retry-movie', name: 'Phim chọn', origin_name: 'Chosen Movie' };
    await assert.rejects(f.importer(item, { jobId: 'attempt-one', page: 1 }), /Connection lost/);
    assert.equal(f.records.get('Movies/kkphim-retry-movie').crawlImportState, 'pending');
    const result = await f.importer(item, { jobId: 'attempt-two', page: 1 });
    assert.equal(result.episodes, 1);
    assert.equal(f.records.get('Movies/kkphim-retry-movie').crawlImportState, 'complete');
    assert.equal([...f.records.keys()].filter(path => path.startsWith('Movies/')).length, 1);
    assert.equal([...f.records.keys()].filter(path => path.startsWith('Actors/')).length, 1);
    assert.equal([...f.records.keys()].filter(path => path.startsWith('Episodes/')).length, 1);
});
