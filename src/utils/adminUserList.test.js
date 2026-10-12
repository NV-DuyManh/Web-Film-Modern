import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAdminUsers } from './adminUserList.js';

const users = [
    { id: 'client-offline', name: 'Alice', role: 'user', email: 'alice@example.invalid' },
    { id: 'admin-offline', name: 'Bob', role: 'admin' },
    { id: 'client-online', fullName: 'Charlie', role: 'user', phone: '123456' },
    { id: 'admin-online', name: 'Dana', role: 'admin' },
    { id: 'legacy-client', name: 'Eve' },
];
const onlineIds = new Set(['client-online', 'admin-online']);

test('Online users sort before pagination while preserving order within each status', () => {
    const result = filterAdminUsers(users, { onlineIds });
    assert.deepEqual(result.map(user => user.id), ['client-online', 'admin-online', 'client-offline', 'admin-offline', 'legacy-client']);
    assert.deepEqual(result.slice(0, 2).map(user => user.id), ['client-online', 'admin-online']);
    assert.equal(users[0].id, 'client-offline');
});

test('Admin and Client tabs retain both offline and online accounts', () => {
    assert.deepEqual(filterAdminUsers(users, { role: 'admin', onlineIds }).map(user => user.id), ['admin-online', 'admin-offline']);
    assert.deepEqual(filterAdminUsers(users, { role: 'client', onlineIds }).map(user => user.id), ['client-online', 'client-offline', 'legacy-client']);
});

test('Search combines with roles and live status changes reorder the full list', () => {
    assert.equal(filterAdminUsers(users, { role: 'client', search: ' CHARLIE ', onlineIds })[0].id, 'client-online');
    assert.equal(filterAdminUsers(users, { role: 'client', search: '123', onlineIds })[0].id, 'client-online');
    assert.equal(filterAdminUsers(users, { role: 'admin', search: 'alice', onlineIds }).length, 0);
    assert.deepEqual(filterAdminUsers(users, { role: 'admin', onlineIds: new Set(['admin-offline']) }).map(user => user.id), ['admin-offline', 'admin-online']);
    assert.deepEqual(filterAdminUsers(users).map(user => user.id), users.map(user => user.id));
});
