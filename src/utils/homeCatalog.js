import { listingMovies } from '../../server/seo/catalog.js';
import { movieSummary } from './publicCatalogFields.js';

export function homeCatalog(prepared, now = Date.now()) {
    const movies = listingMovies('/film-new', prepared);
    const fill = items => [...items, ...movies.filter(movie => !items.includes(movie))].slice(0, 15);
    const score = movie => {
        const views = Number(movie.views) || 0;
        const created = movie.createdAt ? new Date(movie.createdAt).getTime() : new Date('2024-01-01').getTime();
        const days = Math.max(1, (now - created) / 86400000);
        return (views * 0.3 + views / days * 0.7) * (1 + (movie.planID ? 0.2 : 0) + (movie.rent ? 0.3 : 0));
    };
    const animeType = prepared.catalog.CategoryTypes?.find(type => /anime|hoạt hình/i.test(type.name || ''));
    const sections = {
        hot: movies.filter(movie => movie.isHot).slice(0, 20),
        new: movies.slice(0, 15),
        top: [...movies].sort((a, b) => score(b) - score(a)).slice(0, 10),
        cinema: listingMovies('/cinema-movies', prepared).slice(0, 15),
        coming: listingMovies('/film-coming', prepared).slice(0, 15),
        hongkong: listingMovies('/film-hongkong', prepared).slice(0, 15),
        anime: animeType ? fill(movies.filter(movie => movie.categoryTypeID === animeType.id)) : movies.slice(0, 15),
    };
    for (const country of ['Nhật Bản', 'Trung Quốc', 'Hàn Quốc', 'Việt Nam']) {
        sections[`country:${country}`] = movies.filter(movie => movie.countriesID?.toLowerCase() === country.toLowerCase()).slice(0, 60);
    }
    const selected = new Map(Object.values(sections).flat().map(movie => [movie.id, movie]));
    return { sections: Object.fromEntries(Object.entries(sections).map(([key, values]) => [key, values.map(movie => movie.id)])),
        movies: [...selected.values()], categoryIDs: [...new Set(movies.flatMap(movie => movie.listCategory || []))] };
}

export function compactMovies(movies) { return movies.map(movieSummary); }
