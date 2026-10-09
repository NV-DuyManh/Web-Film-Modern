import { AuthContext } from '../contexts/AuthProvider';
import { subscribePublicCatalog } from '../services/publicCatalogCache';
import { newestMoviesFirst } from '../utils/movieRecency';
import { useState, useEffect, useContext } from 'react';
import { fetchDocumentsRealtime, fetchDataById } from '../services/firebaseService';
import { subscribeToCollection, getCachedData } from '../utils/appUtils';
import { withNameRoutes } from '../utils/nameRoutes';
import { reportCatalogStatus } from '../utils/catalogStatus';
import { resolveMovieImages } from '../utils/movieImages';
import Logo5 from '../assets/Logo5.png';
import Logo6 from '../assets/Logo6.png';

const POSTGRES_CATALOG_ENABLED = import.meta.env?.VITE_POSTGRES_CATALOG_ENABLED === 'true';
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

const CATALOG_ENDPOINT_MAP = {
    Movies: '/catalog/movies',
    Categories: '/catalog/categories',
    Topics: '/catalog/topics',
};

function createCollectionHook(cacheKey, collectionName, processData) {
    return function useCollection(enabled = true) {
        const { isLogin } = useContext(AuthContext) || {};
        const isAdmin = isLogin?.role === 'admin';
        const privateCollection = ['Subscriptions', 'RentMovies'].includes(collectionName);
        const key = privateCollection ? `${cacheKey}:${isAdmin ? 'admin' : isLogin?.id || 'guest'}` : `${cacheKey}:${isAdmin ? 'admin' : 'public'}`;
        const [state, setState] = useState(() => ({ key, data: getCachedData(key) ?? [] }));
        useEffect(() => {
            if (!enabled) return;
            let isMounted = true;
            let fallbackUnsubscribe;
            const setData = data => { if (isMounted) setState({ key, data }); };
            if (privateCollection && !isAdmin) {
                if (!isLogin?.id) return;
                const unsubscribe = subscribeToCollection(key, collectionName, setData, (name, callback) => fetchDataById(name, 'userID', isLogin.id, callback), processData);
                return () => { isMounted = false; unsubscribe(); };
            }
            if (!isAdmin && (!POSTGRES_CATALOG_ENABLED || !CATALOG_ENDPOINT_MAP[collectionName]) && ['Movies', 'Actors', 'Authors', 'Characters', 'Topics', 'Categories', 'CategoryTypes'].includes(collectionName)) {
                reportCatalogStatus(collectionName, 'loading');
                const unsubscribe = subscribeToCollection(key, collectionName, setData, (name, callback) => subscribePublicCatalog(name, items => {
                    callback(items);
                    reportCatalogStatus(collectionName, 'ready');
                }, error => reportCatalogStatus(collectionName, 'error', error)), processData);
                return () => { isMounted = false; unsubscribe(); };
            }

            if (POSTGRES_CATALOG_ENABLED && CATALOG_ENDPOINT_MAP[collectionName]) {
                reportCatalogStatus(collectionName, 'loading');
                const endpoint = `${API_BASE_URL.replace(/\/+$/, '')}${CATALOG_ENDPOINT_MAP[collectionName]}`;
                fetch(endpoint)
                    .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
                    .then(json => {
                        if (!isMounted) return;
                        const items = Array.isArray(json) ? json : (json.data || []);
                        const processed = processData ? processData(items) : items;
                        setData(processed);
                        reportCatalogStatus(collectionName, 'ready');
                    })
                    .catch(err => {
                        console.warn(`[Catalog Cutover] PostgreSQL read fallback for [${collectionName}]:`, err.message);
                        if (isMounted) fallbackUnsubscribe = subscribeToCollection(key, collectionName, setData,
                            isAdmin ? fetchDocumentsRealtime : (name, callback) => subscribePublicCatalog(name, callback, error => reportCatalogStatus(name, 'error', error)), processData);
                    });
                return () => { isMounted = false; fallbackUnsubscribe?.(); };
            }

            const unsubscribe = subscribeToCollection(key, collectionName, setData, fetchDocumentsRealtime, processData);
            return () => { isMounted = false; unsubscribe(); };
        }, [enabled, isAdmin, isLogin?.id, key, privateCollection]);
        return state.key === key ? state.data : [];
    };
}


function processMovies(movieList) {
    return withNameRoutes([...movieList].sort(newestMoviesFirst), { preferSlug: true }).map(movie => {
        const images = resolveMovieImages(movie);
        return { ...movie, _artworkSource: { imgUrl: movie.imgUrl || '', bannerUrl: movie.bannerUrl || '' }, imgUrl: images.imgUrl || Logo6, bannerUrl: images.bannerUrl || Logo5 };
    });
}

export const useMovies        = createCollectionHook('movies',        'Movies',        processMovies);
export const useAuthors       = createCollectionHook('authors',       'Authors', withNameRoutes);
export const useActors        = createCollectionHook('actors',        'Actors', items => withNameRoutes(items, { fallback: 'dien-vien' }));
export const useCharacters    = createCollectionHook('characters',    'Characters', withNameRoutes);
export const useCategoryTypes = createCollectionHook('categoryTypes', 'CategoryTypes');
export const useCategories    = createCollectionHook('categories',    'Categories');
export const useShowTimes     = createCollectionHook('showTimes',     'ShowTimes');
export const useTopics        = createCollectionHook('topics',        'Topics', withNameRoutes);
export const useSubscriptions = createCollectionHook('subscriptions', 'Subscriptions');
export const useRentMovies    = createCollectionHook('rentMovies',    'RentMovies');
export const useEpisodes      = createCollectionHook('episodes',      'Episodes');
export const useReviews       = createCollectionHook('reviews',       'Reviews');
export const useComments      = createCollectionHook('comments',      'Comments');
export const usePackages      = createCollectionHook('packages',      'Packages');
export const useFeatures      = createCollectionHook('features',      'Features');
