import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocFromCache, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getCachedData, subscribeToCollection } from '../utils/appUtils';
import { reportCatalogStatus } from '../utils/catalogStatus';
import { createRankingMovieCache, rankedRentals } from '../utils/dashboardRankings';
import useCatalogStatus from './useCatalogStatus';

const TOP_FILMS_KEY = 'dashboard-top-films';
const movieCache = createRankingMovieCache(async id => {
    const reference = doc(db, 'Movies', id);
    const movie = await getDocFromCache(reference).catch(() => getDoc(reference));
    return movie.exists() ? { ...movie.data(), id: movie.id } : null;
});

function subscribeTopFilms(_name, callback) {
    reportCatalogStatus(TOP_FILMS_KEY, 'loading');
    return onSnapshot(query(collection(db, 'Movies'), orderBy('views', 'desc'), limit(5)), { includeMetadataChanges: true }, snapshot => {
        const films = snapshot.docs.map(movie => ({ ...movie.data(), id: movie.id }));
        movieCache.remember(films);
        callback(films);
        reportCatalogStatus(TOP_FILMS_KEY, films.length || !snapshot.metadata.fromCache ? 'ready' : 'loading');
    }, error => reportCatalogStatus(TOP_FILMS_KEY, 'error', error));
}

export default function useDashboardRankings(rentals) {
    const [topFilms, setTopFilms] = useState(() => getCachedData(TOP_FILMS_KEY) ?? []);
    const filmsStatus = useCatalogStatus(TOP_FILMS_KEY);
    const rentsStatus = useCatalogStatus('RentMovies');
    const ranking = useMemo(() => rankedRentals(rentals), [rentals]);
    const [details, setDetails] = useState({});
    const [failedRanking, setFailedRanking] = useState(null);
    const rankingKey = JSON.stringify(ranking);

    useEffect(() => subscribeToCollection(TOP_FILMS_KEY, 'Movies', setTopFilms, subscribeTopFilms), []);

    useEffect(() => {
        let active = true;
        Promise.all(ranking.map(async ([id]) => [id, await movieCache.load(id)]))
            .then(items => { if (active) { setDetails(Object.fromEntries(items)); setFailedRanking(null); } })
            .catch(() => { if (active) setFailedRanking(rankingKey); });
        return () => { active = false; };
    }, [ranking, rankingKey]);

    const getMovie = id => topFilms.find(movie => movie.id === id) ?? details[id] ?? movieCache.peek(id);
    const topRents = ranking.flatMap(([id, rentCount]) => {
        const movie = getMovie(id);
        return movie ? [{ ...movie, rentCount }] : [];
    });
    const rentsError = rentsStatus.status === 'error' || failedRanking === rankingKey;
    return {
        topFilms,
        topRents,
        filmsLoading: topFilms.length === 0 && !['ready', 'error'].includes(filmsStatus.status),
        filmsError: filmsStatus.status === 'error',
        rentsLoading: !rentsError && (!['ready', 'error'].includes(rentsStatus.status) || ranking.some(([id]) => getMovie(id) === undefined)),
        rentsError,
    };
}
