import { publicCatalogRecord, movieSummary, movieIndexRecord } from './publicCatalogFields.js';
import { homeCatalog } from './homeCatalog.js';

// This small bridge covers completed imports until the deployment snapshot catches up.
// It limits cache size, never the number of movies an admin can import.
export function mergeRecentCatalog(updates, movie, at = Date.now()) {
    const next = [{ at, movie: movieSummary(publicCatalogRecord(movie)) }, ...updates.filter(update => update.movie?.id !== movie.id)]
        .sort((a, b) => b.at - a.at).slice(0, 200);
    while (next.length > 1 && new TextEncoder().encode(JSON.stringify(next)).length > 500000) next.pop();
    return next;
}

export function recentMoviesSince(updates, publishedAt, publishedMovies) {
    const cutoff = Date.parse(publishedAt || '') || 0;
    const ids = publishedMovies && new Set(publishedMovies.map(movie => movie.id));
    return updates.filter(update => Number.isFinite(update.at) && (update.at > cutoff || (ids && !ids.has(update.movie?.id))) && typeof update.movie?.id === 'string' && update.movie.name)
        .map(update => publicCatalogRecord(update.movie));
}

export function applyRecentMovies(items, updates, indexOnly = false) {
    const movies = new Map(items.map(movie => [movie.id, movie]));
    for (const update of updates) movies.set(update.id, { ...movies.get(update.id), ...(indexOnly ? movieIndexRecord(update) : update) });
    return [...movies.values()];
}

export function applyRecentHome(home, movies) {
    if (!movies.length) return home;
    return { ...home, ...homeCatalog({ catalog: { Movies: applyRecentMovies(home.movies, movies), CategoryTypes: home.categoryTypes || [] } }) };
}
