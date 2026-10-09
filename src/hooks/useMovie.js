import { useEffect, useMemo, useState } from 'react';
import { doc, collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useMovies } from './useCollections';
import { findRouteEntity } from '../utils/nameRoutes';
import { resolveMovieImages } from '../utils/movieImages';

// Cached lists are for discovery. Price, plan and current film details still come
// from one live document so caching never changes purchase/access decisions.
export default function useMovie(slug) {
    const movies = useMovies();
    const cached = useMemo(() => findRouteEntity(movies, slug), [movies, slug]);
    const key = cached?.id || slug || '';
    const [state, setState] = useState({ key: '', movie: null });
    useEffect(() => {
        if (!key) return;
        const reference = cached?.id ? doc(db, 'Movies', cached.id) : query(collection(db, 'Movies'), where('slug', '==', slug), limit(1));
        return onSnapshot(reference, snapshot => {
            const record = 'docs' in snapshot ? snapshot.docs[0] : snapshot.exists() ? snapshot : null;
            if (!record) { setState({ key, movie: null }); return; }
            const values = record.data();
            setState({ key, movie: { ...values, id: record.id, ...resolveMovieImages(values) } });
        }, error => console.warn('Current movie unavailable:', error.code || error.message));
    }, [key, cached?.id, slug]);
    return useMemo(() => {
        const live = state.key === key ? state.movie : null;
        if (!live) return null;
        return { ...cached, ...live, routeSlug: live.slug && live.slug !== cached?.slug ? live.slug : cached?.routeSlug };
    }, [state, key, cached]);
}
