export const normalizeAdminText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

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
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: currency === 'VND' ? 0 : 2 }).format(Number(amount) || 0);
}

export function movieMatchesFilters(movie, filters = {}, keyword = '', freePlanIDs = []) {
    const text = normalizeAdminText(keyword);
    if (text && !normalizeAdminText(`${movie.name || ''} ${movie.otherName || ''} ${movie.slug || ''}`).includes(text)) return false;
    if (filters.planID && movie.planID !== filters.planID) return false;
    if (filters.status && movie.status !== filters.status) return false;
    if (filters.year && String(movie.releaseYear) !== String(filters.year)) return false;
    if (filters.category && !(movie.listCategory || []).includes(filters.category)) return false;
    const source = normalizeAdminText(movie.source || movie.importSource || (String(movie.id).startsWith('kkphim-') ? 'kkphim' : 'manual'));
    if (filters.source === 'kkphim' && !source.includes('kkphim')) return false;
    if (filters.source === 'manual' && source.includes('kkphim')) return false;
    if (filters.quality === 'image' && movie.imgUrl && !/logo|src\/assets/i.test(movie.imgUrl)) return false;
    if (filters.quality === 'episodes' && Number(movie.endEpisode) > 0) return false;
    if (filters.quality === 'rent' && (freePlanIDs.includes(movie.planID) || Number(movie.rent) > 0)) return false;
    return true;
}

export function safeAuditFields(values) {
    return Object.keys(values || {}).filter(key => !/password|token|secret|avatar|img|url|file/i.test(key) && key !== 'id' && !key.startsWith('__'));
}
