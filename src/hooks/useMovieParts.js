import { useEffect, useMemo, useState } from 'react';
import useMovieIndex from './useMovieIndex';
import { getDocumentById } from '../services/firebaseService';
import { movieParts, nextMoviePart, movieSeriesKey, mergePartDetails } from '../utils/movieParts';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const details = new Map();
function loadPart(id) {
    const saved = details.get(id);
    if (saved && saved.expiresAt > Date.now()) return saved.loading;
    const loading = getDocumentById('Movies', id).catch(() => { details.delete(id); return null; });
    details.set(id, { loading, expiresAt: Date.now() + 300000 });
    if (details.size > 100) details.delete(details.keys().next().value);
    return loading;
}

export default function useMovieParts(movie) {
    const index = useMovieIndex();
    const initial = useMemo(() => movieParts(movie, index), [movie, index]);
    const manualKey = movie?.seriesMode === 'manual' ? movieSeriesKey(movie.seriesTitle) : '';
    const key = initial.parts.filter(part => part.id !== movie?.id).map(part => part.id).sort().join('\n');
    const [state, setState] = useState({ key: '', movies: [] });
    const [manual, setManual] = useState({ key: '', movies: [] });
    useEffect(() => {
        if (!manualKey) return;
        return onSnapshot(query(collection(db, 'Movies'), where('seriesKey', '==', manualKey)), snapshot => {
            setManual({ key: manualKey, movies: snapshot.docs.map(document => ({ ...document.data(), id: document.id })) });
        }, error => console.warn('Series information unavailable:', error.code || error.message));
    }, [manualKey]);
    useEffect(() => {
        if (!key || manualKey) return;
        let active = true;
        Promise.all(key.split('\n').map(loadPart)).then(movies => {
            if (active) setState({ key, movies: movies.filter(Boolean) });
        });
        return () => { active = false; };
    }, [key, manualKey]);
    return useMemo(() => {
        if (manualKey) {
            const group = movieParts(movie, manual.key === manualKey ? manual.movies : []);
            const loading = manual.key !== manualKey;
            return { ...group, loading, nextPart: loading ? null : nextMoviePart(movie, group.parts) };
        }
        const loaded = state.key === key ? state.movies : [];
        const byID = new Map(loaded.map(part => [part.id, part]));
        const loading = !!key && state.key !== key;
        const candidates = initial.parts.filter(part => loading || part.id === movie?.id || byID.has(part.id));
        const group = movieParts(movie, candidates.map(part => mergePartDetails(part, byID.get(part.id) || {})));
        return { ...group, loading, nextPart: loading ? null : nextMoviePart(movie, group.parts) };
    }, [movie, initial, state, key, manual, manualKey]);
}
