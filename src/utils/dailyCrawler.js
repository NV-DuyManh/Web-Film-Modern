import { createCrawlerJob, crawlOptions, CRAWLER_ACTIVE } from './crawlerJob.js';

export const DAILY_CRAWLER_SETTINGS_ID = 'DailyKkphimCrawler';
export function vietnamDay(now = Date.now()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function nextDailyCrawlerJob(previous, now = Date.now()) {
    if (previous?.enabled === false || CRAWLER_ACTIVE.includes(previous?.status) || previous?.queuedDay === vietnamDay(now)) return null;
    // Five newest pages (normally around 120 recently updated films). Existing
    // titles keep their plan and price; incomplete imports resume on later runs.
    return { ...createCrawlerJob(crawlOptions(1, 5, 1500), `daily-${vietnamDay(now)}`, now),
        enabled: true, automatic: true, queuedDay: vietnamDay(now) };
}
