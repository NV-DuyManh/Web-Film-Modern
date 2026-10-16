import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { normalizeEpisodes } from '../utils/episodes';
import { startVisiblePolling } from '../utils/visiblePolling';

const cache = new Map();
export function useMovieEpisodes(movieId) {
    const [state, setState] = useState({ id: '', items: [] });
    useEffect(() => {
        if (!movieId) return;
        let active = true;
        const update = () => {
            let request = cache.get(movieId);
            if (!request || request.expiresAt <= Date.now()) {
                const loading = fetch(`/api/episode-metadata?movieId=${encodeURIComponent(movieId)}`, { signal: AbortSignal.timeout(15000) }).then(response => {
                    if (!response.ok) throw new Error('Episode metadata unavailable');
                    return response.json();
                }).then(value => {
                    if (!Array.isArray(value.items)) throw new Error('Invalid episode metadata');
                    return value.items;
                }).catch(error => { cache.delete(movieId); throw error; });
                request = { loading, expiresAt: Date.now() + 300000 }; cache.set(movieId, request);
                if (cache.size > 50) cache.delete(cache.keys().next().value);
            }
            return request.loading.then(items => { if (active) setState({ id: movieId, items }); }).catch(error => console.warn(error.message));
        };
        const stop = startVisiblePolling(update, { intervalMs: 300000 });
        return () => { active = false; stop(); };
    }, [movieId]);
    return state.id === movieId ? state.items : [];
}

export function useEpisodeStream(episodeId, allowed) {
    const [state, setState] = useState({ id: '', episode: null });
    useEffect(() => {
        if (!episodeId || !allowed) return;
        return onSnapshot(doc(db, 'Episodes', episodeId), snapshot => {
            const episode = snapshot.exists() ? normalizeEpisodes([{ ...snapshot.data(), id: snapshot.id }])[0] || null : null;
            setState({ id: episodeId, episode });
        }, error => console.warn('Selected stream unavailable:', error.code || error.message));
    }, [episodeId, allowed]);
    return allowed && state.id === episodeId ? state.episode : null;
}
