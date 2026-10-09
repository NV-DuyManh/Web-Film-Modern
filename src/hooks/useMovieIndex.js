import { useEffect, useState } from 'react';
import { subscribePublicCatalog } from '../services/publicCatalogCache';
import { reportCatalogStatus } from '../utils/catalogStatus';

export default function useMovieIndex() {
    const [movies, setMovies] = useState([]);
    useEffect(() => {
        reportCatalogStatus('MovieIndex', 'loading');
        return subscribePublicCatalog('MovieIndex', items => { setMovies(items); reportCatalogStatus('MovieIndex', 'ready'); }, error => reportCatalogStatus('MovieIndex', 'error', error));
    }, []);
    return movies;
}
