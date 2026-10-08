import test from 'node:test';
import assert from 'node:assert/strict';
import { scanAdminPage } from './adminPaging.js';

test('Filtered cursor pages neither skip nor duplicate lookahead matches', async () => {
    const data = Array.from({ length: 25 }, (_, i) => i + 1);
    let reads = 0;
    const fetch = async cursor => { reads++; return data.filter(value => value > (cursor || 0)).slice(0, 7); };
    const first = await scanAdminPage(fetch, value => value % 2 === 0, null, 3);
    assert.deepEqual(first.rows, [2, 4, 6]);
    assert.equal(first.hasNext, true);
    assert.equal(reads, 2);
    const second = await scanAdminPage(fetch, value => value % 2 === 0, first.cursor, 3);
    assert.deepEqual(second.rows, [8, 10, 12]);
    const last = await scanAdminPage(fetch, value => value > 22, null, 3);
    assert.deepEqual(last.rows, [23, 24, 25]);
    assert.equal(last.hasNext, false);
});
