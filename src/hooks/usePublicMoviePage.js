import { catalogPage } from '../utils/publicCatalogPage';
import { useEffect, useState } from 'react';
import { resolveMovieImages } from '../utils/movieImages';
import { publicCatalogCache } from '../services/publicCatalogCache';

const cache = new Map();
export default function usePublicMoviePage({ kind, page = 1, limit = 28, q = '', name = '', enabled = true }) {
    const [settledQuery, setSettledQuery] = useState(q);
    useEffect(() => { const timer = setTimeout(() => setSettledQuery(q), 250); return () => clearTimeout(timer); }, [q]);
    const key = new URLSearchParams({ kind, page: String(page), limit: String(limit), q: settledQuery, name }).toString();
    const [state, setState] = useState({ key: '', items: [], total: 0, totalPages: 1, page: 1 });
    useEffect(() => {
        if (!enabled) return;
        let active = true;
        let promise = cache.get(key);
        if (!promise || promise.expiresAt <= Date.now()) {
            const loading = fetch(`/api/catalog-page?${key}`, { signal: AbortSignal.timeout(15000) })
                .then(response => response.ok ? response.json() : Promise.reject(new Error('Catalog page unavailable')))
                .then(result => {
                    if (!Array.isArray(result.items) || !Number.isInteger(result.total)) throw new Error('Invalid public page');
                    return result;
                }).catch(async error => {
                    cache.delete(key);
                    // Static CDN fallback is free of database reads, including when serverless is unavailable.
                    console.warn('Using static public catalog:', error.message);
                    const [Movies, Categories, CategoryTypes] = await Promise.all(['Movies', 'Categories', 'CategoryTypes'].map(value => publicCatalogCache.load(value)));
                    return catalogPage({ catalog: { Movies, Categories, CategoryTypes } }, new URLSearchParams(key));
                });
            promise = { loading, expiresAt: Date.now() + 300000 }; cache.set(key, promise);
            if (cache.size > 100) cache.delete(cache.keys().next().value);
        }
        promise.loading.then(result => { if (active) setState({ ...result, key, items: result.items.map(movie => ({ ...movie, ...resolveMovieImages(movie) })) }); }).catch(() => {
            if (active) setState(previous => ({ ...previous, key }));
        });
        return () => { active = false; };
    }, [key, enabled]);
    if (!enabled) return { items: [], total: 0, page: 1, totalPages: 1, loading: false };
    return state.key === key && settledQuery === q ? { ...state, loading: false } : { ...state, items: [], total: 0, page: 1, totalPages: 1, loading: true };
}
