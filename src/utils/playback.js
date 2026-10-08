export function nextPlayableEpisode(episodes, current) {
    if (!current?.id) return null;
    return [...episodes].sort((a, b) => Number(a.numberEpisode) - Number(b.numberEpisode))
        .find(ep => Number(ep.numberEpisode) > Number(current.numberEpisode) && (ep.url || ep.urlM3u8 || ep.url2)) || null;
}

export function episodeSource(episode, server = 1) {
    return server === 2 && episode?.url2 ? episode.url2 : episode?.urlM3u8 || episode?.url || '';
}
