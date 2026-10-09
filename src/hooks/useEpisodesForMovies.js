import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export default function useEpisodesForMovies(movieIds, enabled = true) {
    const ids = [...new Set(movieIds)].filter(Boolean).sort();
    const key = ids.join('|');
    const [state, setState] = useState({ key: '', episodes: [], ready: false });
    useEffect(() => {
        if (!enabled || !key) return;
        const movieIds = key.split('|');
        const groups = [];
        for (let offset = 0; offset < movieIds.length; offset += 10) groups.push(movieIds.slice(offset, offset + 10));
        const results = new Map();
        const subscriptions = groups.map((group, index) => onSnapshot(query(collection(db, 'Episodes'), where('movieID', 'in', group)), snapshot => {
            results.set(index, snapshot.docs.map(value => ({ ...value.data(), id: value.id })));
            if (results.size === groups.length) setState({ key, episodes: [...results.values()].flat(), ready: true });
        }, error => console.warn('Import episode lookup unavailable:', error.code || error.message)));
        return () => subscriptions.forEach(unsubscribe => unsubscribe());
    }, [key, enabled]);
    if (!enabled || !key) return { episodes: [], ready: true };
    return state.key === key ? state : { episodes: [], ready: false };
}
