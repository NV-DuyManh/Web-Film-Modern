import { routeSegment } from './nameRoutes.js';

export const SITE_ORIGIN = 'https://www.mfilm.online';
export const SITE_TITLE = 'MFILM - Xem phim online, phim mới Vietsub';
export const SITE_DESCRIPTION = 'Khám phá phim lẻ, phim bộ, anime và phim chiếu rạp tại MFILM. Tìm phim theo thể loại, quốc gia, diễn viên; xem thông tin phim, chọn tập và lưu xem tiếp.';
export const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/social-cover.png`;
export const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const STATIC_SEO = {
    '/': [SITE_TITLE, SITE_DESCRIPTION],
    '/film-new': ['Phim mới cập nhật - Phim lẻ, phim bộ', 'Khám phá phim mới cập nhật tại MFILM. Xem nội dung, diễn viên, năm phát hành và các tập phim trong danh mục phim lẻ, phim bộ và anime.'],
    '/singleMovies': ['Phim lẻ - Phim điện ảnh', 'Khám phá phim lẻ và phim điện ảnh tại MFILM. Tìm phim theo tên, đọc nội dung và thông tin diễn viên trước khi chọn phim để xem.'],
    '/series': ['Phim bộ - Danh sách phim nhiều tập', 'Tìm phim bộ và các phim nhiều tập tại MFILM. Xem nội dung, diễn viên và danh sách tập; chọn tập hoặc lưu để xem tiếp.'],
    '/anime': ['Anime và phim hoạt hình', 'Khám phá anime và phim hoạt hình tại MFILM. Xem tên phim, thông tin nội dung, năm phát hành và danh sách tập trong từng trang phim.'],
    '/cinema-movies': ['Phim chiếu rạp - Phim điện ảnh', 'Danh mục phim chiếu rạp và phim điện ảnh tại MFILM. Tìm hiểu nội dung, diễn viên và các bản phim đang có trong thư viện.'],
    '/film-hongkong': ['Phim Hồng Kông', 'Khám phá phim Hồng Kông tại MFILM: xem nội dung, diễn viên, năm phát hành và thông tin từng phim trong thư viện.'],
    '/film-coming': ['Phim sắp tới', 'Khám phá mục phim sắp tới tại MFILM. Kiểm tra trạng thái và thông tin phát hành trong trang chi tiết của từng phim.'],
    '/actors': ['Diễn viên - Thông tin và phim đã tham gia', 'Tra cứu diễn viên tại MFILM. Xem thông tin giới thiệu và danh sách phim đã tham gia; tìm phim theo diễn viên bạn yêu thích.'],
    '/topic': ['Chủ đề phim - Bộ sưu tập MFILM', 'Khám phá các bộ sưu tập phim theo chủ đề tại MFILM. Tìm phim theo sở thích và xem thông tin từng phim trong bộ sưu tập.'],
    '/category': ['Thể loại phim - Khám phá kho MFILM', 'Duyệt thể loại phim có trong kho MFILM: hành động, tình cảm, hài hước, hoạt hình và nhiều thể loại khác. Chọn thể loại để xem danh sách phim.'],
    '/country': ['Phim theo quốc gia - Khám phá kho MFILM', 'Tìm phim theo quốc gia trong kho MFILM. Chọn Việt Nam, Hàn Quốc, Trung Quốc, Nhật Bản hoặc các quốc gia đang có phim để xem danh sách.'],
    '/showtimes': ['Lịch chiếu phim', 'Theo dõi lịch chiếu phim tại MFILM. Chọn ngày và xem thông tin lịch chiếu, địa điểm và phim được giới thiệu.'],
    '/ho-tro': ['Hỗ trợ & hỏi đáp', 'Hướng dẫn xem phim, chọn tập, lưu xem tiếp, thuê phim trong 30 ngày và sử dụng MFILM trên điện thoại, máy tính.'],
};
export function isPaginatedPath(path) {
    return Object.hasOwn(STATIC_SEO, path) && !['/', '/ho-tro', '/showtimes', '/category', '/country'].includes(path) || /^\/(?:category|country|topic)\//.test(path);
}

export function plainText(value = '') {
    return String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"').replace(/&#(?:39|x27);/gi, "'").replace(/\s+/g, ' ').trim();
}
export function descriptionText(value = SITE_DESCRIPTION, length = 170) {
    const text = plainText(value) || SITE_DESCRIPTION;
    if (text.length <= length) return text;
    const cut = text.slice(0, length - 1);
    return `${cut.slice(0, cut.lastIndexOf(' ') > length - 35 ? cut.lastIndexOf(' ') : cut.length)}…`;
}
export function pageTitle(value = SITE_TITLE) {
    const title = plainText(value).replace(/\s*\|\s*MFILM\s*$/i, '').replace(/\s*-\s*MFILM\s*$/i, '');
    return /^MFILM\b/i.test(title) ? title : `${title} | MFILM`;
}
export function publicImage(value, fallback = DEFAULT_SOCIAL_IMAGE) {
    if (!value) return fallback;
    try {
        const url = new URL(value, SITE_ORIGIN);
        return ['https:', 'http:'].includes(url.protocol) && !/^\/(?:src\/|assets\/Logo)/.test(url.pathname) ? url.href : fallback;
    } catch { return fallback; }
}
export function canonicalUrl(value = '/') {
    let url;
    try { url = new URL(value, SITE_ORIGIN); } catch { url = new URL('/', SITE_ORIGIN); }
    // A canonical URL never inherits an external host, tracking tokens or episode parameters.
    const result = new URL(url.pathname.replace(/^\/xem-phim\//, '/phim/').replace(/\/+$/, '') || '/', SITE_ORIGIN);
    const page = url.searchParams.get('page');
    if (isPaginatedPath(result.pathname) && /^[1-9]\d*$/.test(page || '') && Number(page) > 1 && Number(page) <= 100000) result.searchParams.set('page', page);
    return result.href;
}
export function isPrivatePath(path) {
    return /^\/(?:account|pay|payVip|payMovie|upgrade|upgrade-vip|for-you|movies|episodes|showTimes|users|reviews|comments|authors|characters|plans|features|packages|rentMovies|subscriptions|magicImport|categories|categoryTypes|topics|profile)(?:\/|$)/.test(path);
}
export function robotsForPath(path, { noindex = false, search = '', admin = false } = {}) {
    const params = new URLSearchParams(search);
    return noindex || admin || isPrivatePath(path) || path.startsWith('/xem-phim/') || ['q', 'search', 'keyword', 'sort', 'order', 'year', 'plan', 'filter'].some(key => params.has(key))
        ? 'noindex, follow' : INDEX_ROBOTS;
}
export function safeJsonLd(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
export function breadcrumbSchema(items) {
    return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({
        '@type': 'ListItem', position: i + 1, name: plainText(name), item: canonicalUrl(path),
    })) };
}
export function siteSchemas() {
    const organization = { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization`, name: 'MFILM', url: `${SITE_ORIGIN}/`, logo: DEFAULT_SOCIAL_IMAGE, contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', url: 'https://zalo.me/0779534325', availableLanguage: 'vi' } };
    return [organization, { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_ORIGIN}/#website`, name: 'MFILM', alternateName: ['MFilm', 'ManhFilm'], url: `${SITE_ORIGIN}/`, inLanguage: 'vi', publisher: { '@id': organization['@id'] } }];
}
export function movieDescription(movie) {
    const name = plainText(movie.otherName || movie.name);
    const year = /^\d{4}$/.test(String(movie.releaseYear || movie.year || '')) ? ` (${movie.releaseYear || movie.year})` : '';
    const formats = [movie.hasSub && 'Vietsub', movie.hasDub && 'lồng tiếng', movie.hasVoice && 'thuyết minh'].filter(Boolean);
    return descriptionText(`${name}${year}${formats.length ? ` - ${formats.join(', ')}` : ''}. ${plainText(movie.description) || 'Thông tin phim, diễn viên và danh sách tập tại MFILM.'}`);
}
export function movieSchema(movie, { actors = [], authors = [], categories = [], series = Number(movie.endEpisode) > 1 } = {}) {
    const url = canonicalUrl(`/phim/${routeSegment(movie)}`);
    const duration = String(movie.duration || movie.time || '').trim();
    const minuteMatch = duration.match(/^(\d{1,3})(?:\s*(?:phút|min|minutes)(?:\s*\/\s*tập)?)?$/i);
    const minutes = minuteMatch && Number(minuteMatch[1]);
    const schema = {
        '@context': 'https://schema.org', '@type': series ? 'TVSeries' : 'Movie', '@id': `${url}#work`,
        name: plainText(movie.otherName || movie.name), url,
        description: plainText(movie.description) || movieDescription(movie), image: publicImage(movie.imgUrl || movie.bannerUrl),
    };
    if (movie.name && movie.name !== schema.name) schema.alternateName = plainText(movie.name);
    if (minutes > 0 && minutes <= 600 && !series) schema.duration = `PT${minutes}M`;
    if (categories.length) schema.genre = categories.map(item => plainText(item.name)).filter(Boolean);
    if (actors.length) schema.actor = actors.map(item => ({ '@type': 'Person', name: plainText(item.name), url: canonicalUrl(`/dien-vien/${routeSegment(item)}`) }));
    // Authors are shown as authors in the existing catalog; do not invent a director credit.
    if (authors.length) schema.creator = authors.map(item => ({ '@type': 'Person', name: plainText(item.name), url: canonicalUrl(`/tac-gia/${routeSegment(item)}`) }));
    return schema;
}
