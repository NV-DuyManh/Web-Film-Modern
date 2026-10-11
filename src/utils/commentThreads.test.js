import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommentThreads, commentTime, commentLikes } from './commentThreads.js';

test('old comments and replies to replies form one conversation without hiding orphans', () => {
    const comments = [
        { id: 'a', description: 'old comment', createdAt: 10 },
        { id: 'b', parentID: 'a', createdAt: { seconds: 2 } },
        { id: 'c', parentID: 'b', createdAt: '2026-10-11T00:00:00Z' },
        { id: 'orphan', parentID: 'deleted', createdAt: 20 },
    ];
    const threads = buildCommentThreads(comments);
    assert.equal(threads.length, 2);
    assert.deepEqual(threads.find(row => row.comment.id === 'a').replies.map(reply => reply.id), ['b', 'c']);
    assert.equal(threads[0].comment.id, 'orphan');
    assert.equal(commentTime(comments[1]), 2000);
    assert.equal(commentTime(comments[2]), Date.parse('2026-10-11T00:00:00Z'));
});

test('popular sorting counts each real account once and never mutates source records', () => {
    const comments = Object.freeze([
        Object.freeze({ id: 'older', createdAt: 1, likedBy: ['a', 'a', 'b', null] }),
        Object.freeze({ id: 'newer', createdAt: 2, likedBy: ['c'] }),
    ]);
    assert.equal(buildCommentThreads(comments)[0].comment.id, 'newer');
    assert.equal(buildCommentThreads(comments, 'popular')[0].comment.id, 'older');
    assert.deepEqual(commentLikes(comments[0]), ['a', 'b']);
    assert.deepEqual(commentLikes({ likedBy: 3 }), []);
});

test('malformed legacy cycles do not lose comments or recurse forever', () => {
    const comments = [{ id: 'a', parentID: 'b' }, { id: 'b', parentID: 'a' }];
    assert.equal(buildCommentThreads(comments).length, 2);
});
