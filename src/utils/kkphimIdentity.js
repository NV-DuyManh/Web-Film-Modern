const title = value => String(value || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');

// A known source is stronger than a translated title. Titles can be shared by
// unrelated remakes, while alternate seasons must remain separate records.
export function findKkphimMovie(movies, source) {
    if (!source?.slug) return null;
    const linked = movies.find(movie => movie.sourceSlug === source.slug);
    if (linked) return linked;
    const names = [source.name, source.origin_name].map(title).filter(Boolean);
    return movies.find(movie => !movie.sourceSlug
        && Number(movie.releaseYear || movie.year) > 0
        && Number(movie.releaseYear || movie.year) === Number(source.year)
        && (movie.slug === source.slug || [movie.name, movie.otherName].map(title).some(name => name && names.includes(name)))) || null;
}

// Legacy imports may already contain duplicate documents. Public discovery
// keeps one stable representative while database maintenance merges references.
export function uniqueKkphimMovies(movies) {
    const groups = new Map();
    for (const movie of movies) {
        const key = movie.sourceSlug ? `source:${movie.sourceSlug}` : `id:${movie.id}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(movie);
    }
    return [...groups.values()].map(group => {
        if (group.length === 1) return group[0];
        const time = movie => Date.parse(movie.createdAt) || Infinity;
        const ordered = [...group].sort((a,b) => time(a)-time(b) || String(a.id).localeCompare(String(b.id)));
        const [keeper,...duplicates] = ordered;
        const aliases = [...new Set([...(keeper.aliases || []), ...duplicates.flatMap(movie => [movie.id, movie.slug, ...(movie.aliases || [])])].filter(Boolean))];
        return { ...keeper, aliases,
            views: (Number(keeper.views) || 0) + duplicates.filter(movie => !(keeper.aliases || []).includes(movie.id)).reduce((sum,movie) => sum + (Number(movie.views) || 0), 0) };
    });
}
