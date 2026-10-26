import { ACTIVITY_COOLDOWN_MS, ACTIVITY_WEIGHTS, vietnamDay } from '../utils/dailyMovieRanking.js';

function browserStorage() { try { return globalThis.localStorage; } catch { return null; } }

export function createMovieActivityTracker({ storage = browserStorage(), page = globalThis.document,
    win = globalThis.window, network = globalThis.navigator, send = globalThis.fetch?.bind(globalThis),
    now = Date.now, makeId = () => crypto.randomUUID() } = {}) {
    let visitorId, timer, pending = [], inFlight = false, installed = false;
    const memory = new Map();
    const cooldownKey = (day, movieId, kind) => `mfilm_daily:${day}:${movieId}:${kind}`;
    const read = key => { try { return storage?.getItem(key) ?? memory.get(key); } catch { return memory.get(key); } };
    const write = (key, value) => { memory.set(key, value); try { storage?.setItem(key, String(value)); } catch { /* Private browsing still tracks within this tab. */ } };
    function visitor() {
        if (visitorId) return visitorId;
        visitorId = read('mfilm_activity_visitor');
        if (!/^[a-zA-Z0-9_-]{16,80}$/.test(visitorId || '')) { visitorId = makeId(); write('mfilm_activity_visitor', visitorId); }
        return visitorId;
    }
    function schedule(delay = 4000) {
        if (!timer) timer = win?.setTimeout(() => { timer = null; void flush(); }, delay);
    }
    async function flush() {
        if (inFlight || !pending.length || network?.onLine === false || !send) return;
        if (timer) { win?.clearTimeout(timer); timer = null; }
        pending = pending.filter(event => now() - event.at <= 300000);
        const batch = pending.splice(0, 20);
        if (!batch.length) return;
        inFlight = true;
        try {
            const response = await send('/api/daily-ranking', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitorId: visitor(), events: batch }), keepalive: true,
                signal: AbortSignal.timeout(10000),
            });
            if (!response.ok && response.status !== 400 && response.status !== 403) throw new Error('Activity unavailable');
        } catch {
            pending = [...batch, ...pending].slice(-100);
        } finally {
            inFlight = false;
            if (pending.length) schedule(30000);
        }
    }
    function track(movieId, kind) {
        if (typeof movieId !== 'string' || !movieId || movieId.length > 250 || !Object.hasOwn(ACTIVITY_WEIGHTS, kind)) return;
        const at = now(), day = vietnamDay(at), key = cooldownKey(day, movieId, kind);
        const last = Number(read(key));
        if (last && at - last < ACTIVITY_COOLDOWN_MS) return;
        write(key, at);
        pending.push({ movieId, kind, at });
        if (pending.length >= 20) void flush(); else schedule();
    }
    function install() {
        if (installed || !page || !win) return () => {};
        installed = true;
        // Keep storage bounded; only today's cooldown entries are useful.
        try {
            for (const key of Object.keys(storage || {})) if (key.startsWith('mfilm_daily:') && !key.startsWith(`mfilm_daily:${vietnamDay(now())}:`)) storage.removeItem(key);
        } catch { /* Storage is optional. */ }
        const click = event => {
            if (event.type === 'auxclick' && event.button !== 1) return;
            const link = event.target?.closest?.('a[href]');
            if (!link) return;
            const url = new URL(link.href, win.location.href);
            if (url.origin !== win.location.origin) return;
            const match = /^\/(?:phim|xem-phim)\/([^/]+)\/?$/.exec(url.pathname);
            if (match) { try { track(decodeURIComponent(match[1]), 'click'); } catch { /* Ignore malformed links. */ } }
        };
        const hidden = () => { if (page.visibilityState === 'hidden') void flush(); };
        const leaving = () => { void flush(); };
        page.addEventListener('click', click, true);
        page.addEventListener('auxclick', click, true);
        page.addEventListener('visibilitychange', hidden);
        win.addEventListener('pagehide', leaving);
        win.addEventListener('online', leaving);
        return () => {
            installed = false;
            page.removeEventListener('click', click, true);
            page.removeEventListener('auxclick', click, true);
            page.removeEventListener('visibilitychange', hidden);
            win.removeEventListener('pagehide', leaving);
            win.removeEventListener('online', leaving);
            if (timer) win.clearTimeout(timer);
            timer = null;
            void flush();
        };
    }
    return { track, flush, install };
}

let tracker;
const current = () => tracker ||= createMovieActivityTracker();
export const trackDailyMovieActivity = (movieId, kind) => current().track(movieId, kind);
export const startDailyMovieActivity = () => current().install();
