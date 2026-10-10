import test from 'node:test';
import assert from 'node:assert/strict';
import { readAdminSnapshot } from './privateAdmin.mjs';

test('One-shot admin snapshots release the live listener after success or failure', async () => {
    for (const fail of [false, true]) {
        let closed = 0;
        const ref = { onSnapshot(ok, bad) { queueMicrotask(() => fail ? bad(new Error('Denied')) : ok({ size: 2 })); return () => { closed++; }; } };
        if (fail) await assert.rejects(readAdminSnapshot(ref), /Denied/);
        else assert.equal((await readAdminSnapshot(ref)).size, 2);
        assert.equal(closed, 1);
    }
});
test('A hanging admin snapshot times out and closes its listener', async () => {
    let closed = 0;
    await assert.rejects(readAdminSnapshot({ onSnapshot() { return () => { closed++; }; } }, 5), /timed out/);
    assert.equal(closed, 1);
});
