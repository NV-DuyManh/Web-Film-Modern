// Keep the meaning of the source label: ranges, decimals and OVA variants are not integers to concatenate.
export function parseEpisode(value) {
    const text = String(value ?? '').normalize('NFKC').trim();
    if (/^(?:full|hoàn tất|hoan tat)$/i.test(text)) return { number: 1, end: 1, key: '1', label: '1', variant: '' };
    const stripped = text.replace(/^(?:tập|tap|episode|ep)[\s.:_]*/i, '').trim();
    const standalone = stripped.match(/^(OVA|OAD|SP|special|đặc biệt|dac biet)\s*(\d+)?$/i);
    if (standalone) {
        const kind = /^(đặc biệt|dac biet)$/i.test(standalone[1]) ? 'SP' : standalone[1].toUpperCase();
        const number = Number(standalone[2] || 1);
        const variant = `${kind.toLowerCase()}-${number}`;
        return { number, end: 0, key: variant, label: `${kind} ${number}`, variant };
    }
    const match = stripped.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
    if (!match) return null;
    const number = Number(match[1].replace(',', '.'));
    if (!Number.isFinite(number) || number < 0) return null;
    const rest = match[2].trim();
    if (!rest) return { number, end: number, key: String(number), label: String(number), variant: '' };
    if (/^(?:[-–—+&/]\s*\d+(?:[.,]\d+)?\s*)+$/.test(rest)) {
        const numbers = [number, ...[...rest.matchAll(/\d+(?:[.,]\d+)?/g)].map(item => Number(item[0].replace(',', '.')))];
        if (numbers.some((item, index) => index > 0 && item <= numbers[index - 1])) return null;
        const end = numbers.at(-1);
        return { number, end, key: `${number}-${end}`, label: `${number}–${end}`, variant: '' };
    }
    const special = rest.match(/^(OVA|OAD|SP|special)\s*(\d+)?$/i);
    if (special) {
        const kind = special[1].toUpperCase();
        const index = special[2] ? Number(special[2]) : '';
        const variant = `${kind.toLowerCase()}${index === '' ? '' : `-${index}`}`;
        return { number, end: number, key: `${number}-${variant}`, label: `${number} ${kind}${index}`, variant };
    }
    const part = rest.match(/^([a-z]|P\s*\d+)$/i);
    if (part) {
        const suffix = part[1].replace(/\s/g, '').toUpperCase();
        return { number, end: number, key: `${number}-${suffix.toLowerCase()}`, label: `${number}${suffix}`, variant: suffix.toLowerCase() };
    }
    return null;
}

export function episodeInfo(episode) {
    const named = parseEpisode(episode?.nameEpisode);
    return named || parseEpisode(episode?.numberEpisode);
}

export function episodeKey(episode) { return episodeInfo(episode)?.key || ''; }
export function episodeLabel(episode, single = false) {
    const info = episodeInfo(episode);
    return single && info?.number === 1 && !info.variant && info.end === 1 ? 'Full' : info?.label || '—';
}

function streamScore(ep) {
    return ['urlM3u8', 'url', 'url2'].reduce((score, field) => score + (/^https?:\/\//i.test(ep[field] || '') ? 1 : 0), 0);
}

export function normalizeEpisodes(episodes = []) {
    const byKey = new Map();
    for (const episode of episodes) {
        const info = episodeInfo(episode);
        if (!info || episode.syncMergedInto) continue;
        const normalized = { ...episode, numberEpisode: info.number };
        const previous = byKey.get(info.key);
        const winner = !previous || streamScore(normalized) > streamScore(previous) ? normalized : previous;
        winner.legacyEpisodeNumbers = [...new Set([
            ...(previous?.legacyEpisodeNumbers || []), ...(episode.legacyEpisodeNumbers || []),
            episode.legacyEpisodeNumber, Number(episode.numberEpisode) !== info.number ? episode.numberEpisode : null,
        ].filter(value => value != null).map(String))];
        byKey.set(info.key, winner);
    }
    return [...byKey.values()].sort((a, b) => {
        const ai = episodeInfo(a), bi = episodeInfo(b);
        return ai.number - bi.number || ai.variant.localeCompare(bi.variant, 'en', { numeric: true }) || String(a.id).localeCompare(String(b.id));
    });
}

export function findEpisode(episodes, token) {
    const key = String(token ?? '');
    return episodes.find(ep => episodeKey(ep) === key) ||
        episodes.find(ep => ep.legacyEpisodeNumbers?.includes(key) || String(ep.legacyEpisodeNumber) === key) ||
        episodes.find(ep => String(ep.numberEpisode) === key) || null;
}

export function highestEpisode(episodes = []) {
    return Math.max(0, ...episodes.map(ep => episodeInfo(ep)?.end ?? 0));
}
