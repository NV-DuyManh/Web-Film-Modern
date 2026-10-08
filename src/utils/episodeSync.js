import { parseEpisode, episodeKey, highestEpisode, normalizeEpisodes } from './episodes.js';

export function episodeNumber(name) { return parseEpisode(name)?.number ?? null; }

export function episodeSyncChanges(movie, source, existing = []) {
    const rawById = new Map(existing.map(ep => [ep.id, ep]));
    const current = new Map(normalizeEpisodes(existing).map(ep => [episodeKey(ep), rawById.get(ep.id)]));
    const creates = [];
    const updates = [];
    let highest = highestEpisode(existing);
    for (const ep of source) {
        if (!ep.link_embed && !ep.link_m3u8) continue;
        const info = parseEpisode(ep.name);
        if (!info) continue;
        const number = info.number;
        highest = Math.max(highest, info.end);
        const old = current.get(info.key);
        const values = { movieID: movie.id, title: movie.name || movie.otherName || '', numberEpisode: number,
            nameEpisode: ep.name || `Tập ${number}`, url: ep.link_embed || old?.url || '', urlM3u8: ep.link_m3u8 || old?.urlM3u8 || '' };
        if (!old) {
            const created = { ...values, id: `${movie.id}_${info.key}`, description: 'Đang cập nhật...' };
            creates.push(created);
            current.set(info.key, created);
        } else if (Number(old.numberEpisode) !== number || old.url !== values.url || old.urlM3u8 !== values.urlM3u8 || old.nameEpisode !== values.nameEpisode) {
            updates.push({ ...values, id: old.id });
            current.set(info.key, { ...old, ...values });
        }
    }
    return { creates, updates, highest };
}
