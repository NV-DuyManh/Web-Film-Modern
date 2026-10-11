import test from 'node:test';
import assert from 'node:assert/strict';
import { completedPayments, dailyRevenue, paymentDay, formatAdminMoney } from './adminRevenue.js';

test('Revenue excludes unpaid, invalid dates, negative values and other currencies', () => {
    const base = { startDate: '2026-10-08T01:00:00Z', status: 'success', price: 10 };
    const rows = [base, { ...base, status: 'pending' }, { ...base, status: 'failed' }, { ...base, price: -1 }, { ...base, currency: 'VND' }, { ...base, startDate: 'bad' }, { ...base, status: 'COMPLETED', price: 0.2 }];
    assert.equal(completedPayments(rows).length, 2);
    assert.deepEqual(dailyRevenue(completedPayments(rows)), [{ date: '2026-10-08', revenue: 10.2 }]);
    assert.equal(completedPayments(rows, { from: '2026-10-09' }).length, 0);
    assert.equal(paymentDay({ createdAt: '2026-10-07T18:00:00Z' }), '2026-10-08');
});

test('VND revenue uses original VND payments within inclusive date bounds', () => {
    const rows = [
        { status: 'paid', currency: 'VND', price: 25000, paidAt: '2026-10-08T01:00:00Z' },
        { status: 'completed', currency: 'VND', price: 50000, paidAt: '2026-10-09T01:00:00Z' },
        { status: 'success', currency: 'USD', price: 10, paidAt: '2026-10-08T01:00:00Z' },
        { status: 'pending', currency: 'VND', price: 100000, paidAt: '2026-10-08T01:00:00Z' },
    ];
    assert.deepEqual(dailyRevenue(completedPayments(rows, { currency: 'VND', from: '2026-10-08', to: '2026-10-08' })), [{ date: '2026-10-08', revenue: 25000 }]);
    assert.equal(completedPayments(rows, { currency: 'VND', from: '2026-10-09', to: '2026-10-08' }).length, 0);
    assert.equal(formatAdminMoney(25000, 'VND'), '25.000\u00a0₫');
    assert.equal(formatAdminMoney(10.5, 'USD'), '$10.50');
});
