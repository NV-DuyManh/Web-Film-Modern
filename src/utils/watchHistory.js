const STORAGE_KEY = 'mfilm_resume';

export function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = n => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/**
 * Cấu trúc mới:
 * {
 *   [movieId]: {
 *     latestEpisodeId: "ep1",
 *     latestEpisodeNumber: 1,
 *     updatedAt: 123456,
 *     episodes: {
 *       "ep1": 180,  // số giây
 *       "ep2": 50
 *     }
 *   }
 * }
 */

export function saveResume(movieId, { episodeId, episodeNumber, seconds }) {
    if (!movieId || !episodeId || seconds <= 0) return;
    try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (!all[movieId]) {
            all[movieId] = { episodes: {} };
        }
        all[movieId].latestEpisodeId = episodeId;
        all[movieId].latestEpisodeNumber = episodeNumber;
        all[movieId].updatedAt = Date.now();
        
        // Đảm bảo có object episodes
        if (!all[movieId].episodes) all[movieId].episodes = {};
        all[movieId].episodes[episodeId] = seconds;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch { /* ignore */ }
}

export function getResume(movieId) {
    if (!movieId) return null;
    try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return all[movieId] || null;
    } catch { return null; }
}

export function clearResume(movieId, episodeId = null) {
    if (!movieId) return;
    try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (all[movieId]) {
            if (episodeId && all[movieId].episodes) {
                // Chỉ xoá thời gian của tập này
                delete all[movieId].episodes[episodeId];
            } else {
                // Xoá cả bộ phim
                delete all[movieId];
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        }
    } catch { /* ignore */ }
}

export function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}
