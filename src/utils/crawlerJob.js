export const CRAWLER_SETTINGS_ID = 'KkphimCrawler';
export const CRAWLER_ACTIVE = ['queued', 'running', 'paused'];
export const EMPTY_CRAWL_STATS = { movies: 0, episodes: 0, categories: 0, actors: 0, directors: 0, pages: 0, errors: 0, skipped: 0 };

export function crawlOptions(start, end, delay = 1500) {
    const pageStart = Number(start), pageEnd = Number(end), delayMs = Number(delay);
    if (!Number.isInteger(pageStart) || !Number.isInteger(pageEnd) || pageStart < 1 || pageEnd < pageStart || pageEnd > 10000 || pageEnd - pageStart >= 100) {
        throw new Error('Choose a valid page range (up to 100 pages).');
    }
    if (!Number.isInteger(delayMs) || delayMs < 500 || delayMs > 10000) throw new Error('Delay must be between 500 and 10000 ms.');
    return { pageStart, pageEnd, delayMs };
}

export function createCrawlerJob(options, jobId, now = Date.now()) {
    const validated = options.type === 'selected' ? selectedMovieOptions(options.movies, options.delayMs) : crawlOptions(options.pageStart, options.pageEnd, options.delayMs);
    return { jobId, options: validated,
        status: 'queued', control: 'run', requestedAt: now, heartbeatAt: 0, lockUntil: 0,
        cursor: { page: validated.pageEnd, index: 0 }, pageItems: [], progress: 0,
        stats: { ...EMPTY_CRAWL_STATS }, logs: [], failures: [], countedMovieIds: [] };
}

export function selectedMovieOptions(movies, delayMs = 1500) {
    if (!Array.isArray(movies) || !movies.length || movies.length > 20) throw new Error('Select between 1 and 20 movies.');
    const seen = new Set();
    const selected = movies.map(item => {
        if (!item || typeof item.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) throw new Error('Invalid KKPhim movie.');
        if (seen.has(item.slug)) throw new Error('A movie can only be selected once.');
        seen.add(item.slug);
        return { slug: item.slug, name: String(item.name || '').slice(0, 250), origin_name: String(item.origin_name || '').slice(0, 250),
            modified: { time: String(item.modified?.time || '').slice(0, 50) } };
    });
    return { ...crawlOptions(1, 1, delayMs), type: 'selected', movies: selected };
}
