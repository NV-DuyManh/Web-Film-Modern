import { useMemo, useSyncExternalStore } from 'react';

function subscribe(callback) {
    window.addEventListener('mfilm_resume_updated', callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener('mfilm_resume_updated', callback);
        window.removeEventListener('storage', callback);
    };
}

export default function useResumeEntry(movieId, userId) {
    const raw = useSyncExternalStore(subscribe, () => {
        try { return localStorage.getItem(userId ? `mfilm_resume_${userId}` : 'mfilm_resume') || '{}'; }
        catch { return '{}'; }
    });
    return useMemo(() => {
        try { return JSON.parse(raw)[movieId] || null; } catch { return null; }
    }, [raw, movieId]);
}
