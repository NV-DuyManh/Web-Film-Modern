import process from 'node:process';
import { readFile } from 'node:fs/promises';
import { accountServices } from '../accounts/firebase.js';
import { prepareCatalog } from '../seo/catalog.js';
import { createNameRouteIndex } from '../../src/utils/nameRoutes.js';
import { movieSummary } from '../../src/utils/publicCatalogFields.js';
import { ACTIVITY_WEIGHTS, rankDailyMovies, secondsUntilVietnamMidnight, vietnamDay } from '../../src/utils/dailyMovieRanking.js';
import { createDailyActivityStore } from './dailyActivity.js';

let store;
async function activityStore() {
    if (!store) {
        const db = process.env.NODE_ENV === 'development' && !process.env.VERCEL
            ? await (await import('../../scripts/lib/privateAdmin.mjs')).localAdminDatabase()
            : accountServices().db;
        store = createDailyActivityStore(db);
    }
    return store;
}

export function createDailyRankingHandler({ getStore = activityStore,
    readCatalog = async () => prepareCatalog(JSON.parse(await readFile(new URL('../seo/catalog.json', import.meta.url), 'utf8')).catalog).catalog.Movies,
    now = Date.now } = {}) {
    let catalog, loadingCatalog;
    const caches = new Map(), refreshes = new Map();
    const limits = new Map();
    const loadCatalog = async () => {
        if (!catalog) {
            loadingCatalog ||= readCatalog().then(movies => ({ movies, routes: createNameRouteIndex(movies, { preferSlug: true }) }));
            try { catalog = await loadingCatalog; } catch (error) { loadingCatalog = null; throw error; }
        }
        return catalog;
    };
    return async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('X-Robots-Tag', 'noindex');
        const send = (status, data) => res.status(status).end(req.method === 'HEAD' ? '' : JSON.stringify(data));
        const at = now(), day = vietnamDay(at);
        if (!['GET', 'HEAD', 'POST'].includes(req.method)) return send(405, { error: 'Method not allowed' });
        try {
            if (req.method === 'POST') {
                res.setHeader('Cache-Control', 'no-store');
                const origin = req.headers?.origin;
                const host = req.headers?.host;
                if (origin && new URL(origin).host !== host) return send(403, { error: 'Origin not allowed' });
                if (/bot|crawler|spider|headless|preview/i.test(req.headers?.['user-agent'] || '')) return send(202, { accepted: 0 });
                const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
                if (!body || !/^[a-zA-Z0-9_-]{16,80}$/.test(body.visitorId || '') || !Array.isArray(body.events) || body.events.length < 1 || body.events.length > 20 || JSON.stringify(body).length > 12000) return send(400, { error: 'Invalid activity batch' });
                const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
                // Bound accidental floods before any database work; receipts also deduplicate across instances.
                const window = Math.floor(at / 60000);
                for (const [key, entry] of limits) if (entry.window !== window) limits.delete(key);
                const quota = limits.get(ip) || { window, count: 0 };
                limits.set(ip, quota); quota.count++;
                if (quota.count > 30) return send(429, { error: 'Try again later' });
                const { routes } = await loadCatalog();
                const events = [];
                const seen = new Set();
                for (const event of body.events) {
                    if (!event || !Object.hasOwn(ACTIVITY_WEIGHTS, event.kind) || typeof event.movieId !== 'string' || !Number.isFinite(event.at) || event.at > at + 30000 || at - event.at > 300000) continue;
                    const movie = routes.find(event.movieId);
                    if (!movie) continue;
                    const date = vietnamDay(Math.min(event.at, at));
                    const key = `${date}:${movie.id}:${event.kind}`;
                    if (seen.has(key)) continue;
                    seen.add(key); events.push({ movieId: movie.id, kind: event.kind, day: date });
                }
                if (!events.length) return send(400, { error: 'No valid movie activity' });
                let timer;
                try {
                    const accepted = await Promise.race([
                        (await getStore()).record(body.visitorId, ip, events, at),
                        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Activity write timed out')), 7000); }),
                    ]);
                    return send(202, { accepted });
                } finally { clearTimeout(timer); }
            }
            const { movies } = await loadCatalog();
            let cached = caches.get(day);
            if (!cached || cached.date !== day || at - cached.at >= 60000) {
                if (!refreshes.has(day)) refreshes.set(day, getStore().then(service => service.read(day)).then(shards => {
                    const byID = new Map(movies.map(movie => [movie.id, movie]));
                    const items = rankDailyMovies(shards, movies.length).filter(item => byID.has(item.movieId)).slice(0, 10)
                        .map(item => ({ ...movieSummary(byID.get(item.movieId)), dailyActivity: item }));
                    caches.set(day, { date: day, at, items });
                    for (const date of caches.keys()) if (date < day) caches.delete(date);
                }).finally(() => { refreshes.delete(day); }));
                await refreshes.get(day);
                cached = caches.get(day);
            }
            res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${Math.min(60, secondsUntilVietnamMidnight(at))}, must-revalidate`);
            return send(200, { date: day, timezone: 'Asia/Ho_Chi_Minh', updatedAt: new Date(cached.at).toISOString(), items: cached.items });
        } catch (error) {
            console.warn('Daily movie ranking unavailable:', error.code || error.message);
            res.setHeader('Cache-Control', 'no-store');
            return send(503, { date: day, error: 'Daily ranking temporarily unavailable' });
        }
    };
}
export default createDailyRankingHandler();
