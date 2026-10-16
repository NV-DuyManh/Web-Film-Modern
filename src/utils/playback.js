import { normalizeEpisodes, episodeKey, episodeInfo } from './episodes.js';

const hasFirstSource = episode => episode?.hasFirstServer === true || Boolean(episode?.url || episode?.urlM3u8);
const hasSecondSource = episode => episode?.hasSecondServer === true || Boolean(episode?.url2);

// Public metadata advertises available servers; stream URLs are loaded only
// for the selected episode after the existing access check.
export function playableEpisodeServer(episode, preferred = 1) {
    return hasSecondSource(episode) && (preferred === 2 || !hasFirstSource(episode)) ? 2 : 1;
}

export function nextPlayableEpisode(episodes, current) {
    if (!current?.id) return null;
    const ordered = normalizeEpisodes(episodes);
    const index = ordered.findIndex(ep => episodeKey(ep) === episodeKey(current));
    const info = episodeInfo(current);
    return index < 0 ? null : ordered.slice(index + 1).find(ep =>
        (info.end === info.number || episodeInfo(ep).number > info.end) && (hasFirstSource(ep) || hasSecondSource(ep))) || null;
}

export function episodeSource(episode, server = 1) {
    return server === 2 && episode?.url2 ? episode.url2 : episode?.urlM3u8 || episode?.url || '';
}
