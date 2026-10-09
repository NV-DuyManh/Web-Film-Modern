import test from 'node:test';
import assert from 'node:assert/strict';
import { createCrawlerJob, crawlOptions } from './crawlerJob.js';
import { newestMoviesFirst, movieTime } from './movieRecency.js';
import { runCrawlerJob } from '../../scripts/lib/crawlerRunner.mjs';

function fixture() {
    let state = createCrawlerJob(crawlOptions(1, 2, 500), 'job-one', 1000);
    let time = 1000;
    const store = {
        read: async () => structuredClone(state),
        patch: async (id, patch) => {
            if (state.jobId !== id) return false;
            Object.assign(state, structuredClone(patch)); return true;
        },
    };
    const imported = [], pages = [];
    const run = overrides => runCrawlerJob({ store, now: () => time, sleep: async () => {},
        fetchPage: async page => { pages.push(page); return [{ slug: `page-${page}-new`, name: 'New' }, { slug: `page-${page}-old`, name: 'Old' }]; },
        importMovie: async item => { imported.push(item.slug); return { movies: 1, episodes: 2 }; }, ...overrides });
    return { run, imported, pages, state: () => state, change: patch => Object.assign(state, patch), advance: ms => { time += ms; } };
}

test('crawler imports older pages and older items first, while newest-first display follows source time', async () => {
    const f = fixture();
    const result = await f.run();
    assert.equal(result.state, 'done');
    assert.deepEqual(f.pages, [2, 1]);
    assert.deepEqual(f.imported, ['page-2-old', 'page-2-new', 'page-1-old', 'page-1-new']);
    assert.equal(f.state().progress, 100);
    assert.equal(f.state().stats.pages, 2);
    const movies = [
        { id: 'page-5', createdAt: '2026-10-09T12:00:00Z', sourceUpdatedAt: '2026-10-07T12:00:00Z' },
        { id: 'page-1', createdAt: '2026-10-09T10:00:00Z', sourceUpdatedAt: '2026-10-09T09:00:00Z' },
    ];
    assert.equal(movies.sort(newestMoviesFirst)[0].id, 'page-1');
});

test('dates accept ISO, milliseconds and Firestore timestamps; malformed dates cannot break sorting', () => {
    const date = Date.parse('2026-10-09T00:00:00Z');
    assert.equal(movieTime(date), date);
    assert.equal(movieTime({ seconds: date / 1000 }), date);
    assert.equal(movieTime({ toMillis: () => date }), date);
    assert.equal(movieTime('invalid'), 0);
    assert.deepEqual([{ id: 'old', createdAt: 2 }, { id: 'new', updatedAt: 4 }].sort(newestMoviesFirst).map(x => x.id), ['new', 'old']);
});

test('duplicate source entries and resumed completion receipts count each saved movie and its episodes once', async () => {
    const f = fixture();
    await f.run({ budgetMs: 1, importMovie: async () => { f.advance(2); return { movieId: 'same-film', movies: 1, episodes: 10 }; } });
    assert.deepEqual(f.state().countedMovieIds, ['same-film']);
    await f.run({ importMovie: async () => ({ movieId: 'same-film', movies: 1, episodes: 10 }) });
    assert.equal(f.state().stats.movies, 1);
    assert.equal(f.state().stats.episodes, 10);
    assert.equal(f.state().stats.skipped, 3);
});

test('worker time slice resumes from a durable cursor in a new process without importing a film twice', async () => {
    const f = fixture();
    assert.equal((await f.run({ budgetMs: 1, importMovie: async item => { f.imported.push(item.slug); f.advance(2); return { movies: 1 }; } })).state, 'queued');
    assert.equal(f.state().cursor.index, 1);
    await f.run();
    assert.equal(f.imported.length, 4);
    assert.equal(new Set(f.imported).size, 4);
    assert.equal(f.pages.filter(page => page === 2).length, 1);
});

test('pause saves the cursor; resume and stop work independently of the browser', async () => {
    const f = fixture();
    await f.run({ importMovie: async item => { f.imported.push(item.slug); f.change({ control: 'pause' }); return { movies: 1 }; } });
    assert.equal(f.state().status, 'paused');
    assert.equal(f.state().cursor.index, 1);
    f.change({ control: 'run', status: 'queued' });
    await f.run({ importMovie: async item => { f.imported.push(item.slug); f.change({ control: 'stop' }); return { movies: 1 }; } });
    assert.equal(f.state().status, 'stopped');
    assert.equal(f.imported.length, 2);
});

test('failed partial imports retry the same film, with bounded attempts and visible failures', async () => {
    const f = fixture();
    const broken = async () => { throw new Error('Temporary network failure'); };
    await f.run({ importMovie: broken });
    assert.equal(f.state().cursor.index, 0);
    assert.equal(f.state().retryCount, 1);
    await f.run({ importMovie: broken });
    assert.equal(f.state().retryCount, 2);
    await f.run({ importMovie: async item => item.slug === 'page-2-old' ? broken() : { movies: 1 } });
    assert.equal(f.state().status, 'done');
    assert.equal(f.state().failures.length, 1);
    assert.equal(f.state().stats.movies, 3);
});

test('active lease fences concurrent workers; a terminated worker can resume when lease expires', async () => {
    const f = fixture(); f.change({ status: 'running', lockUntil: 2000 });
    assert.equal((await f.run()).state, 'busy');
    assert.equal(f.pages.length, 0);
    f.advance(1001);
    assert.equal((await f.run()).state, 'done');
});

test('old worker never overwrites a replacement job, and invalid source pages are reported', async () => {
    const f = fixture();
    assert.equal((await f.run({ importMovie: async () => { f.change({ jobId: 'replacement' }); return { movies: 1 }; } })).state, 'superseded');
    assert.equal(f.state().jobId, 'replacement');
    const bad = fixture();
    await assert.rejects(bad.run({ fetchPage: async () => { throw new Error('API unavailable'); } }), /API unavailable/);
    assert.equal(bad.state().status, 'failed');
});

test('validate job bounds; an empty source page finishes instead of looping or inventing movies', async () => {
    for (const range of [[5, 1], [0, 5], [1, 101], [1.5, 2]]) assert.throws(() => crawlOptions(...range));
    assert.throws(() => crawlOptions(1, 5, 0));
    const f = fixture();
    await f.run({ fetchPage: async () => [] });
    assert.equal(f.state().stats.pages, 2);
    assert.equal(f.state().stats.movies, 0);
    assert.equal(f.state().status, 'done');
});
