export function rankedRentals(rentals = []) {
    const counts = new Map();
    for (const rental of rentals) {
        if (rental.movieID) counts.set(rental.movieID, (counts.get(rental.movieID) || 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

// Movie metadata only; rental records and account data stay in their existing scoped cache.
export function createRankingMovieCache(readMovie) {
    const movies = new Map();
    const pending = new Map();
    return {
        peek: id => movies.get(id),
        remember(items) { for (const movie of items) movies.set(movie.id, movie); },
        load(id) {
            if (movies.has(id)) return Promise.resolve(movies.get(id));
            if (!pending.has(id)) {
                const request = Promise.resolve().then(() => readMovie(id)).then(movie => {
                    movies.set(id, movie);
                    return movie;
                }).finally(() => pending.delete(id));
                pending.set(id, request);
            }
            return pending.get(id);
        },
    };
}
