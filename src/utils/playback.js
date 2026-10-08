import { normalizeEpisodes, episodeKey, episodeInfo } from './episodes.js';

export function nextPlayableEpisode(episodes, current) {
    if (!current?.id) return null;
    const ordered = normalizeEpisodes(episodes);
    const index = ordered.findIndex(ep => episodeKey(ep) === episodeKey(current));
    const info = episodeInfo(current);
    return index < 0 ? null : ordered.slice(index + 1).find(ep =>
        (info.end === info.number || episodeInfo(ep).number > info.end) && (ep.url || ep.urlM3u8 || ep.url2)) || null;
}

export function episodeSource(episode, server = 1) {
    return server === 2 && episode?.url2 ? episode.url2 : episode?.urlM3u8 || episode?.url || '';
}
