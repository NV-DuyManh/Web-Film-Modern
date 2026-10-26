import { accountServices } from '../server/accounts/firebase.js';
import dailyRankingHandler from '../server/analytics/dailyRankingHandler.js';

export const config = { maxDuration: 15 };

export function createChatRankingsHandler({ readRows = async type => {
    // Only the fields needed to compute public counts leave Firestore.
    // Legacy accounts may not yet be represented in PublicStats/Favorites.
    const db = accountServices().db;
    const snapshot = type === 'favorites'
        ? await db.collection('Users').select('listFavorite').get()
        : await db.collection('Reviews').select('movieID', 'rate').get();
    return snapshot.docs.map(row => row.data());
}, now = Date.now } = {}) {
    const cache = new Map();
    return async (req, res) => {
        if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
        const type = new URL(req.url, 'https://mfilm.online').searchParams.get('type');
        if (!['favorites', 'ratings'].includes(type)) return res.status(400).end();
        let entry = cache.get(type);
        if (!entry || now() - entry.at > 60000) {
            const promise = readRows(type).then(rows => {
                const totals = new Map();
                for (const row of rows) {
                    if (type === 'favorites') {
                        for (const id of new Set(Array.isArray(row.listFavorite) ? row.listFavorite : [])) {
                            if (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,180}$/.test(id)) totals.set(id, (totals.get(id) || 0) + 1);
                        }
                    } else {
                        const rate = Number(row.rate);
                        if (!row.movieID || !Number.isFinite(rate) || rate <= 0 || rate > 5) continue;
                        const item = totals.get(row.movieID) || { sum: 0, count: 0 };
                        item.sum += rate; item.count++;
                        totals.set(row.movieID, item);
                    }
                }
                return type === 'favorites' ? { favorites: Object.fromEntries(totals) }
                    : { ratings: Object.fromEntries([...totals].map(([id, value]) => [id, { average: value.sum / value.count, count: value.count }])) };
            });
            entry = { at: now(), promise };
            cache.set(type, entry);
        }
        try {
            const data = await entry.promise;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, must-revalidate');
            res.setHeader('X-Robots-Tag', 'noindex');
            return res.status(200).end(req.method === 'HEAD' ? '' : JSON.stringify(data));
        } catch {
            cache.delete(type);
            return res.status(503).end();
        }
    };
}
const chatRankingsHandler = createChatRankingsHandler();
export default function handler(req, res) {
    return new URL(req.url, 'https://mfilm.online').searchParams.get('type') === 'daily'
        ? dailyRankingHandler(req, res) : chatRankingsHandler(req, res);
}
