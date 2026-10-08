export function dateMillis(value) {
    if (value?.toMillis) return value.toMillis();
    if (value?.seconds != null) return value.seconds * 1000;
    return new Date(value ?? NaN).getTime();
}

export function paymentDay(record) {
    const time = dateMillis(record.paidAt || record.startDate || record.createdAt);
    return Number.isFinite(time) ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(time) : '';
}

export function completedPayments(records, { from = '', to = '', currency = 'USD' } = {}) {
    return (records || []).filter(record => {
        const day = paymentDay(record);
        const status = String(record.status || '').trim().toLowerCase();
        const unit = String(record.currency || 'USD').toUpperCase();
        return ['success', 'completed', 'paid'].includes(status) && unit === currency && day && (!from || day >= from) && (!to || day <= to) && Number.isFinite(Number(record.price)) && Number(record.price) >= 0;
    });
}

export function dailyRevenue(records, key = 'revenue') {
    const days = new Map();
    for (const record of records) {
        const date = paymentDay(record);
        if (date) days.set(date, (days.get(date) || 0) + Number(record.price));
    }
    return [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, [key]: Math.round(amount * 100) / 100 }));
}

export function formatAdminMoney(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: currency === 'VND' ? 0 : 2 }).format(Number(amount) || 0);
}
