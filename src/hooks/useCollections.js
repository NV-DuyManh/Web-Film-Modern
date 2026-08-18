import { useState, useEffect } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';
import { subscribeToCollection, getCachedData } from '../utils/appUtils';
import Logo5 from '../assets/Logo5.png';
import Logo6 from '../assets/Logo6.png';

function createCollectionHook(cacheKey, collectionName, processData) {
    return function useCollection() {
        const [data, setData] = useState(() => getCachedData(cacheKey) ?? []);
        useEffect(() => {
            return subscribeToCollection(cacheKey, collectionName, setData, fetchDocumentsRealtime, processData);
        }, []);
        return data;
    };
}

function processMovies(movieList) {
    return movieList.map(movie => {
        let finalImg = movie.imgUrl;
        let finalBanner = movie.bannerUrl;
        if (!finalImg || finalImg.includes('src/assets') || finalImg.includes('Logo5')) finalImg = Logo6;
        if (!finalBanner || finalBanner.includes('src/assets') || finalBanner.includes('Logo')) finalBanner = Logo5;
        return { ...movie, imgUrl: finalImg, bannerUrl: finalBanner };
    });
}

export const useMovies        = createCollectionHook('movies',        'Movies',        processMovies);
export const useAuthors       = createCollectionHook('authors',       'Authors');
export const useActors        = createCollectionHook('actors',        'Actors');
export const useCharacters    = createCollectionHook('characters',    'Characters');
export const useCategories    = createCollectionHook('categories',    'Categories');
export const useShowTimes     = createCollectionHook('showTimes',     'ShowTimes');
export const useTopics        = createCollectionHook('topics',        'Topics');
export const useSubscriptions = createCollectionHook('subscriptions', 'Subscriptions');
export const useRentMovies    = createCollectionHook('rentMovies',    'RentMovies');
export const useReviews       = createCollectionHook('reviews',       'Reviews');
export const useComments      = createCollectionHook('comments',      'Comments');
export const usePackages      = createCollectionHook('packages',      'Packages');
export const useFeatures      = createCollectionHook('features',      'Features');
