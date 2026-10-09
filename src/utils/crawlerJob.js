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
    return { jobId, options: crawlOptions(options.pageStart, options.pageEnd, options.delayMs),
        status: 'queued', control: 'run', requestedAt: now, heartbeatAt: 0, lockUntil: 0,
        cursor: { page: Number(options.pageEnd), index: 0 }, pageItems: [], progress: 0,
        stats: { ...EMPTY_CRAWL_STATS }, logs: [], failures: [] };
}
