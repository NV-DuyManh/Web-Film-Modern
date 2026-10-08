import test from 'node:test';
import assert from 'node:assert/strict';
import { adminUserPasswordError, adminUserSubmitData } from './adminUserForm.js';

test('Editing profile information with a blank password preserves the stored password', () => {
    for (const password of ['', undefined, null, '   ']) {
        const form = { id: 'existing', name: 'Updated name', password };
        assert.equal(adminUserPasswordError(form), '');
        const patch = adminUserSubmitData(form);
        assert.equal(Object.hasOwn(patch, 'password'), false);
        assert.equal({ password: 'existing-secret', ...patch }.password, 'existing-secret');
        assert.equal(patch.name, 'Updated name');
        assert.ok(Object.is(form.password, password));
    }
    const oauthUser = { id: 'google-user', name: 'Updated Google user' };
    assert.equal(Object.hasOwn(adminUserSubmitData(oauthUser), 'password'), false);
});

test('New accounts still require a password and supplied passwords are preserved exactly', () => {
    for (const password of ['', undefined, null, '   ']) {
        assert.equal(adminUserPasswordError({ password }), 'Please enter password');
    }
    const user = { name: 'New user', password: ' example-secret ' };
    assert.equal(adminUserPasswordError(user), '');
    assert.equal(adminUserSubmitData(user).password, user.password);
    assert.equal(adminUserSubmitData({ ...user, id: 'existing' }).password, user.password);
});
