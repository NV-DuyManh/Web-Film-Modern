import { newestMoviesFirst } from './movieRecency.js';

const definitions = [
    ['tu-tien-co-trang', 'Tu Tiên', 'Tu luyện, tiên hiệp và những hành trình trong thế giới cổ trang.', ['Tu Tiên', 'Cổ Trang'], 'from-amber-400 to-orange-500'],
    ['xuyen-khong-chuyen-sinh', 'Xuyên Không', 'Đến thế giới khác, tái sinh và bắt đầu một cuộc đời mới.', ['Xuyên Không', 'Chuyển Sinh'], 'from-violet-400 to-fuchsia-500'],
    ['anime-hanh-dong', 'Anime Hành Động', 'Anime Nhật Bản với những trận chiến và hành trình phiêu lưu hấp dẫn.', ['Hành Động', 'Phiêu Lưu', 'Võ Thuật'], 'from-pink-400 to-purple-500'],
    ['bi-an-trinh-tham', 'Bí Ẩn & Phá Án', 'Lần theo manh mối, phá án và khám phá những bí mật.', ['Bí Ẩn', 'Trinh Thám', 'Hình Sự'], 'from-cyan-400 to-blue-500'],
    ['kinh-di-giat-gan', 'Kinh Dị', 'Không khí rùng rợn, căng thẳng và những tình huống bất ngờ.', ['Kinh Dị', 'Giật Gân'], 'from-red-500 to-rose-700'],
    ['tinh-cam-lang-man', 'Tình Cảm', 'Những chuyện tình ngọt ngào, day dứt và nhiều cảm xúc.', ['Tình Cảm', 'Lãng Mạn'], 'from-rose-400 to-pink-500'],
    ['hai-huoc-thu-gian', 'Hài Hước', 'Đổi gió với những câu chuyện vui và tiếng cười sảng khoái.', ['Hài Hước'], 'from-yellow-300 to-orange-400'],
    ['phieu-luu-sinh-ton', 'Phiêu Lưu', 'Khám phá vùng đất mới, vượt hiểm nguy và chiến đấu để sống sót.', ['Phiêu Lưu', 'Sinh Tồn'], 'from-emerald-400 to-teal-600'],
    ['gia-dinh-am-ap', 'Gia Đình', 'Tình thân và những câu chuyện gắn kết các thế hệ.', ['Gia Đình'], 'from-orange-300 to-rose-400'],
    ['phim-han-chon-loc', 'Phim Hàn', 'Khám phá những câu chuyện tình cảm, hài hước và kịch tính từ Hàn Quốc.', [], 'from-sky-300 to-cyan-500'],
    ['sieu-nhien-ky-ao', 'Kỳ Ảo', 'Phép thuật, thần thoại và những thế giới vượt ngoài trí tưởng tượng.', ['Huyền Bí', 'Giả Tưởng', 'Giả Tượng', 'Kỳ Ảo', 'Thần Thoại'], 'from-purple-400 to-indigo-600'],
    ['khoa-hoc-vien-tuong', 'Viễn Tưởng', 'Công nghệ, vũ trụ và những khả năng của thế giới tương lai.', ['Khoa Học', 'Viễn Tưởng', 'KH-VT'], 'from-blue-400 to-cyan-400'],
    ['vo-thuat-dinh-cao', 'Võ Thuật', 'Những màn giao đấu và hành trình của các cao thủ.', ['Võ Thuật'], 'from-red-400 to-amber-500'],
    ['chien-tranh-lich-su', 'Chiến Tranh', 'Những cuộc chiến và câu chuyện trong các thời kỳ lịch sử.', ['Chiến Tranh', 'Lịch Sử', 'War & Politics'], 'from-amber-500 to-stone-400'],
    ['am-nhac-san-khau', 'Âm Nhạc', 'Giai điệu, biểu diễn và những câu chuyện theo đuổi đam mê.', ['Âm Nhạc'], 'from-fuchsia-400 to-pink-400'],
    ['doi-thuong-cam-dong', 'Đời Thường', 'Những lát cắt cuộc sống giản dị và câu chuyện chạm đến cảm xúc.', ['Đời Thường', 'Cảm Động'], 'from-teal-300 to-sky-400'],
    ['tam-ly', 'Tâm Lý', 'Những câu chuyện nội tâm, lựa chọn khó khăn và số phận nhiều cảm xúc.', ['Tâm Lý', 'Chính Kịch', 'Drama'], 'from-indigo-400 to-violet-500'],
    ['hoat-hinh', 'Hoạt Hình', 'Những thế giới hoạt hình sống động, từ anime đến các cuộc phiêu lưu.', ['Hoạt Hình'], 'from-lime-300 to-emerald-400'],
    ['phim-viet', 'Phim Việt', 'Những câu chuyện, con người và nét văn hóa Việt Nam trên màn ảnh.', [], 'from-red-400 to-yellow-400'],
    ['tai-lieu', 'Tài Liệu', 'Khám phá thiên nhiên, con người và những góc nhìn mới về thế giới.', ['Tài Liệu'], 'from-cyan-300 to-teal-500'],
];

export const CURATED_TOPICS = definitions.map(([id, name, description, genres, gradient], order) => ({
    id, name, title: name, routeSlug: id, description, genres, gradient, order,
    icon: ['FaStar', 'FaGlobeAsia', 'FaFire', 'FaFilm', 'FaTheaterMasks', 'FaTheaterMasks', 'FaTheaterMasks', 'FaGlobeAsia'][order % 8],
    enabled: true, isCurated: true,
}));

export function topicEnabledOverrides(value = {}) {
    return Object.fromEntries(CURATED_TOPICS.filter(topic => typeof value[topic.id] === 'boolean').map(topic => [topic.id, value[topic.id]]));
}

export function curatedTopics(overrides = {}) {
    const clean = topicEnabledOverrides(overrides);
    return CURATED_TOPICS.map(topic => ({ ...topic, enabled: clean[topic.id] ?? true }));
}

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().trim();

export function selectTopicMovies(topic, movies = [], categories = [], categoryTypes = []) {
    const definition = CURATED_TOPICS.find(item => item.id === topic?.id);
    if (!definition || topic.enabled === false) return [];
    const names = new Set(definition.genres.map(normalize));
    const ids = new Set(categories.filter(item => names.has(normalize(item.name))).map(item => String(item.id)));
    const animationIds = new Set(categoryTypes.filter(item => ['hoat hinh', 'anime', 'animation'].includes(normalize(item.name))).map(item => String(item.id)));
    return movies.filter(movie => {
        if (definition.id === 'phim-han-chon-loc') return ['han quoc', 'south korea', 'korea'].includes(normalize(movie.countriesID));
        if (definition.id === 'phim-viet') return ['viet nam', 'vietnam', 'viet', 'vn'].includes(normalize(movie.countriesID));
        const tags = Array.isArray(movie.listCategory) ? movie.listCategory : [];
        if (definition.id === 'hoat-hinh') return animationIds.has(String(movie.categoryTypeID)) || tags.some(id => ids.has(String(id)));
        if (!tags.some(id => ids.has(String(id)))) return false;
        if (definition.id !== 'anime-hanh-dong') return true;
        return ['nhat ban', 'japan'].includes(normalize(movie.countriesID)) && animationIds.has(String(movie.categoryTypeID));
    }).sort(newestMoviesFirst);
}
