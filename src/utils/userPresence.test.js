import test from 'node:test';
import assert from 'node:assert/strict';
import { isPresenceSessionOnline, onlineUserIds, PRESENCE_TTL_MS } from './userPresence.js';
import { startUserPresence } from '../services/userPresence.js';

test('Multiple tabs count once; expired or delayed offline heartbeats do not count', () => {
    const now = 1_800_000_000_000;
    const live = { seenAt: now - 1000, lastSeen: { seconds: (now - 1000) / 1000 } };
    assert.deepEqual([...onlineUserIds([{ userID: 'alice', sessions: { a: live, b: live } }, { userID: 'bob', sessions: { a: { ...live, seenAt: now - PRESENCE_TTL_MS } } }], now)], ['alice']);
    assert.equal(isPresenceSessionOnline({ seenAt: now - PRESENCE_TTL_MS, lastSeen: now }, now), false);
    assert.equal(isPresenceSessionOnline({ seenAt: now, lastSeen: null }, now), false);
    assert.equal(isPresenceSessionOnline({ seenAt: now, lastSeen: now }, now), true);
});

function runtime() {
    const win = new EventTarget();
    const page = new EventTarget();
    page.visibilityState = 'visible';
    win.setInterval = fn => { win.tick = fn; return 1; };
    win.clearInterval = () => { win.tick = null; };
    const network = { onLine: true };
    let now = 1000000, sequence = 0;
    return { win, page, network, advance: () => { now += 60000; win.tick?.(); }, options: { window: win, document: page, navigator: network, clock: () => now, makeId: () => `session-${++sequence}` } };
}
const settled = () => new Promise(resolve => setImmediate(resolve));

test('Heartbeat renews, logout clears only its lease and stops timers', async () => {
    const r = runtime(), calls = [];
    const service = Object.fromEntries(['open', 'touch', 'close'].map(method => [method, async (...args) => { calls.push([method, ...args]); }]));
    const stop = startUserPresence(service, 'alice', r.options);
    await settled(); r.advance(); await settled(); await stop();
    assert.deepEqual(calls, [['open', 'alice', 'session-1'], ['touch', 'alice', 'session-1'], ['close', 'alice', 'session-1']]);
    assert.equal(r.win.tick, null);
    r.win.dispatchEvent(new Event('online'));
    assert.equal(calls.length, 3);
});

test('A delayed first heartbeat cannot recreate a closed tab lease', async () => {
    const r = runtime(), calls = [];
    let finish;
    const service = { open: () => new Promise(resolve => { finish = resolve; }), touch: async () => {}, close: async (uid, id) => { calls.push([uid, id]); } };
    const stop = startUserPresence(service, 'alice', r.options);
    const closing = stop();
    finish(); await closing;
    assert.deepEqual(calls, [['alice', 'session-1'], ['alice', 'session-1']]);
});

test('Back/forward cache restores with a new lease; offline resumes on reconnection', async () => {
    const r = runtime(), calls = [];
    const service = Object.fromEntries(['open', 'touch', 'close'].map(method => [method, async (...args) => { calls.push([method, ...args]); }]));
    const stop = startUserPresence(service, 'alice', r.options);
    await settled(); r.win.dispatchEvent(new Event('pagehide')); await settled();
    r.win.dispatchEvent(new Event('pageshow')); await settled();
    r.network.onLine = false; r.win.dispatchEvent(new Event('offline')); await settled();
    r.network.onLine = true; r.win.dispatchEvent(new Event('online')); await settled();
    await stop();
    assert.deepEqual(calls.filter(([method]) => method === 'open').map(([, , id]) => id), ['session-1', 'session-2', 'session-3']);
});
