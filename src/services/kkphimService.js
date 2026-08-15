const BASE_URL = 'https://phimapi.com';
const CDN_IMAGE = 'https://phimimg.com';

/** Helper: build URL with query params */
const buildUrl = (path, params = {}) => {
    const url = new URL(path, BASE_URL);
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') url.searchParams.set(k, v); });
    return url.toString();
};

/** Helper: fetch JSON */
const fetchJson = async (url) => {
    const res = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
};

// ==================== DANH SÁCH PHIM ====================

/**
 * Lấy danh sách phim mới cập nhật (v1) - Hỗ trợ đầy đủ bộ lọc.
 * Endpoint: /v1/api/danh-sach/phim-moi-cap-nhat
 */
export const fetchMoviesList = async (page = 1, filters = {}) => {
    return fetchJson(buildUrl('/v1/api/danh-sach/phim-moi-cap-nhat', { page, ...filters }));
};

/**
 * Lấy danh sách phim theo loại (v1) - phim-le, phim-bo, hoat-hinh, tv-shows, phim-chieu-rap
 * Endpoint: /v1/api/danh-sach/{type}
 */
export const fetchMoviesByType = async (type = 'phim-bo', page = 1, filters = {}) => {
    return fetchJson(buildUrl(`/v1/api/danh-sach/${type}`, { page, ...filters }));
};

/**
 * Lấy danh sách phim theo thể loại (v1)
 * Endpoint: /v1/api/the-loai/{slug}
 */
export const fetchMoviesByCategory = async (slug, page = 1, filters = {}) => {
    return fetchJson(buildUrl(`/v1/api/the-loai/${slug}`, { page, ...filters }));
};

/**
 * Lấy danh sách phim theo quốc gia (v1)
 * Endpoint: /v1/api/quoc-gia/{slug}
 */
export const fetchMoviesByCountry = async (slug, page = 1, filters = {}) => {
    return fetchJson(buildUrl(`/v1/api/quoc-gia/${slug}`, { page, ...filters }));
};

/**
 * Tìm kiếm phim theo từ khóa
 * Endpoint: /v1/api/tim-kiem?keyword={keyword}
 */
export const searchMovies = async (keyword, page = 1, limit = 24) => {
    return fetchJson(buildUrl('/v1/api/tim-kiem', { keyword, page, limit }));
};

// ==================== CHI TIẾT PHIM ====================

/**
 * Lấy chi tiết phim theo slug (bao gồm danh sách tập - episodes).
 * Endpoint: /phim/{slug}
 */
export const fetchMovieDetails = async (slug) => {
    return fetchJson(`${BASE_URL}/phim/${slug}`);
};

// ==================== METADATA ====================

/**
 * Lấy danh sách toàn bộ thể loại (tên + slug).
 * Endpoint: /the-loai
 */
export const fetchAllCategories = async () => {
    return fetchJson(`${BASE_URL}/the-loai`);
};

/**
 * Lấy danh sách toàn bộ quốc gia (tên + slug).
 * Endpoint: /quoc-gia
 */
export const fetchAllCountries = async () => {
    return fetchJson(`${BASE_URL}/quoc-gia`);
};

/**
 * Lấy danh sách năm phát hành.
 * Endpoint: /nam-phat-hanh
 */
export const fetchAllYears = async () => {
    return fetchJson(`${BASE_URL}/nam-phat-hanh`);
};

/**
 * Lấy danh sách hình ảnh (poster, backdrop) của phim từ TMDB.
 * Endpoint: /v1/api/phim/{slug}/images
 * Trả về mảng URL ảnh đầy đủ (dùng kích thước w780 cho backdrop, w500 cho poster).
 */
export const fetchMovieImages = async (slug) => {
    try {
        const data = await fetchJson(`${BASE_URL}/v1/api/phim/${slug}/images`);
        if (!data?.data?.images || !data?.data?.image_sizes) return [];
        const sizes = data.data.image_sizes;
        return data.data.images.map(img => {
            const baseUrl = img.type === 'backdrop'
                ? (sizes.backdrop?.w1280 || sizes.backdrop?.original || 'https://image.tmdb.org/t/p/w1280')
                : (sizes.poster?.w500 || sizes.poster?.original || 'https://image.tmdb.org/t/p/w500');
            return `${baseUrl}${img.file_path}`;
        }).filter(Boolean);
    } catch {
        return [];
    }
};

// ==================== HELPERS ====================

/**
 * Tạo URL ảnh đầy đủ từ path tương đối của KKPhim.
 */
export const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${CDN_IMAGE}/${path}`;
};

/**
 * Map loại phim từ KKPhim sang tên tiếng Việt cho hệ thống MFILM.
 */
export const mapMovieType = (type) => {
    const typeMap = {
        'series': 'Phim Bộ',
        'single': 'Phim Lẻ',
        'hoathinh': 'Hoạt Hình',
        'tvshows': 'TV Shows',
    };
    return typeMap[type] || 'Phim Bộ';
};

/**
 * Map trạng thái phim từ KKPhim sang tiếng Việt.
 */
export const mapMovieStatus = (status) => {
    const statusMap = {
        'ongoing': 'Đang chiếu',
        'completed': 'Hoàn thành',
        'trailer': 'Sắp chiếu',
    };
    return statusMap[status] || 'Đang chiếu';
};

/**
 * Parse thời lượng từ chuỗi KKPhim (VD: "22 phút/tập", "120 phút") sang số phút.
 */
export const parseDuration = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
};

/**
 * Loại bỏ HTML tags khỏi nội dung mô tả phim.
 */
export const stripHtml = (html) => {
    if (!html) return 'Đang cập nhật...';
    return html.replace(/<[^>]*>/g, '').replace(/\\r\\n|\\n|\\r/g, ' ').trim() || 'Đang cập nhật...';
};

/**
 * Map quốc gia slug của KKPhim sang tên tiếng Anh (cho countriesID).
 */
export const mapCountryName = (countryArr) => {
    if (!countryArr || countryArr.length === 0) return 'Other';
    const slugMap = {
        'nhat-ban': 'Japan', 'han-quoc': 'Korea', 'trung-quoc': 'China',
        'au-my': 'US-UK', 'thai-lan': 'Thailand', 'dai-loan': 'Taiwan',
        'hong-kong': 'Hong Kong', 'an-do': 'India', 'anh': 'UK',
        'phap': 'France', 'canada': 'Canada', 'duc': 'Germany',
        'tay-ban-nha': 'Spain', 'brazil': 'Brazil', 'uc': 'Australia',
        'indonesia': 'Indonesia', 'philippines': 'Philippines',
        'viet-nam': 'Vietnam', 'quoc-gia-khac': 'Other',
    };
    const firstCountry = countryArr[0];
    const slug = firstCountry?.slug || '';
    return slugMap[slug] || firstCountry?.name || 'Other';
};
