import { useState, useEffect } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';
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
        const [data, setData] = useState(() => getCachedData(cacheKey) ?? []);
        useEffect(() => {
            if (!enabled) return;
            let isMounted = true;
            let fallbackUnsubscribe;

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
                        console.warn(`[Catalog Cutover] PostgreSQL read fallback to Firestore for [${collectionName}]:`, err.message);
                        if (isMounted) fallbackUnsubscribe = subscribeToCollection(cacheKey, collectionName, setData, fetchDocumentsRealtime, processData);
                    });
                return () => { isMounted = false; fallbackUnsubscribe?.(); };
            }

            return subscribeToCollection(cacheKey, collectionName, setData, fetchDocumentsRealtime, processData);
        }, [enabled]);
        return data;
    };
}


function processMovies(movieList) {
    return withNameRoutes(movieList, { preferSlug: true }).map(movie => {
        const images = resolveMovieImages(movie);
        return { ...movie, _artworkSource: { imgUrl: movie.imgUrl || '', bannerUrl: movie.bannerUrl || '' }, imgUrl: images.imgUrl || Logo6, bannerUrl: images.bannerUrl || Logo5 };
    });
}

export const useMovies        = createCollectionHook('movies',        'Movies',        processMovies);
export const useAuthors       = createCollectionHook('authors',       'Authors', withNameRoutes);
export const useActors        = createCollectionHook('actors',        'Actors', items => withNameRoutes(items, { fallback: 'dien-vien' }));
export const useCharacters    = createCollectionHook('characters',    'Characters', withNameRoutes);
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
