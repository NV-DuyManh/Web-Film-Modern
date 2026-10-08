export function episodeNumber(name) {
    const number = Number.parseInt(String(name || '').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(number) && number > 0 ? number : 1;
}

export function episodeSyncChanges(movie, source, existing = []) {
    const current = new Map(existing.map(ep => [Number(ep.numberEpisode), ep]));
    const creates = [];
    const updates = [];
    let highest = Number(movie.endEpisode) || 1;
    for (const ep of source) {
        if (!ep.link_embed && !ep.link_m3u8) continue;
        const number = episodeNumber(ep.name);
        highest = Math.max(highest, number);
        const old = current.get(number);
        const values = { movieID: movie.id, title: movie.name || movie.otherName || '', numberEpisode: number,
            nameEpisode: ep.name || `Tập ${number}`, url: ep.link_embed || old?.url || '', urlM3u8: ep.link_m3u8 || old?.urlM3u8 || '' };
        if (!old) {
            const created = { ...values, id: `${movie.id}_${number}`, description: 'Đang cập nhật...' };
            creates.push(created);
            current.set(number, created);
        } else if (old.url !== values.url || old.urlM3u8 !== values.urlM3u8 || old.nameEpisode !== values.nameEpisode) {
            updates.push({ ...values, id: old.id });
            current.set(number, { ...old, ...values });
        }
    }
    return { creates, updates, highest };
}
