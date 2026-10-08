const STORAGE_KEY = 'mfilm_resume';
let syncTarget = null;

export function configureResumeSync(userId, publish) {
    const target = { userId, publish };
    syncTarget = target;
    return () => { if (syncTarget === target) syncTarget = null; };
}

export function getResumeStore(userId = null) {
    try { return JSON.parse(localStorage.getItem(userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY) || '{}'); }
    catch { return {}; }
}

function notifyResume(userId, movieId, entry, publish = true) {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('mfilm_resume_updated'));
    if (publish && userId && syncTarget?.userId === userId) syncTarget.publish(movieId, entry);
}

export function mergeResumeEntry(local, remote) {
    if (!local) return remote;
    if (!remote) return local;
    const latest = Number(remote.updatedAt) > Number(local.updatedAt) ? remote : local;
    const deletedAt = Math.max(Number(local.deletedAt) || 0, Number(remote.deletedAt) || 0);
    if (deletedAt >= Number(latest.updatedAt)) return { ...latest, deletedAt, episodes: {}, episodeUpdatedAt: {} };
    const episodes = {};
    const episodeUpdatedAt = {};
    for (const id of new Set([...Object.keys(local.episodes || {}), ...Object.keys(remote.episodes || {})])) {
        const lt = Object.hasOwn(local.episodes || {}, id) ? Number(local.episodeUpdatedAt?.[id] ?? local.updatedAt) || 0 : 0;
        const rt = Object.hasOwn(remote.episodes || {}, id) ? Number(remote.episodeUpdatedAt?.[id] ?? remote.updatedAt) || 0 : 0;
        const source = rt > lt ? remote : local;
        const timestamp = Math.max(lt, rt);
        if (timestamp <= deletedAt) continue;
        episodes[id] = source.episodes?.[id] ?? 0;
        episodeUpdatedAt[id] = timestamp;
    }
    return { ...latest, episodes, episodeUpdatedAt, deletedAt };
}

export function mergeRemoteResume(movieId, remote, userId) {
    const all = getResumeStore(userId);
    all[movieId] = mergeResumeEntry(all[movieId], remote);
    try {
        localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(all));
        notifyResume(userId, movieId, all[movieId], false);
    } catch { /* Storage may be full; playback still works. */ }
}

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
        // Consecutive saves in the same millisecond must still have a clear order.
        all[movieId].updatedAt = Math.max(Date.now(), (Number(all[movieId].updatedAt) || 0) + 1);
        
        // Đảm bảo có object episodes
        if (!all[movieId].episodes) all[movieId].episodes = {};
        all[movieId].episodes[episodeId] = seconds;
        all[movieId].episodeUpdatedAt = { ...all[movieId].episodeUpdatedAt, [episodeId]: all[movieId].updatedAt };

        localStorage.setItem(key, JSON.stringify(all));
        notifyResume(userId, movieId, all[movieId]);
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
            const updatedAt = Math.max(Date.now(), (Number(all[movieId].updatedAt) || 0) + 1);
            if (episodeId && all[movieId].episodes) {
                all[movieId].episodes[episodeId] = 0;
                all[movieId].episodeUpdatedAt = { ...all[movieId].episodeUpdatedAt, [episodeId]: updatedAt };
            } else {
                all[movieId] = { episodes: {}, episodeUpdatedAt: {}, deletedAt: updatedAt };
            }
            all[movieId].updatedAt = updatedAt;
            localStorage.setItem(key, JSON.stringify(all));
            notifyResume(userId, movieId, all[movieId]);
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
            return entry.episodes ? Object.values(entry.episodes).some(seconds => seconds > 0) : !entry.deletedAt;
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
