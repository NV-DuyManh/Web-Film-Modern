import { useMemo, useSyncExternalStore } from 'react';
import { movieResume } from '../utils/watchHistory';

function subscribe(callback) {
    window.addEventListener('mfilm_resume_updated', callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener('mfilm_resume_updated', callback);
        window.removeEventListener('storage', callback);
    };
}

export default function useResumeEntry(movieId, userId, movie) {
    const raw = useSyncExternalStore(subscribe, () => {
        try { return localStorage.getItem(userId ? `mfilm_resume_${userId}` : 'mfilm_resume') || '{}'; }
        catch { return '{}'; }
    });
    return useMemo(() => {
        try { return movieResume(JSON.parse(raw), movieId, movie); } catch { return null; }
    }, [raw, movieId, movie]);
}
