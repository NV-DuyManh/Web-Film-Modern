import { crawlOptions, CRAWLER_ACTIVE } from '../../src/utils/crawlerJob.js';

// Durable page snapshots and cursors let a different cloud process resume the same job.
// The GitHub concurrency group serializes workers. jobId fences stale writes after replacement.
export async function runCrawlerJob({ store, fetchPage, importMovie, now = Date.now,
    sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), budgetMs = 10 * 60000, owner = 'worker' }) {
    let job = await store.read();
    if (!job || !CRAWLER_ACTIVE.includes(job.status)) return { state: 'idle' };
    if (job.control === 'stop') {
        await store.patch(job.jobId, { status: 'stopped', lockUntil: 0 });
        return { state: 'stopped' };
    }
    if (job.control === 'pause' || job.status === 'paused') return { state: 'paused' };
    if (Number(job.lockUntil) > now()) return { state: 'busy' };
    const options = crawlOptions(job.options.pageStart, job.options.pageEnd, job.options.delayMs);
    const started = now(), id = job.jobId;
    let stats = { ...job.stats }, logs = [...(job.logs || [])], failures = [...(job.failures || [])];
    let cursor = { ...job.cursor }, pageItems = [...(job.pageItems || [])];
    const log = (message, type = 'info') => {
        logs.unshift({ message, type, at: now(), time: new Date(now()).toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }) });
        logs = logs.slice(0, 100);
    };
    const checkpoint = async (extra = {}) => {
        const total = options.pageEnd - options.pageStart + 1;
        const completed = options.pageEnd - cursor.page + (pageItems.length ? cursor.index / pageItems.length : 0);
        return store.patch(id, { cursor, pageItems, stats, logs, failures: failures.slice(-100),
            progress: Math.min(99, Math.floor(completed / total * 100)), heartbeatAt: now(),
            lockUntil: now() + 20 * 60000, ...extra });
    };
    log(`Cloud crawl started: pages ${options.pageEnd} → ${options.pageStart}. Newest films remain first.`);
    if (!await checkpoint({ status: 'running', owner })) return { state: 'superseded' };
    try {
        while (cursor.page >= options.pageStart) {
            const control = await store.read();
            if (control?.jobId !== id) return { state: 'superseded' };
            if (control.control === 'stop' || control.control === 'pause') {
                const status = control.control === 'stop' ? 'stopped' : 'paused';
                log(status === 'stopped' ? 'Stopped by administrator.' : 'Paused. Progress is saved.', 'warning');
                await checkpoint({ status, lockUntil: 0 });
                return { state: status };
            }
            if (now() - started >= budgetMs) {
                log('Progress saved. The next cloud run will continue.');
                await checkpoint({ status: 'queued', lockUntil: 0 });
                return { state: 'queued' };
            }
            if (!pageItems.length) {
                const items = await fetchPage(cursor.page);
                // KKPhim lists newest first; import oldest first, INCLUDING within each page.
                pageItems = [...items].reverse().filter(item => typeof item.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug));
                cursor.index = 0;
                log(`Page ${cursor.page}: ${pageItems.length} films.`);
                if (!await checkpoint()) return { state: 'superseded' };
            }
            if (cursor.index >= pageItems.length) {
                stats.pages++;
                cursor = { page: cursor.page - 1, index: 0 };
                pageItems = [];
                if (!await checkpoint()) return { state: 'superseded' };
                await sleep(options.delayMs);
                continue;
            }
            const item = pageItems[cursor.index];
            try {
                const delta = await importMovie(item, { jobId: id, page: cursor.page });
                for (const [key, count] of Object.entries(delta || {})) if (key in stats) stats[key] += count;
                log(`${delta?.skipped ? 'Already imported' : 'Saved'}: ${item.name || item.slug}`, 'success');
            } catch (error) {
                // Keep the failed item at its cursor. Retry on a later worker instead of abandoning a partially saved film.
                const attempt = Number(job.retryCount || 0) + 1;
                stats.errors++;
                log(`${item.slug}: ${error.message}`, 'error');
                if (attempt < 3) {
                    await checkpoint({ status: 'queued', retryCount: attempt, lockUntil: 0 });
                    return { state: 'queued' };
                }
                failures.push({ slug: item.slug, page: cursor.page, message: String(error.message).slice(0, 300) });
            }
            cursor.index++;
            job.retryCount = 0;
            if (!await checkpoint({ retryCount: 0 })) return { state: 'superseded' };
            await sleep(Math.max(300, Math.floor(options.delayMs / 2)));
        }
        log(`Finished: ${stats.movies} films, ${stats.episodes} episodes, ${failures.length} failed films.`, failures.length ? 'warning' : 'success');
        await checkpoint({ status: 'done', progress: 100, finishedAt: now(), lockUntil: 0 });
        return { state: 'done', stats };
    } catch (error) {
        log(error.message, 'error');
        await checkpoint({ status: 'failed', lastError: String(error.message).slice(0, 300), lockUntil: 0 });
        throw error;
    }
}
