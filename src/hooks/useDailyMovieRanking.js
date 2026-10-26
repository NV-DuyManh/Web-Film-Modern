import { useEffect, useState } from 'react';
import { startVisiblePolling } from '../utils/visiblePolling';
import { secondsUntilVietnamMidnight, vietnamDay } from '../utils/dailyMovieRanking';
import { resolveMovieImages } from '../utils/movieImages';

export default function useDailyMovieRanking() {
    const [state, setState] = useState({ status: 'loading', items: [], date: vietnamDay() });
    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        const update = async () => {
            try {
                const response = await fetch('/api/daily-ranking', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(7000)]) });
                if (!response.ok) throw new Error('Ranking unavailable');
                const data = await response.json();
                if (!Array.isArray(data.items) || data.date !== vietnamDay()) throw new Error('Ranking date mismatch');
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
        return () => { active = false; stop(); clearTimeout(midnightTimer); controller.abort(); };
    }, []);
    return state.date === vietnamDay() ? state : { status: 'loading', items: [], date: vietnamDay() };
}
