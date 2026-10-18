import { episodeKey, episodeInfo, normalizeEpisodes } from './episodes.js';
import { movieTime } from './movieRecency.js';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const positive = value => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
export const movieSeriesKey = title => normalize(title);
export const SERIES_FIELDS = ['seriesMode', 'seriesTitle', 'seriesKey', 'seasonNumber', 'watchOrder'];

export function mergePartDetails(index, details) {
    const merged = { ...index, ...details };
    if (movieTime(index.updatedAt) > movieTime(details.updatedAt)) {
        for (const key of SERIES_FIELDS) if (index[key] !== undefined) merged[key] = index[key];
    }
    return merged;
}
const roman = value => {
    const values = { I: 1, V: 5, X: 10, L: 50, C: 100 };
    return [...value.toUpperCase()].reduce((sum, char, i, chars) => sum + (values[char] < values[chars[i + 1]] ? -values[char] : values[char]), 0);
};
function titlePart(value) {
    const title = String(value || '').trim();
    const match = title.match(/\s*(?:[([]\s*)?(?:phần|phan|mùa|mua|season|part)\s+(\d+|[ivxlc]+)\s*[)\]]?\s*$/i);
    const base = (match ? title.slice(0, match.index) : title).replace(/[\s:–—-]+$/, '').trim();
    return { title: base, key: normalize(base), number: match ? positive(match[1]) || roman(match[1]) : null };
}
function identity(movie) {
    const titles = [movie.otherName, movie.name].filter(Boolean).map(titlePart);
    const manual = movie.seriesMode === 'manual';
    return {
        manual, title: manual ? String(movie.seriesTitle || '').trim() : titles[0]?.title || '',
        keys: manual ? [normalize(movie.seriesTitle)].filter(Boolean) : titles.map(title => title.key).filter(key => key.length >= 4),
        explicit: manual || titles.some(title => title.number),
        number: (manual && positive(movie.seasonNumber)) || titles.find(title => title.number)?.number || 1,
    };
}

// Exact base-title matches only; arbitrary trailing numbers and fuzzy title
// similarity are not enough to join a movie to another franchise.
export function movieParts(current, movies = []) {
    const empty = { title: '', parts: [] };
    if (!current?.id || current.seriesMode === 'none') return empty;
    const source = identity(current);
    const candidates = [...new Map([...movies, current].filter(movie => movie?.id).map(movie => [movie.id, movie])).values()];
    const matches = candidates.filter(movie => {
        if (movie.seriesMode === 'none') return false;
        const target = identity(movie);
        if (source.manual !== target.manual || !source.keys.some(key => target.keys.includes(key))) return false;
        if (!source.manual && ((current.countriesID && movie.countriesID && normalize(current.countriesID) !== normalize(movie.countriesID))
            || (current.categoryTypeID && movie.categoryTypeID && String(current.categoryTypeID) !== String(movie.categoryTypeID)))) return false;
        return true;
    });
    // Legacy/manual records can point at the same imported season. Keep the
    // current record as its representative so saved links remain selectable.
    const seasons = new Map();
    for (const movie of matches) {
        const key = movie.sourceSlug ? `source:${movie.sourceSlug}:${identity(movie).number}` : `id:${movie.id}`;
        const previous = seasons.get(key);
        if (!previous || movie.id === current.id || (previous.id !== current.id && String(movie.id).localeCompare(String(previous.id)) < 0)) seasons.set(key, movie);
    }
    const unique = [...seasons.values()];
    if (unique.length < 2 || !unique.some(movie => identity(movie).explicit)) return empty;
    const parts = unique.map(movie => {
        const part = identity(movie);
        return { ...movie, partNumber: part.number, partOrder: positive(movie.watchOrder) || part.number };
    }).sort((a, b) => a.partOrder - b.partOrder || a.partNumber - b.partNumber
        || (Number(a.releaseYear) || 0) - (Number(b.releaseYear) || 0) || String(a.id).localeCompare(String(b.id)));
    return { title: source.title, parts };
}

export function nextMoviePart(current, parts = []) {
    const index = parts.findIndex(part => part.id === current?.id);
    return index < 0 ? null : parts[index + 1] || null;
}

export function isFinalEpisode(episodes, current, movie = {}) {
    const ordered = normalizeEpisodes(episodes);
    const expected = positive(movie.endEpisode);
    if (expected && (episodeInfo(current)?.end || 0) < expected) return false;
    return !!current?.id && ordered.length > 0 && ordered.at(-1).id === current.id && episodeKey(ordered.at(-1)) === episodeKey(current);
}

export function nextPartAfterCompletion(finished, movie, episode, episodes, group, canWatch) {
    if (!canWatch || group.loading || finished?.movieId !== movie?.id || finished?.episodeId !== episode?.id) return null;
    return isFinalEpisode(episodes, episode, movie) ? group.nextPart || null : null;
}

export function seriesSettingsError(movie) {
    if (movie.seriesMode !== 'manual') return '';
    if (!movieSeriesKey(movie.seriesTitle) || String(movie.seriesTitle).trim().length > 120) return 'Enter a series title (1–120 characters).';
    if (!positive(movie.seasonNumber) || Number(movie.seasonNumber) > 999) return 'Part number must be an integer from 1 to 999.';
    if (!positive(movie.watchOrder) || Number(movie.watchOrder) > 10000) return 'Watch order must be an integer from 1 to 10,000.';
    return '';
}
