import { useEffect, useMemo, useState } from 'react';
import { publicCatalogCache } from '../services/publicCatalogCache';
import { resolveMovieImages } from '../utils/movieImages';
import { reportCatalogStatus } from '../utils/catalogStatus';

export function useHomeCatalog(section) {
    const [home, setHome] = useState(null);
    useEffect(() => {
        let active = true;
        const name = section === 'hot' ? 'Hot' : 'Home';
        const update = () => publicCatalogCache.load(name).then(data => {
            if (active) { setHome(data); reportCatalogStatus('Movies', 'ready'); }
        }).catch(error => { if (active) reportCatalogStatus('Movies', 'error', error); });
        reportCatalogStatus('Movies', 'loading'); update();
        const unsubscribe = publicCatalogCache.subscribe(name, data => { if (active) setHome(data); });
        const timer = setInterval(update, section === 'hot' ? 60000 : 300000);
        const onVisible = () => { if (document.visibilityState === 'visible') update(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => { active = false; clearInterval(timer); unsubscribe(); document.removeEventListener('visibilitychange', onVisible); };
    }, [section]);
    return home;
}

export default function useHomeMovies(section = 'new') {
    const home = useHomeCatalog(section === 'hot' ? 'hot' : undefined);
    return useMemo(() => {
        if (section === 'hot') return (home || []).map(movie => ({ ...movie, ...resolveMovieImages(movie) }));
        const byID = new Map((home?.movies || []).map(movie => [movie.id, movie]));
        return (home?.sections[section] || []).map(id => byID.get(id)).filter(Boolean).map(movie => ({ ...movie, ...resolveMovieImages(movie) }));
    }, [home, section]);
}
