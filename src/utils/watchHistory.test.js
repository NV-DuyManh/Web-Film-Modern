import test from 'node:test';
import assert from 'node:assert/strict';
import { saveResume, getResume, clearResume, getResumeStore, getWatchedMoviesCount,
    configureResumeSync, mergeRemoteResume, mergeResumeEntry } from './watchHistory.js';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
test.beforeEach(() => storage.clear());

test('Rapid saves, backward seeks and deletion have a strict order even in the same millisecond', () => {
    const originalNow = Date.now;
    Date.now = () => 1000;
    try {
        saveResume('movie', { episodeId: 'ep', episodeNumber: 1, seconds: 100 }, 'A');
        const before = getResume('movie', 'A');
        saveResume('movie', { episodeId: 'ep', episodeNumber: 1, seconds: 10 }, 'A');
        const after = getResume('movie', 'A');
        assert.equal(mergeResumeEntry(before, after).episodes.ep, 10);
        assert.equal(mergeResumeEntry(after, before).episodes.ep, 10);
        clearResume('movie', null, 'A');
        const deleted = getResume('movie', 'A');
        assert.deepEqual(mergeResumeEntry(after, deleted).episodes, {});
        saveResume('movie', { episodeId: 'ep', episodeNumber: 1, seconds: 20 }, 'A');
        assert.equal(mergeResumeEntry(deleted, getResume('movie', 'A')).episodes.ep, 20);
    } finally { Date.now = originalNow; }
});

test('Resume reads and deletes stay isolated between guests and accounts', () => {
    saveResume('movie', { episodeId: 'ep', episodeNumber: 1, seconds: 45 });
    assert.equal(getResume('movie', 'A'), null);
    saveResume('movie', { episodeId: 'ep', episodeNumber: 1, seconds: 90 }, 'A');
    assert.equal(getResume('movie', 'A').episodes.ep, 90);
    assert.equal(getResume('movie', 'B'), null);
    clearResume('movie', null, 'A');
    assert.equal(getWatchedMoviesCount('A'), 0);
    assert.equal(getResume('movie').episodes.ep, 45);
});

test('Newer timestamps win even when playback seeks backwards; different devices retain different episodes', () => {
    const local = { updatedAt: 20, latestEpisodeId: 'one', episodes: { one: 10 }, episodeUpdatedAt: { one: 20 } };
    const remote = { updatedAt: 10, latestEpisodeId: 'two', episodes: { one: 100, two: 30 }, episodeUpdatedAt: { one: 5, two: 10 } };
    const merged = mergeResumeEntry(local, remote);
    assert.deepEqual(merged.episodes, { one: 10, two: 30 });
    assert.equal(merged.latestEpisodeId, 'one');
    const reset = mergeResumeEntry(merged, { updatedAt: 30, episodes: { one: 0 }, episodeUpdatedAt: { one: 30 } });
    assert.deepEqual(reset.episodes, { one: 0, two: 30 });
});

test('Removing history prevents stale offline data from resurrecting it, but later viewing restores it', () => {
    const tombstone = { updatedAt: 20, deletedAt: 20, episodes: {} };
    const stale = { updatedAt: 10, episodes: { ep: 100 } };
    assert.deepEqual(mergeResumeEntry(stale, tombstone).episodes, {});
    const later = { updatedAt: 30, episodes: { ep: 15 }, episodeUpdatedAt: { ep: 30 } };
    assert.equal(mergeResumeEntry(tombstone, later).episodes.ep, 15);
});

test('Cloud updates do not echo back as writes and a switched account cannot publish to the previous account', () => {
    const writesA = [];
    const stopA = configureResumeSync('A', (movie, entry) => writesA.push({ movie, entry }));
    saveResume('movie', { episodeId: 'one', seconds: 25, episodeNumber: 1 }, 'A');
    assert.equal(writesA.length, 1);
    mergeRemoteResume('movie', { updatedAt: Date.now() + 10, episodes: { two: 60 } }, 'A');
    assert.equal(writesA.length, 1);
    const writesB = [];
    const stopB = configureResumeSync('B', (movie, entry) => writesB.push({ movie, entry }));
    stopA();
    saveResume('movie', { episodeId: 'one', seconds: 26, episodeNumber: 1 }, 'A');
    saveResume('movie', { episodeId: 'one', seconds: 50, episodeNumber: 1 }, 'B');
    assert.equal(writesA.length, 1);
    assert.equal(writesB.length, 1);
    assert.equal(getResumeStore('A').movie.episodes.two, 60);
    stopB();
});
