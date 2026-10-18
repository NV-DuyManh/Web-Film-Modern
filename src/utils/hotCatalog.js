import { movieSummary, publicCatalogRecord } from './publicCatalogFields.js';
import { newestMoviesFirst, movieTime } from './movieRecency.js';

export function hotCatalogEdit(movie, removed = false) {
    if (!removed && typeof movie.isHot !== 'boolean') return null;
    return { isHot: !removed && movie.isHot === true,
        ...(!removed && movie.isHot === true && movie.name ? { movieJson: JSON.stringify(movieSummary(publicCatalogRecord(movie))) } : {}) };
}

// Keep the published fallback aligned with saved admin choices as well.
export function applyHotFlags(movies, edits = {}) {
    return movies.map(movie => typeof edits[movie.id]?.isHot === 'boolean'
        ? { ...movie, isHot: edits[movie.id].isHot } : movie);
}

// Explicit admin choices override the deployment snapshot, including false.
export function hotCatalogMovies(movies, edits = {}) {
    const byID = new Map(movies.map(movie => [movie.id, movie]));
    for (const [id, edit] of Object.entries(edits)) {
        if (typeof edit?.isHot !== 'boolean') continue;
        let added = {};
        try { if (edit.movieJson) added = publicCatalogRecord(JSON.parse(edit.movieJson)); } catch { /* Retain the known public record. */ }
        const current = byID.get(id);
        const details = current && movieTime(current.updatedAt) >= movieTime(added.updatedAt)
            ? { ...added, ...current } : { ...current, ...added };
        if (current || added.name) byID.set(id, { ...details, id, isHot: edit.isHot });
    }
    return [...byID.values()].filter(movie => movie.isHot === true).sort(newestMoviesFirst).slice(0, 20);
}
