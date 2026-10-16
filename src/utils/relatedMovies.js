const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const ids = (...values) => new Set(values.flat().map(value => String(value?.id ?? value ?? '').trim()).filter(Boolean));
const overlap = (a, b) => [...a].filter(value => b.has(value)).length;
const identity = movie => ids(movie.id, movie.slug, movie.routeSlug);
const genres = movie => ids(movie.listCategory, movie.categories);
const actors = movie => ids(movie.actor, movie.actors, movie.listActor);
const authors = movie => ids(movie.author, movie.listAuthor);
const titles = movie => new Set([movie.name, movie.otherName].map(value => normalize(value)
    .replace(/\b(?:phan|season|part)\s*(?:\d+|[ivx]+)\b/g, '').replace(/\s+/g, ' ').trim())
    .filter(value => value.length >= 6 && !/^(dang cap nhat|unknown)$/.test(value)));
const countries = movie => new Set(String(movie.countriesID || movie.country || '').split(/[,;/]/).map(normalize).filter(Boolean));

// Rank against the current film, never the position of a movie in the new-release feed.
export function relatedMovies(currentMovie, movies = [], limit = 8) {
    if (!currentMovie?.id || limit <= 0) return [];
    const current = { identity: identity(currentMovie), genres: genres(currentMovie), actors: actors(currentMovie),
        authors: authors(currentMovie), titles: titles(currentMovie), countries: countries(currentMovie) };
    const seen = new Set(current.identity);
    const candidates = [];
    for (const movie of movies) {
        if (!movie?.id) continue;
        const references = identity(movie);
        if ([...references].some(reference => seen.has(reference))) continue;
        references.forEach(reference => seen.add(reference));
        const movieGenres = genres(movie);
        const sharedGenres = overlap(current.genres, movieGenres);
        const sharedActors = overlap(current.actors, actors(movie));
        const sharedAuthors = overlap(current.authors, authors(movie));
        const sameSeries = overlap(current.titles, titles(movie)) > 0;
        // Country/type alone is too broad to call a film related. Return fewer honest matches.
        if (!sameSeries && !sharedGenres && !sharedActors && !sharedAuthors) continue;
        const union = new Set([...current.genres, ...movieGenres]).size;
        const sameType = currentMovie.categoryTypeID && String(currentMovie.categoryTypeID) === String(movie.categoryTypeID);
        const score = (sameSeries ? 30 : 0) + sharedGenres * 2 + (union ? 6 * sharedGenres / union : 0)
            + Math.min(sharedActors, 3) * 4 + Math.min(sharedAuthors, 2) * 5
            + (sameType ? 2 : 0) + (overlap(current.countries, countries(movie)) ? 2 : 0);
        candidates.push({ movie, score });
    }
    return candidates.sort((a, b) => b.score - a.score || (Number(b.movie.views) || 0) - (Number(a.movie.views) || 0)
        || String(a.movie.id).localeCompare(String(b.movie.id))).slice(0, limit).map(item => item.movie);
}
