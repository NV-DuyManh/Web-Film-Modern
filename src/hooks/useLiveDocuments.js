import { useEffect, useState } from 'react';
import { collection, documentId, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Only the visible rows and their references subscribe to Firestore.
export default function useLiveDocuments(name, ids) {
    const key = [...new Set(ids.filter(Boolean))].sort().join('\n');
    const [state, setState] = useState({ key: '', items: [] });
    useEffect(() => {
        if (!key) return;
        const values = key.split('\n'), groups = [];
        for (let index = 0; index < values.length; index += 30) groups.push(values.slice(index, index + 30));
        const results = new Map();
        const unsubscribers = groups.map((group, index) => onSnapshot(query(collection(db, name), where(documentId(), 'in', group)), snapshot => {
            results.set(index, snapshot.docs.map(item => ({ ...item.data(), id: item.id })));
            setState({ key, items: [...results.values()].flat() });
        }, error => console.warn('Visible records unavailable:', name, error.code)));
        return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }, [name, key]);
    return state.key === key ? state.items : [];
}
