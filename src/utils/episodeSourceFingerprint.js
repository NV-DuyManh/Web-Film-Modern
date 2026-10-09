export async function episodeSourceFingerprint(movie, servers = []) {
    const episodes = (servers[0]?.server_data || []).map(episode => [episode.name || '', episode.link_embed || '', episode.link_m3u8 || '']);
    const bytes = new TextEncoder().encode(JSON.stringify([movie?.status || '', movie?.episode_total || '', movie?.lang || '', episodes]));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}
