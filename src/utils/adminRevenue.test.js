import test from 'node:test';
import assert from 'node:assert/strict';
import { completedPayments, dailyRevenue, paymentDay } from './adminRevenue.js';

test('Revenue excludes unpaid, invalid dates, negative values and other currencies', () => {
    const base = { startDate: '2026-10-08T01:00:00Z', status: 'success', price: 10 };
    const rows = [base, { ...base, status: 'pending' }, { ...base, status: 'failed' }, { ...base, price: -1 }, { ...base, currency: 'VND' }, { ...base, startDate: 'bad' }, { ...base, status: 'COMPLETED', price: 0.2 }];
    assert.equal(completedPayments(rows).length, 2);
    assert.deepEqual(dailyRevenue(completedPayments(rows)), [{ date: '2026-10-08', revenue: 10.2 }]);
    assert.equal(completedPayments(rows, { from: '2026-10-09' }).length, 0);
    assert.equal(paymentDay({ createdAt: '2026-10-07T18:00:00Z' }), '2026-10-08');
});
