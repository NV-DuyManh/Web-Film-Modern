// Same field compatibility and placeholder rules as src/utils/movieImages.js.
// Kept within the backend build so its standalone Docker deployment has no frontend dependency.
export function movieArtwork(value: unknown): string {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url || /^(?:null|undefined|none)$/i.test(url)) return '';
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch { /* Preserve URLs for client fallback. */ }
  if (/(?:^|[/\\])Logo(?:\d+)?(?:[-.]|$)/i.test(decoded)) return '';
  if (/^https?:\/\/(?:via\.placeholder\.com|placehold\.co)(?:[/:]|$)/i.test(url)) return '';
  return url;
}

export function resolveMovieImages(movie: Record<string, any> = {}) {
  const first = (values: unknown[]) => values.map(movieArtwork).find(Boolean) || '';
  const poster = first([movie.imgUrl, movie.img_url, movie.posterUrl, movie.poster_url, movie.poster, movie.image]);
  const banner = first([movie.bannerUrl, movie.banner_url, movie.thumbUrl, movie.thumb_url, movie.imageMovie]);
  return { imgUrl: poster || banner, bannerUrl: banner || poster };
}

export function withMovieArtwork(movie: Record<string, any>): Record<string, any> {
  const images = resolveMovieImages(movie);
  const result = { ...movie, ...images };
  for (const field of ['img_url', 'poster_url']) if (Object.prototype.hasOwnProperty.call(movie, field)) result[field] = images.imgUrl;
  for (const field of ['banner_url', 'thumb_url']) if (Object.prototype.hasOwnProperty.call(movie, field)) result[field] = images.bannerUrl;
  return result;
}
