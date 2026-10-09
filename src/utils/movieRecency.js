export function movieTime(value) {
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (value && Number.isFinite(value.seconds)) return value.seconds * 1000;
    const time = typeof value === 'number' ? value : Date.parse(value || '');
    return Number.isFinite(time) && time > 0 ? time : 0;
}

export function movieRecency(movie) {
    return movieTime(movie.sourceUpdatedAt) || movieTime(movie.updatedAt) || movieTime(movie.createdAt);
}

export function newestMoviesFirst(a, b) {
    return movieRecency(b) - movieRecency(a) || String(a.slug || a.id || '').localeCompare(String(b.slug || b.id || ''));
}
