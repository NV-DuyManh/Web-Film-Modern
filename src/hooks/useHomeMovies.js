import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { subscribePublicCatalog } from '../services/publicCatalogCache';
import { resolveMovieImages } from '../utils/movieImages';
import { reportCatalogStatus } from '../utils/catalogStatus';
import { SectionVisibilityContext } from '../contexts/SectionVisibilityContext';

export function useHomeCatalog(section, enabled = true) {
    const [home, setHome] = useState(null);
    const loaded = useRef(false);
    const nearby = useContext(SectionVisibilityContext);
    useEffect(() => {
        if (!nearby || !enabled) return;
        let active = true;
        const name = section === 'hot' ? 'Hot' : 'Home';
        const update = data => {
            if (active) { loaded.current = true; setHome(data); reportCatalogStatus('Movies', 'ready'); }
        };
        if (!loaded.current) reportCatalogStatus('Movies', 'loading');
        const unsubscribe = subscribePublicCatalog(name, update, error => { if (active) reportCatalogStatus('Movies', 'error', error); });
        return () => { active = false; unsubscribe(); };
    }, [section, nearby, enabled]);
    return home;
}

export default function useHomeMovies(section = 'new', enabled = true) {
    const home = useHomeCatalog(section === 'hot' ? 'hot' : undefined, enabled);
    return useMemo(() => {
        if (section === 'hot') return home === null ? null : home.map(movie => ({ ...movie, ...resolveMovieImages(movie) }));
        const byID = new Map((home?.movies || []).map(movie => [movie.id, movie]));
        return (home?.sections[section] || []).map(id => byID.get(id)).filter(Boolean).map(movie => ({ ...movie, ...resolveMovieImages(movie) }));
    }, [home, section]);
}
