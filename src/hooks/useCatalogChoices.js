import { useEffect, useMemo, useState } from 'react';
import { subscribePublicCatalog } from '../services/publicCatalogCache';
import useLiveDocuments from './useLiveDocuments';

// Selection lists use the published public catalog. Only the entities already
// selected on the current film need fresh Firestore subscriptions.
export default function useCatalogChoices(name, ids, enabled) {
    const [cached, setCached] = useState([]);
    const live = useLiveDocuments(name, enabled ? ids : []);
    useEffect(() => {
        if (!enabled) return;
        return subscribePublicCatalog(name, setCached, error => console.warn('Catalog choices unavailable:', name, error.code || 'catalog-error'));
    }, [name, enabled]);
    return useMemo(() => {
        const entries = new Map(cached.map(item => [item.id, item]));
        for (const item of live) entries.set(item.id, item);
        return [...entries.values()];
    }, [cached, live]);
}
