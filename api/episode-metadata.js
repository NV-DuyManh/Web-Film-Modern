import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, collection, query, where, setDoc } from 'firebase/firestore';
import { normalizeEpisodes } from '../src/utils/episodes.js';

export const config = { maxDuration: 60 };

let database;
const db = () => database ||= getFirestore(getApps().find(app => app.name === 'episode-metadata') || initializeApp({ projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk' }, 'episode-metadata'));
const stamp = movie => `2:${movie.sourceEpisodesFingerprint || ''}:${movie.episodeMetadataVersion || 0}`;
export const publicEpisodeMetadata = episodes => normalizeEpisodes(episodes).map(episode => ({
    id: episode.id, movieID: episode.movieID, numberEpisode: episode.numberEpisode, nameEpisode: String(episode.nameEpisode || episode.numberEpisode),
    legacyEpisodeNumbers: episode.legacyEpisodeNumbers || [], hasFirstServer: Boolean(episode.url || episode.urlM3u8), hasSecondServer: Boolean(episode.url2),
}));

export function createEpisodeMetadataHandler({
    readMovie = async id => (await getDoc(doc(db(), 'Movies', id))).data(),
    readCache = async id => (await getDoc(doc(db(), 'Settings', `EpisodeMetadata_${id}`))).data(),
    readEpisodes = async id => (await getDocs(query(collection(db(), 'Episodes'), where('movieID', '==', id)))).docs.map(item => ({ ...item.data(), id: item.id })),
    saveCache = (id, values) => setDoc(doc(db(), 'Settings', `EpisodeMetadata_${id}`), values), now = Date.now,
} = {}) {
    const memory = new Map(), pending = new Map();
    return async (req, res) => {
        if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
        const id = new URL(req.url, 'https://www.mfilm.online').searchParams.get('movieId') || '';
        if (!/^[a-zA-Z0-9_-]{1,350}$/.test(id)) return res.status(400).end('Invalid movie.');
        try {
            let cached = memory.get(id);
            if (!cached || cached.expiresAt <= now()) {
                let loading = pending.get(id);
                if (!loading) {
                    loading = (async () => {
                        const [movie, previous] = await Promise.all([readMovie(id), readCache(id).catch(() => null)]);
                        if (!movie) return { items: [], missing: true };
                        if (previous?.version === stamp(movie) && previous.refreshAfter > now() && Array.isArray(previous.items)) return { items: previous.items };
                        const items = publicEpisodeMetadata(await readEpisodes(id));
                        // This is an application cache, not a paid Firestore TTL/backup feature.
                        if (new TextEncoder().encode(JSON.stringify(items)).length < 700000) {
                            try { await saveCache(id, { version: stamp(movie), items, refreshAfter: now() + 86400000 }); } catch { /* Memory/CDN cache still works if persistence is unavailable. */ }
                        }
                        return { items };
                    })().finally(() => pending.delete(id));
                    pending.set(id, loading);
                }
                const value = await loading;
                cached = { ...value, expiresAt: now() + 300000 }; memory.set(id, cached);
                if (memory.size > 200) memory.delete(memory.keys().next().value);
            }
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
            res.setHeader('X-Robots-Tag', 'noindex');
            return res.status(cached.missing ? 404 : 200).end(req.method === 'HEAD' ? '' : JSON.stringify({ items: cached.items }));
        } catch (error) {
            console.warn('Episode metadata unavailable:', error.code || error.message);
            const cached = memory.get(id);
            if (cached) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
                return res.status(200).end(JSON.stringify({ items: cached.items }));
            }
            res.setHeader('Cache-Control', 'no-store');
            return res.status(503).end('Episode list temporarily unavailable');
        }
    };
}
export default createEpisodeMetadataHandler();
