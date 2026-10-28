import { useContext, useEffect, useState } from 'react';
import { startVisiblePolling } from '../utils/visiblePolling';
import { secondsUntilVietnamMidnight, vietnamDay } from '../utils/dailyMovieRanking';
import { resolveMovieImages } from '../utils/movieImages';
import { SectionVisibilityContext } from '../contexts/SectionVisibilityContext';
import { publicRequestCache } from '../services/publicRequestCache';

export default function useDailyMovieRanking() {
    const [state, setState] = useState({ status: 'loading', items: [], date: vietnamDay() });
    const nearby = useContext(SectionVisibilityContext);
    useEffect(() => {
        if (!nearby) return;
        let active = true;
        const update = async () => {
            try {
                const data = await publicRequestCache.read('/api/daily-ranking', {
                    maxAgeMs: 60000, accept: value => Array.isArray(value?.items) && value.date === vietnamDay(),
                });
                if (active) setState({ status: 'ready', date: data.date, items: data.items.map(movie => ({ ...movie, ...resolveMovieImages(movie) })) });
            } catch {
                if (active) setState(previous => ({ ...previous, status: 'error', ...(previous.date !== vietnamDay() ? { date: vietnamDay(), items: [] } : {}) }));
            }
        };
        let midnightTimer;
        const midnight = () => {
            midnightTimer = setTimeout(() => {
                if (!active) return;
                setState({ status: 'loading', items: [], date: vietnamDay() });
                void update();
                midnight();
            }, secondsUntilVietnamMidnight() * 1000 + 50);
        };
        midnight();
        const stop = startVisiblePolling(update);
        return () => { active = false; stop(); clearTimeout(midnightTimer); };
    }, [nearby]);
    return state.date === vietnamDay() ? state : { status: 'loading', items: [], date: vietnamDay() };
}
