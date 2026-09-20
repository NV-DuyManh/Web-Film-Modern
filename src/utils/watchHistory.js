const STORAGE_KEY = 'mfilm_resume';

export function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = n => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function saveResume(movieId, { episodeId, episodeNumber, seconds }, userId = null) {
    if (!movieId || !episodeId || seconds <= 0) return;
    try {
        const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
        const all = JSON.parse(localStorage.getItem(key) || '{}');
        if (!all[movieId]) {
            all[movieId] = { episodes: {} };
        }
        all[movieId].latestEpisodeId = episodeId;
        all[movieId].latestEpisodeNumber = episodeNumber;
        all[movieId].updatedAt = Date.now();
        
        // Đảm bảo có object episodes
        if (!all[movieId].episodes) all[movieId].episodes = {};
        all[movieId].episodes[episodeId] = seconds;

        localStorage.setItem(key, JSON.stringify(all));
    } catch { /* ignore */ }
}

export function getResume(movieId, userId = null) {
    if (!movieId) return null;
    try {
        if (userId) {
            const userStore = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${userId}`) || 'null');
            return userStore?.[movieId] || null;
        }
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return all[movieId] || null;
    } catch { return null; }
}

export function clearResume(movieId, episodeId = null, userId = null) {
    if (!movieId) return;
    try {
        const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
        const all = JSON.parse(localStorage.getItem(key) || '{}');
        if (all[movieId]) {
            if (episodeId && all[movieId].episodes) {
                delete all[movieId].episodes[episodeId];
            } else {
                delete all[movieId];
            }
            localStorage.setItem(key, JSON.stringify(all));
        }
    } catch { /* ignore */ }
}

export function getWatchedMoviesCount(userId = null, resumeDataOverride = null) {
    try {
        let resumeData = resumeDataOverride;
        if (!resumeData) {
            if (userId) {
                const userStore = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${userId}`) || 'null');
                // Authenticated users strictly use user-scoped store; no fallback to generic key
                resumeData = userStore || {};
            } else {
                // Generic key is only used for legacy/anonymous guest sessions
                resumeData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            }
        }
        if (!resumeData || typeof resumeData !== 'object') return 0;
        const movieIds = Object.keys(resumeData).filter(mId => {
            const entry = resumeData[mId];
            if (!entry) return false;
            return entry.episodes ? Object.keys(entry.episodes).length > 0 : true;
        });
        return new Set(movieIds).size;
    } catch {
        return 0;
    }
}

export function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}
