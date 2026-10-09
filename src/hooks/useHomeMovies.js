import { useEffect, useMemo, useState } from 'react';
import { publicCatalogCache } from '../services/publicCatalogCache';
import { resolveMovieImages } from '../utils/movieImages';
import { reportCatalogStatus } from '../utils/catalogStatus';

export function useHomeCatalog() {
    const [home, setHome] = useState(null);
    useEffect(() => {
        let active = true;
        const update = () => publicCatalogCache.load('Home').then(data => {
            if (active) { setHome(data); reportCatalogStatus('Movies', 'ready'); }
        }).catch(error => { if (active) reportCatalogStatus('Movies', 'error', error); });
        reportCatalogStatus('Movies', 'loading'); update();
        const timer = setInterval(update, 300000);
        return () => { active = false; clearInterval(timer); };
    }, []);
    return home;
}

export default function useHomeMovies(section = 'new') {
    const home = useHomeCatalog();
    return useMemo(() => {
        const byID = new Map((home?.movies || []).map(movie => [movie.id, movie]));
        return (home?.sections[section] || []).map(id => byID.get(id)).filter(Boolean).map(movie => ({ ...movie, ...resolveMovieImages(movie) }));
    }, [home, section]);
}
