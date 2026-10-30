import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMembership, resolveCommentMember, activeSubscription, membershipTime } from '../src/utils/membership.js';
import { createPublicProfileReader } from '../server/accounts/publicProfiles.js';
import { createPublicMemberCache } from '../src/services/publicMemberProfiles.js';

const at = Date.parse('2026-10-30T15:00:00Z');
const plans = [{ id: 'free', name: 'Free', level: 0 }, { id: 'basic', name: 'Basic', level: 1 }, { id: 'plus', name: 'Plus', level: 2 }, { id: 'premium', name: 'Premium', level: 3 }];
const user = { id: 'member', name: 'Manh', planID: 'free', selectedFrame: 'red' };
const subscription = (planID, extra = {}) => ({ userID: user.id, planID, startDate: at - 1000, expiryDate: at + 600000, status: 'Success', ...extra });

test('highest active membership wins over a Free/lower assigned plan; other accounts never affect it', () => {
    assert.equal(resolveMembership(user, [subscription('premium')], plans, at).name, 'Premium');
    assert.equal(resolveMembership({ ...user, planID: 'plus' }, [subscription('basic')], plans, at).name, 'Plus');
    assert.equal(resolveMembership(user, [subscription('premium', { userID: 'someone-else' })], plans, at).level, 0);
    assert.equal(resolveMembership({ ...user, role: 'admin' }, [], plans, at).name, 'ADMIN');
});

test('pending, cancelled, expired and future subscriptions never grant a badge or playback tier', () => {
    const invalid = [subscription('premium', { status: 'pending' }), subscription('premium', { status: 'cancel' }),
        subscription('premium', { status: 'failed' }), subscription('premium', { expiryDate: at }), subscription('premium', { startDate: at + 1000 })];
    assert.equal(resolveMembership(user, invalid, plans, at).level, 0);
    assert.equal(resolveMembership(user, [...invalid, subscription('plus', { status: 'success' })], plans, at).level, 2);
    assert.ok(activeSubscription(subscription('basic', { status: '' }), at), 'legacy successful rows without status stay compatible');
});

test('Firestore, serialized, Date and ISO expirations resolve identically', () => {
    for (const expiryDate of [new Date(at + 600000), new Date(at + 600000).toISOString(), { seconds: (at + 600000) / 1000 }, { _seconds: (at + 600000) / 1000 }, { toMillis: () => at + 600000 }]) {
        assert.equal(resolveMembership(user, [subscription('premium', { expiryDate })], plans, at).level, 3);
        assert.equal(membershipTime(expiryDate), at + 600000);
    }
    assert.equal(resolveMembership({ ...user, membership: { plan: { level: 999 } } }, [], plans, at).level, 0, 'display projection never grants access');
});

test('all comment surfaces use the authoritative profile regardless of viewer identity or an old author snapshot', () => {
    const comment = { userID: user.id, author: { name: 'Old', planName: 'Free', level: 0, selectedFrame: 'blue' } };
    const profile = { ...user, membership: { plan: resolveMembership(user, [subscription('premium')], plans, at), nextChangeAt: at + 600000 } };
    for (const viewer of [null, user, { id: 'other', planID: 'basic' }]) {
        void viewer;
        const display = resolveCommentMember(comment, profile, at);
        assert.equal(display.plan.name, 'Premium'); assert.equal(display.user.name, 'Manh'); assert.equal(display.user.selectedFrame, 'red');
    }
    assert.equal(resolveCommentMember(comment, { ...profile, membership: { plan: { name: 'FREE', level: 0 } } }, at).plan.level, 0, 'expired/current Free overrides old Premium snapshot');
    assert.equal(resolveCommentMember({ userID: user.id }, undefined, at).plan, null, 'unavailable membership is not Free');
    assert.equal(resolveCommentMember(comment, undefined, at).plan, null, 'historical Free snapshot cannot flash during loading');
    assert.equal(resolveCommentMember(comment, profile, at + 600000).plan, null, 'expired cached labels are hidden until refreshed');
});

function fixture() {
    let time = at, reads = 0;
    const rows = { Users: [{ ...user, email: 'private@example.test', password: 'private', phone: 'private' }], Plans: plans, Subscriptions: [subscription('premium')] };
    function query(name, fields = []) {
        return { name, fields, where(_field, _op, ids) { return { ...query(name, fields), ids }; }, select(...fields) { return { ...this, fields }; }, limit(size) { return { ...this, limitSize: size }; } };
    }
    const db = { collection: name => query(name) };
    const calls = [];
    const reader = createPublicProfileReader({ db, now: () => time, read: async q => { reads++; calls.push(q); return rows[q.name].filter(row => !q.ids || q.ids.includes(q.name === 'Subscriptions' ? row.userID : row.id)); } });
    return { rows, reader, calls, reads: () => reads, advance: ms => { time += ms; } };
}

test('public endpoint derives subscriptions from selected authors only, strips private fields, caches reads and expires on time', async () => {
    const f = fixture();
    const [first, concurrent] = await Promise.all([f.reader([user.id]), f.reader([user.id])]);
    assert.deepEqual(concurrent, first); assert.equal(f.reads(), 3);
    assert.equal(first[0].membership.plan.level, 3);
    assert.equal(first[0].selectedFrame, 'red');
    for (const field of ['email', 'password', 'phone', 'expiryDate', 'transactionID']) assert.equal(first[0][field], undefined);
    assert.deepEqual(f.calls.find(q => q.name === 'Users').ids, [user.id]);
    assert.deepEqual(f.calls.find(q => q.name === 'Subscriptions').ids, [user.id]);
    await f.reader([user.id]); assert.equal(f.reads(), 3);
    f.advance(60000); f.rows.Subscriptions = [];
    assert.equal((await f.reader([user.id]))[0].membership.plan.level, 0);
    await assert.rejects(f.reader(['invalid/id']), error => error.status === 400);
    assert.deepEqual(await f.reader([]), []);
});

test('public lookup failures propagate without fabricating Free or caching a failed read', async () => {
    const reader = createPublicProfileReader({ db: { collection: () => ({ where() { return this; }, select() { return this; }, limit() { return this; } }) }, read: async () => { throw new Error('quota'); } });
    await assert.rejects(reader([user.id]), /quota/);
    await assert.rejects(reader([user.id]), /quota/);
});

test('client batches at most 30 IDs, coalesces requests and refreshes the server timestamp even after login', async () => {
    let requests = 0, time = at;
    const ids = Array.from({ length: 63 }, (_, i) => `user-${i}`);
    const cache = createPublicMemberCache({ now: () => time, request: async batch => { requests++; assert.ok(batch.length <= 30); return batch.map(id => ({ id, membership: { plan: { name: 'Premium', level: 3 }, checkedAt: time, nextChangeAt: time + 600000 } })); } });
    const [a, b] = await Promise.all([cache.load(ids), cache.load(ids)]);
    assert.equal(requests, 3); assert.deepEqual(a, b); assert.equal(a.length, 63);
    await cache.load(ids); assert.equal(requests, 3);
    time += 60000; await cache.load(ids); assert.equal(requests, 6);
    cache.clear(); await cache.load(ids); assert.equal(requests, 9);
});
