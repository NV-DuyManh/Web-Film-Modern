import { parseEpisode, highestEpisode } from './episodes.js';

function stream(url) {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        return parsed.searchParams.has('url') ? stream(parsed.searchParams.get('url')) : parsed.href;
    } catch { return String(url); }
}
function links(ep, source = false) {
    return (source ? [ep.link_embed, ep.link_m3u8] : [ep.url, ep.urlM3u8, ep.url2]).map(stream).filter(Boolean);
}

// A source name alone is insufficient: verify the existing video URL too before changing data.
export function episodeRepairPlan(movies, episodes, sources) {
    const patches = [];
    const unresolved = [];
    for (const movie of movies) {
        const source = sources[movie.slug];
        if (!source) continue;
        const rows = episodes.filter(ep => ep.movieID === movie.id);
        const sourceRows = (source.episodes || []).flatMap(server => server.server_data || [])
            .map(ep => ({ ...ep, info: parseEpisode(ep.name) })).filter(ep => ep.info);
        const byUrl = new Map();
        for (const ep of sourceRows) for (const url of links(ep, true)) {
            if (!byUrl.has(url)) byUrl.set(url, []);
            byUrl.get(url).push(ep);
        }
        const corrected = [];
        const badNumbers = new Set();
        for (const episode of rows) {
            const matching = links(episode).flatMap(url => byUrl.get(url) || []);
            const keys = new Set(matching.map(ep => ep.info.key));
            const named = parseEpisode(episode.nameEpisode);
            const candidate = matching.find(ep => ep.name === episode.nameEpisode) || (keys.size === 1 ? matching[0] : null);
            if (!candidate) {
                if (named && named.number !== Number(episode.numberEpisode)) unresolved.push({ id: episode.id, movie: movie.slug, name: episode.nameEpisode });
                corrected.push(episode);
                continue;
            }
            const info = candidate.info;
            // Add missing meaningful labels, without rewriting every ordinary imported episode.
            const meaningful = info.variant || info.end !== info.number || !Number.isInteger(info.number);
            if (Number(episode.numberEpisode) !== info.number || (!named && meaningful)) {
                const after = { numberEpisode: info.number, nameEpisode: candidate.name };
                if (Number(episode.numberEpisode) !== info.number) after.legacyEpisodeNumber = episode.legacyEpisodeNumber ?? episode.numberEpisode;
                patches.push({ collection: 'Episodes', id: episode.id, movie: movie.slug,
                    before: { numberEpisode: episode.numberEpisode, nameEpisode: episode.nameEpisode ?? null,
                        movieID: episode.movieID, url: episode.url ?? null, urlM3u8: episode.urlM3u8 ?? null, url2: episode.url2 ?? null }, after });
                if (Number(episode.numberEpisode) !== info.number) badNumbers.add(Number(episode.numberEpisode));
                corrected.push({ ...episode, ...after });
            } else corrected.push(episode);
        }
        const highest = highestEpisode(corrected);
        if (badNumbers.has(Number(movie.endEpisode)) && highest < Number(movie.endEpisode)) {
            patches.push({ collection: 'Movies', id: movie.id, movie: movie.slug,
                before: { endEpisode: movie.endEpisode }, after: { endEpisode: highest } });
        }
    }
    return { patches, unresolved };
}
