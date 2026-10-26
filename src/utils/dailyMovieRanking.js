export const ACTIVITY_COOLDOWN_MS = 30 * 60 * 1000;
export const ACTIVITY_WEIGHTS = Object.freeze({ click: 1, open: 2, watch: 5 });

// Vietnam has no daylight-saving changes. All visitors share this calendar day.
export function vietnamDay(at = Date.now()) {
    return new Date(at + 7 * 3600000).toISOString().slice(0, 10);
}

export function secondsUntilVietnamMidnight(at = Date.now()) {
    return Math.max(1, Math.ceil((Date.parse(`${vietnamDay(at)}T00:00:00+07:00`) + 86400000 - at) / 1000));
}

export function rankDailyMovies(shards, limit = 10) {
    const totals = new Map();
    for (const shard of shards) {
        for (const [id, values] of Object.entries(shard.movies || {})) {
            const total = totals.get(id) || { movieId: id, click: 0, open: 0, watch: 0 };
            for (const kind of Object.keys(ACTIVITY_WEIGHTS)) total[kind] += Math.max(0, Math.floor(Number(values[kind]) || 0));
            totals.set(id, total);
        }
    }
    return [...totals.values()].map(item => ({ ...item,
        score: Object.entries(ACTIVITY_WEIGHTS).reduce((sum, [kind, weight]) => sum + item[kind] * weight, 0),
    })).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || b.watch - a.watch || b.open - a.open || a.movieId.localeCompare(b.movieId))
        .slice(0, limit);
}

export function withDailyRankingFallback(daily = [], previous = [], limit = 10) {
    const selected = new Map();
    for (const movie of daily) if (movie?.id && !selected.has(movie.id)) selected.set(movie.id, movie);
    const fallback = [...previous].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0) || String(a.id).localeCompare(String(b.id)));
    for (const movie of fallback) if (movie?.id && !selected.has(movie.id)) selected.set(movie.id, { ...movie, dailyActivity: null });
    return [...selected.values()].slice(0, limit);
}

// Count playback, not a seek to second 30 or time spent paused/buffering.
export function createWatchMeter(now = Date.now) {
    let previous, watched = 0, sent = false;
    return {
        reset() { previous = undefined; watched = 0; sent = false; },
        sample(position) {
            const at = now();
            if (!Number.isFinite(position)) return false;
            if (previous) {
                const wall = (at - previous.at) / 1000;
                const delta = position - previous.position;
                if (wall > 0 && wall <= 15 && delta > 0 && delta <= wall * 2.5 + 1) watched += Math.min(delta, wall);
            }
            previous = { at, position };
            if (!sent && watched >= 30) { sent = true; return true; }
            return false;
        },
    };
}
