import { normalizeQuestion } from './knowledgeEngine.js';

export function rankingIntent(prompt) {
    const q = normalizeQuestion(prompt);
    if (!/\b(top|xep hang|hay nhat|tot nhat|yeu thich nhat|thich nhieu nhat|xem nhieu nhat|nhieu luot xem|danh gia cao|cham diem cao|nhieu tap nhat|it tap nhat)\b/.test(q)) return null;
    const kind = /yeu thich|luot thich|luot luu|like/.test(q) ? 'favorites'
        : /hay nhat|tot nhat|danh gia|cham diem|diem cao/.test(q) ? 'ratings'
            : /nhieu tap|dai nhat/.test(q) ? 'episodes'
                : /it tap|ngan nhat/.test(q) ? 'shortest'
                    : /moi nhat|moi cap nhat/.test(q) ? 'newest' : 'views';
    return { kind, count: Math.min(10, Math.max(1, Number(q.match(/\btop\s*(\d+)/)?.[1] || q.match(/\b(\d+)\s*(?:phim|bo|anime)/)?.[1]) || 5)), anime: /\banime\b/.test(q) };
}

const number = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value);
export function rankingValue(movie, kind, stats = {}) {
    if (kind === 'favorites') return Number(stats.favorites?.[movie.id]) || 0;
    if (kind === 'ratings') return Number(stats.ratings?.[movie.id]?.average) || 0;
    if (kind === 'episodes' || kind === 'shortest') return Number(movie.endEpisode) || 0;
    if (kind === 'newest') return Number(movie.releaseYear || movie.year) || 0;
    return Number(movie.views) || 0;
}
export function rankingMetric(movie, kind, stats) {
    const value = rankingValue(movie, kind, stats);
    if (kind === 'favorites') return `${number(value)} lượt yêu thích`;
    if (kind === 'ratings') return `${number(value)}/5 sao · ${number(stats.ratings[movie.id].count)} đánh giá`;
    if (kind === 'episodes' || kind === 'shortest') return `${number(value)} tập`;
    if (kind === 'newest') return `Năm ${value}`;
    return `${number(value)} lượt xem`;
}
export const rankingLabel = kind => ({ favorites: 'được yêu thích nhiều nhất', ratings: 'được đánh giá cao nhất', episodes: 'có nhiều tập nhất', shortest: 'có ít tập nhất', newest: 'mới nhất theo năm phát hành', views: 'có nhiều lượt xem nhất' }[kind]);
