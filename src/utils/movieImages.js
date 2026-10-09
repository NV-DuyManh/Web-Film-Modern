import { getOptimizedUrl } from './cloudinary.js';

// Older imports stored bundled MFILM artwork in place of missing movie images.
// Do not let that placeholder mask a real poster or banner on the same movie.
export function movieArtwork(value) {
    if (typeof value !== 'string') return '';
    const url = value.trim();
    if (!url || /^(?:null|undefined|none)$/i.test(url)) return '';
    let decoded = url;
    try { decoded = decodeURIComponent(url); } catch { /* Keep a malformed URL for the image error handler. */ }
    if (/(?:^|[/\\])Logo(?:\d+)?(?:[-.]|$)/i.test(decoded)) return '';
    if (/^https?:\/\/(?:via\.placeholder\.com|placehold\.co)(?:[/:]|$)/i.test(url)) return '';
    return url;
}

export function resolveMovieImages(movie = {}) {
    const first = values => values.map(movieArtwork).find(Boolean) || '';
    const poster = first([movie.imgUrl, movie.img_url, movie.posterUrl, movie.poster_url, movie.poster, movie.image]);
    const banner = first([movie.bannerUrl, movie.banner_url, movie.thumbUrl, movie.thumb_url, movie.imageMovie]);
    return { imgUrl: poster || banner, bannerUrl: banner || poster };
}

export function movieImageCandidates(movie, kind = 'poster', width = 400, height = 600, type = kind, optimize = true) {
    const images = resolveMovieImages(movie);
    const preferred = kind === 'banner' ? images.bannerUrl : images.imgUrl;
    const alternate = kind === 'banner' ? images.imgUrl : images.bannerUrl;
    // If an image proxy fails, try the original before switching artwork.
    return [...new Set([preferred, alternate].filter(Boolean).flatMap(url => optimize ? [getOptimizedUrl(url, width, height, type), url] : [url]))];
}

// Only image-bearing updates may change artwork; a views/price/status patch must not erase it.
export function movieArtworkPatch(patch, current = {}) {
    const fields = ['imgUrl', 'img_url', 'posterUrl', 'poster_url', 'poster', 'image', 'bannerUrl', 'banner_url', 'thumbUrl', 'thumb_url', 'imageMovie'];
    if (!fields.some(field => Object.hasOwn(patch, field))) return {};
    return resolveMovieImages({ ...current, ...patch });
}

export function missingMovieArtworkPatch(movie) {
    const images = resolveMovieImages(movie);
    if (!images.imgUrl) return {};
    const patch = {};
    if (movie.imgUrl !== images.imgUrl) patch.imgUrl = images.imgUrl;
    if (movie.bannerUrl !== images.bannerUrl) patch.bannerUrl = images.bannerUrl;
    return patch;
}
