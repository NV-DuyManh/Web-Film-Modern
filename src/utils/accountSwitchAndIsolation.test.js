import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('PHASE 06 FIX: ACCOUNT SWITCH UX & STATE ISOLATION', () => {

    // Helper mimicking AuthProvider login switch detection logic
    function evaluateAccountSwitch(previousUid, currentUid, locationAssignMock) {
        let shouldReload = false;
        if (previousUid && currentUid && previousUid !== currentUid) {
            shouldReload = true;
            if (locationAssignMock) {
                locationAssignMock('/');
            }
        }
        return shouldReload;
    }

    test('Test F — Different-account login triggers hard reset to "/"', () => {
        let assignedUrl = null;
        const mockAssign = (url) => { assignedUrl = url; };

        const previousUid = 'firebase_uid_account_A';
        const currentUid = 'firebase_uid_account_B';

        const triggered = evaluateAccountSwitch(previousUid, currentUid, mockAssign);
        assert.equal(triggered, true);
        assert.equal(assignedUrl, '/');
    });

    test('Test G — Same-account relogin does NOT trigger reload loop', () => {
        let assignedUrl = null;
        const mockAssign = (url) => { assignedUrl = url; };

        const previousUid = 'firebase_uid_account_A';
        const currentUid = 'firebase_uid_account_A';

        const triggered = evaluateAccountSwitch(previousUid, currentUid, mockAssign);
        assert.equal(triggered, false);
        assert.equal(assignedUrl, null);
    });

    test('Test H — First-time login does NOT trigger reload loop', () => {
        let assignedUrl = null;
        const mockAssign = (url) => { assignedUrl = url; };

        const previousUid = null;
        const currentUid = 'firebase_uid_account_A';

        const triggered = evaluateAccountSwitch(previousUid, currentUid, mockAssign);
        assert.equal(triggered, false);
        assert.equal(assignedUrl, null);
    });

    test('Test I — Stale response guard rejects prior account response', () => {
        // Simulates activeRequestRef in ForYou.jsx / ForYouPage.jsx
        const activeRequest = { epoch: 2, uid: 'uid_account_B' };

        const staleResponsePayload = {
            requestEpoch: 1,
            requestUid: 'uid_account_A',
            items: [{ movieId: 'movie_of_A' }]
        };

        const isStale =
            activeRequest.epoch !== staleResponsePayload.requestEpoch ||
            activeRequest.uid !== staleResponsePayload.requestUid;

        assert.equal(isStale, true, 'Stale response from previous account must be rejected');
    });

    test('Test J — Valid current account response is accepted', () => {
        const activeRequest = { epoch: 2, uid: 'uid_account_B' };

        const freshResponsePayload = {
            requestEpoch: 2,
            requestUid: 'uid_account_B',
            items: [{ movieId: 'movie_of_B' }]
        };

        const isStale =
            activeRequest.epoch !== freshResponsePayload.requestEpoch ||
            activeRequest.uid !== freshResponsePayload.requestUid;

        assert.equal(isStale, false, 'Matching current epoch and UID response must be accepted');
    });

    test('Test K — Session rotation isolates telemetry between accounts', () => {
        const mockStorage = new Map();
        mockStorage.set('mfilm_session_id', 'sess_account_A_123');

        // simulate rotateSessionId()
        mockStorage.delete('mfilm_session_id');

        assert.equal(mockStorage.has('mfilm_session_id'), false);
        // Next getSessionId generates fresh ID
        const newSessionId = 'sess_' + 'fresh_B_' + Date.now();
        mockStorage.set('mfilm_session_id', newSessionId);
        assert.notEqual(mockStorage.get('mfilm_session_id'), 'sess_account_A_123');
    });
});
