import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';

export const STOP_WORDS = new Set([
    'phim', 'bo', 'tap', 'xem', 'mo', 'cho', 'toi', 'co', 'nay', 'va', 'la', 'nhung', 'cac', 'the',
    'nhan', 'vat', 'dien', 'vien', 'tac', 'gia', 'dao', 'dien', 'k', 'ko', 'khong', 'chua', 'nao',
    'nhi', 'nhe', 'a', 'ha', 'tim', 'kiem', 'muon', 'can', 'hoi', 've', 'co phai', 'hay khong', 'voi',
    'gi', 'trong', 'duoc', 'o', 'tai', 'website', 'mfilm', 'app'
]);

export const normalizeVietnameseTypo = (str) => {
    if (!str) return '';
    return str
        .toString()
        // Sửa các lỗi gõ Telex dính phím phổ biến
        .replace(/nhimeej|nhimej|nhiejm|nhiemj|nheejm/gi, 'nhiệm')
        .replace(/đặt nhiệm|dat nhiem|dac nhimeej|dac nhimej/gi, 'đặc nhiệm')
        .replace(/trungf|trunf|tq/gi, 'trung')
        .replace(/quoocs|quosc|qooc|qoc/gi, 'quốc')
        .replace(/hafn|hann/gi, 'hàn')
        .replace(/nhaatj|nhatj|nhatr/gi, 'nhật')
        .replace(/vieetj|vietj|vieet/gi, 'việt')
        .replace(/namf|namr/gi, 'nam')
        .replace(/myx|mwx|myj|mi~/gi, 'mỹ')
        .replace(/thais|thais lan/gi, 'thái')
        .replace(/hoongf|hoong/gi, 'hồng')
        .replace(/koong|koongf/gi, 'kông')
        .replace(/kiemf|kiemj|kieepm/gi, 'kiếm')
        .replace(/hiepff|hiepj|hieejp/gi, 'hiệp')
        .replace(/tieen|tiejn/gi, 'tiên')
        .replace(/([a-z])ee([rsfajx]?)/gi, '$1ê')
        .replace(/([a-z])oo([rsfajx]?)/gi, '$1ô')
        .replace(/([a-z])aa([rsfajx]?)/gi, '$1â')
        .replace(/([a-z])uw([rsfajx]?)/gi, '$1ư')
        .replace(/([a-z])ow([rsfajx]?)/gi, '$1ơ')
        .replace(/([a-z])aw([rsfajx]?)/gi, '$1ă')
        .replace(/dd/gi, 'đ');
};

export const searchTV = (str) => {
    if (!str) return '';
    let s = normalizeVietnameseTypo(str);
    return s
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
};

export const normalizeTokens = (str) => {
    return searchTV(str)
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 0 && !STOP_WORDS.has(t));
};

/**
 * Tính khoảng cách Damerau-Levenshtein (hỗ trợ phát hiện gõ sai/đảo chữ như rudues -> rudeus)
 */
export const levenshtein = (a, b) => {
    const aLen = a.length;
    const bLen = b.length;
    if (aLen === 0) return bLen;
    if (bLen === 0) return aLen;

    const matrix = Array.from({ length: bLen + 1 }, () => Array(aLen + 1).fill(0));

    for (let i = 0; i <= bLen; i++) matrix[i][0] = i;
    for (let j = 0; j <= aLen; j++) matrix[0][j] = j;

    for (let i = 1; i <= bLen; i++) {
        for (let j = 1; j <= aLen; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                let cost = 1;
                if (i > 1 && j > 1 && b.charAt(i - 1) === a.charAt(j - 2) && b.charAt(i - 2) === a.charAt(j - 1)) {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + cost,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1,
                        matrix[i - 2][j - 2] + 1
                    );
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + cost,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
    }
    return matrix[bLen][aLen];
};

/**
 * Kiểm tra khớp mờ (Fuzzy matching) có dung sai lỗi chính tả
 */
export const isFuzzyMatch = (searchTerm, targetStr) => {
    if (!searchTerm || !targetStr) return false;
    const s1 = searchTV(searchTerm);
    const s2 = searchTV(targetStr);
    if (!s1 || !s2) return false;

    if (s2.includes(s1) || s1.includes(s2)) return true;

    const s1Tokens = normalizeTokens(searchTerm);
    const s2Tokens = normalizeTokens(targetStr);

    for (const t1 of s1Tokens) {
        if (t1.length < 3) continue;
        for (const t2 of s2Tokens) {
            if (t2.length < 3) continue;
            if (t2 === t1) return true;
            const maxDist = t1.length >= 6 ? 2 : 1;
            if (Math.abs(t1.length - t2.length) <= maxDist) {
                const dist = levenshtein(t1, t2);
                if (dist <= maxDist) return true;
            }
        }
    }
    return false;
};

/**
 * Từ điển nhận diện và ánh xạ quốc gia đa ngôn ngữ (Việt - Anh - Tên viết tắt - Tiếng lóng người Việt hay dùng)
 */
export const COUNTRY_DICTIONARY = {
    'trung quoc': [
        'trung quoc', 'china', 'chinese', 'trung', 'hoa ngu', 'dai luc', 'bac kinh', 'beijing', 
        'thuong hai', 'tq', 'c-drama', 'cdrama', 'c drama', 'tau', 'tau khua', 'khua', 'phim tau',
        'kiem hiep', 'tien hiep', 'tu tien', 'huyen huyen', 'cung dau', 'ngon tinh'
    ],
    'han quoc': [
        'han quoc', 'korea', 'south korea', 'korean', 'han', 'seoul', 'hq', 'k-drama', 'kdrama', 'k drama',
        'kim chi', 'xu kim chi', 'xu so kim chi', 'oppa', 'han xeng', 'phim han xeng'
    ],
    'nhat ban': [
        'nhat ban', 'japan', 'japanese', 'nhat', 'anime', 'tokyo', 'manga', 'j-drama', 'jdrama', 'j drama',
        'hoa anh dao', 'xu hoa anh dao', 'xu so hoa anh dao', 'phu tang', 'xu phu tang', 'xu so phu tang',
        'wibu', 'otaku', 'live action', 'isekai'
    ],
    'viet nam': [
        'viet nam', 'vietnam', 'vn', 'viet', 'nuoc minh', 'nuoc nha', 'nha minh', 'trong nuoc',
        'phim viet', 'phim vtv', 'chieu rap viet', 'dien anh viet'
    ],
    'my': [
        'my', 'us', 'usa', 'united states', 'america', 'american', 'hollywood', 'au my', 'us-uk', 'usuk',
        'phim tay', 'phuong tay', 'chu sam', 'phim chu sam', 'bom tan my', 'bom tan hollywood'
    ],
    'thai lan': [
        'thai lan', 'thailand', 'thai', 'chua vang', 'xu chua vang', 'xu so chua vang', 't-drama', 'tdrama',
        'bangkok', 'phim thai', 'dam my thai'
    ],
    'hong kong': [
        'hong kong', 'hongkong', 'huong cang', 'xu huong cang', 'hk', 'tvb', 'phim tvb', 'canh sat hong kong'
    ],
    'dai loan': [
        'dai loan', 'taiwan', 'taiwanese', 'than tuong dai loan'
    ],
    'an do': [
        'an do', 'india', 'indian', 'bollywood', 'co dau 8 tuoi'
    ],
    'anh': [
        'anh', 'uk', 'united kingdom', 'england', 'british', 'suong mu', 'xu suong mu', 'xu so suong mu'
    ],
    'phap': [
        'phap', 'france', 'french', 'paris', 'chau au'
    ]
};

/**
 * Trích xuất quốc gia từ câu hỏi / tiếng lóng / cách nói chuyện tự nhiên của người Việt
 */
export const detectCountryInQuery = (str) => {
    if (!str) return null;
    const s = searchTV(str);
    
    // 1. Trung Quốc: phim trung, hoa ngữ, đại lục, tàu, tàu khựa, c-drama, tq, kiếm hiệp, tiên hiệp, tu tiên, cung đấu...
    if (/\b(trung quoc|phim trung|trung|hoa ngu|dai luc|china|chinese|tq|c-drama|cdrama|c drama|tau khua|phim tau|khua|kiem hiep|tien hiep|tu tien|cung dau|ngon tinh|bac kinh|thuong hai)\b/i.test(s)) {
        return 'trung quoc';
    }
    // 2. Hàn Quốc: phim hàn, k-drama, xứ kim chi, oppa, hàn xẻng, korea, seoul...
    if (/\b(han quoc|phim han|han|south korea|korean|korea|hq|k-drama|kdrama|k drama|kim chi|xu kim chi|xu so kim chi|oppa|han xeng|seoul)\b/i.test(s)) {
        return 'han quoc';
    }
    // 3. Nhật Bản: phim nhật, anime, xứ hoa anh đào, xứ phù tang, japan, wibu, tokyo, manga...
    if (/\b(nhat ban|phim nhat|nhat|japan|japanese|anime|wibu|otaku|isekai|manga|j-drama|jdrama|j drama|hoa anh dao|xu hoa anh dao|phu tang|xu phu tang|live action|tokyo)\b/i.test(s)) {
        return 'nhat ban';
    }
    // 4. Việt Nam: phim việt, nước mình, nước nhà, phim nhà mình, trong nước, vn, vtv...
    if (/\b(viet nam|phim viet|viet|vietnam|vn|nuoc minh|nuoc nha|nha minh|trong nuoc|vtv|chieu rap viet)\b/i.test(s)) {
        return 'viet nam';
    }
    // 5. Mỹ / Âu Mỹ: phim mỹ, hollywood, âu mỹ, chú sam, usa, us-uk, phương tây...
    if (/\b(phim my|au my|hollywood|usa|united states|us|us-uk|usuk|chu sam|phim tay|phuong tay|bom tan my|bom tan hollywood)\b/i.test(s)) {
        return 'my';
    }
    // 6. Thái Lan: phim thái, xứ chùa vàng, thailand, t-drama, bangkok...
    if (/\b(thai lan|phim thai|thai|thailand|chua vang|xu chua vang|xu so chua vang|t-drama|tdrama|bangkok)\b/i.test(s)) {
        return 'thai lan';
    }
    // 7. Hồng Kông: phim hồng kông, tvb, hương cảng, hk...
    if (/\b(hong kong|hongkong|phim hong kong|phim tvb|tvb|huong cang|xu huong cang|hk)\b/i.test(s)) {
        return 'hong kong';
    }
    // 8. Đài Loan
    if (/\b(dai loan|taiwan|taiwanese)\b/i.test(s)) {
        return 'dai loan';
    }
    // 9. Ấn Độ: bollywood, ấn độ, india...
    if (/\b(an do|india|indian|bollywood)\b/i.test(s)) {
        return 'an do';
    }
    // 10. Anh / Pháp / Châu Âu
    if (/\b(phim anh|united kingdom|england|british|suong mu|xu suong mu)\b/i.test(s)) {
        return 'anh';
    }
    if (/\b(phim phap|france|french|paris|chau au)\b/i.test(s)) {
        return 'phap';
    }
    
    return null;
};

/**
 * Kiểm tra xem một bộ phim có thuộc quốc gia được yêu cầu không
 */
export const isMovieMatchCountry = (m, targetCountryKey) => {
    if (!m || !targetCountryKey) return false;
    const mCountryRaw = searchTV(m.countriesID || m.country || '').trim();
    if (!mCountryRaw) return false;

    const aliases = COUNTRY_DICTIONARY[targetCountryKey] || [targetCountryKey];
    
    return aliases.some(alias => 
        mCountryRaw === alias ||
        mCountryRaw.includes(alias) ||
        alias.includes(mCountryRaw)
    );
};

/**
 * Nhận diện yêu cầu gói cước từ câu hỏi của người dùng (Premium, VIP, Plus, Basic, Free, Xịn nhất, Cao nhất...)
 */
export const detectPlanInQuery = (str) => {
    if (!str) return null;
    const s = searchTV(str);
    
    // Level 3 / Premium / VIP / Xịn nhất / Cao nhất / Đắt nhất
    if (/\b(premium|prenium|vip|goi vip|goi premium|level 3|l3|cao cap|vip nhat|xin nhat|xin|xịn nhất|xịn|cao nhat|dat nhat|tot nhat|vip pro|vip max|max|loai xin|loai xin nhat|loai cao|loai cao nhat)\b/i.test(s)) {
        return { name: 'Premium', targetLevel: 3, isPaid: true };
    }
    // Level 2 / Plus / Tầm trung / Vừa
    if (/\b(plus|goi plus|level 2|l2|tam trung|goi vua|loai vua)\b/i.test(s)) {
        return { name: 'Plus', targetLevel: 2, isPaid: true };
    }
    // Level 1 / Basic / Cơ bản / Thấp nhất / Rẻ nhất
    if (/\b(basic|goi basic|level 1|l1|co ban|thap nhat|re nhat|loai re|loai thap)\b/i.test(s)) {
        return { name: 'Basic', targetLevel: 1, isPaid: true };
    }
    // Free / Miễn phí / 0 đồng / Không mất tiền
    if (/\b(free|mien phi|goi free|level 0|l0|khong mat tien|khong ton phi|khong ton tien|0 dong|xem free)\b/i.test(s)) {
        return { name: 'Free', targetLevel: 0, isFree: true };
    }
    // Paid chung chung (có phí / trả phí)
    if (/\b(co phi|tra phi|tinh phi|mua goi|nang cap)\b/i.test(s)) {
        return { name: 'Paid', targetLevel: null, isPaid: true };
    }
    
    return null;
};

/**
 * Thuật toán tìm phim chính xác dựa trên chấm điểm từ khóa & nhân vật / diễn viên / tác giả
 */
export const findTargetMovie = (query, movies = [], characters = [], actors = [], authors = []) => {
    if (!query) return null;
    const clean = String(query).replace(/^\/?phim\//, '').trim();

    // 1. Khớp chính xác slug hoặc ID
    let target = movies.find(m => m.slug === clean || m.id === clean);
    if (target) return target;

    const cleanKw = searchTV(clean)
        .replace(/\b(co phim|tim phim|phim|bo phim|xem phim|hoat hinh|anime|co|khong|k|ko|chua|nao|nhe|nhi|a|ha|voi|ve|cho toi|giup toi)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleanKw) return null;

    // 2. Tìm phim khớp nhất
    let bestMovie = null;
    let highestScore = 0;

    for (const m of movies) {
        const mName = searchTV(m.name || '');
        const mOther = searchTV(m.otherName || '');
        const mSlug = searchTV(m.slug || '');

        let score = 0;
        if (mOther === cleanKw || mName === cleanKw || mSlug === cleanKw) {
            score += 1000;
        } else if (mOther.startsWith(cleanKw) || mName.startsWith(cleanKw)) {
            score += 500;
        } else if (mOther.includes(cleanKw) || mName.includes(cleanKw) || mSlug.includes(cleanKw)) {
            score += 300;
        }

        if (score > highestScore) {
            highestScore = score;
            bestMovie = m;
        }
    }

    return highestScore >= 300 ? bestMovie : null;
};

/**
 * Lấy thông tin gói cước và trạng thái miễn phí/có phí của phim
 */
export const getMoviePlanInfo = (movie, plans = []) => {
    const freePlan = (plans || []).find(p => Number(p.level) === 0 || String(p.name || '').trim().toLowerCase() === 'free');
    const defaultFreeName = freePlan?.name || 'Free';
    const defaultFreeLevel = Number(freePlan?.level) || 0;

    if (!movie?.planID) {
        return { isFree: true, planName: defaultFreeName, level: defaultFreeLevel };
    }
    const plan = (plans || []).find(p => String(p.id) === String(movie.planID));
    if (!plan || Number(plan.level) === 0 || String(plan.name || '').trim().toLowerCase() === 'free') {
        return { isFree: true, planName: plan?.name || defaultFreeName, level: Number(plan?.level) || defaultFreeLevel };
    }
    return { isFree: false, planName: plan.name || 'VIP', level: Number(plan.level) || 1 };
};

/**
 * Trích xuất thứ tự phần / mùa phim (Season 1, Phần 4, Movie...) để sắp xếp tự nhiên theo franchise
 */
export const extractPartOrder = (movie) => {
    const title = `${movie.otherName || ''} ${movie.name || ''} ${movie.slug || ''}`.toLowerCase();
    
    // Tìm các mẫu như "(Phần 4)", "Phần 2", "Season 3", "SS4", "P4"
    const partMatch = title.match(/(?:phan|season|ss|p\.?)\s*(\d+)/i);
    if (partMatch) {
        return Number(partMatch[1]);
    }
    // Nếu là movie, ngoại truyện, OVA -> cho đứng sau các phần chính
    if (/(?:movie|dien anh|chieu rap|special|ova|ngoai truyen)/i.test(title)) {
        return 990;
    }
    // Nếu không ghi phần (thường là Phần 1 ban đầu)
    const year = Number(movie.releaseYear || movie.year || 0);
    return year > 0 ? (year / 10000) : 1;
};

/**
 * Phân tích và nhóm các phim theo Series / Franchise (như Đội Đặc Nhiệm SEAL, Cánh Buồm Đen, Slime...)
 * để biết chính xác bộ phim nào có nhiều phần nhất trong hệ thống.
 */
export const getFranchiseStats = (movies = []) => {
    const franchiseMap = new Map();

    for (const m of movies) {
        const rawTitle = (m.otherName || m.name || '').trim();
        if (!rawTitle) continue;

        // Bóc tách tên gốc của franchise bằng cách loại bỏ các ký hiệu phần/season
        const baseTitle = rawTitle
            .replace(/\s*[\(\[\{]?(?:Phần|Season|SS|Mùa|P\.?)\s*\d+[\)\]\}]?/gi, '')
            .replace(/\s*-\s*(?:Phần|Season|SS|Mùa|P\.?)\s*\d+/gi, '')
            .replace(/:\s*(?:Phần|Season|SS|Mùa|P\.?)\s*\d+/gi, '')
            .replace(/\s*[\(\[\{](?:Season|Phần)\s*\d+[\)\]\}]/gi, '')
            .trim();

        const baseKey = searchTV(baseTitle);
        if (!baseKey || baseKey.length < 2) continue;

        if (!franchiseMap.has(baseKey)) {
            franchiseMap.set(baseKey, {
                baseName: baseTitle,
                key: baseKey,
                movies: []
            });
        }
        franchiseMap.get(baseKey).movies.push(m);
    }

    const franchises = Array.from(franchiseMap.values()).map(f => {
        f.movies.sort((a, b) => extractPartOrder(a) - extractPartOrder(b));
        f.totalParts = f.movies.length;
        return f;
    });

    franchises.sort((a, b) => b.totalParts - a.totalParts);
    return franchises;
};

/**
 * Xây dựng danh mục phim tóm tắt cho prompt để AI luôn biết chính xác phim & nhân vật nào có trong website
 */
export const buildMovieCatalogSummary = (movies = [], categories = [], plans = [], characters = []) => {
    if (!movies || movies.length === 0) return "Chưa có phim nào trong hệ thống.";
    
    // Top 25 phim tiêu biểu nhất
    const sorted = [...movies].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    const sampleMovies = sorted.slice(0, 25).map(m => {
        const planInfo = getMoviePlanInfo(m, plans);
        const catNames = (m.listCategory || [])
            .map(catId => categories.find(c => String(c.id) === String(catId))?.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(', ') || 'Chung';
        const title = m.otherName || m.name || 'Không rõ';
        const slug = m.slug || m.id;
        const epStr = m.endEpisode ? `${m.endEpisode} tập` : '1 tập';
        const country = m.countriesID || m.country || 'Khác';
        return `- [${slug}] "${title}" | QG: ${country} | [Gói ${planInfo.planName} L${planInfo.level}] | ${epStr} | ${catNames}`;
    }).join('\n');

    // Thống kê các series nhiều phần nhất thực tế trên MFILM
    const franchises = getFranchiseStats(movies);
    const topFranchises = franchises.slice(0, 5).filter(f => f.totalParts > 1).map(f => {
        return `- Series "${f.baseName}": Có ${f.totalParts} phần (${f.movies.map(m => m.otherName || m.name).join(', ')})`;
    }).join('\n');

    return `${sampleMovies}\n\n[TOP SERIES NHIỀU PHẦN NHẤT TRÊN MFILM]:\n${topFranchises || 'Chưa có series nhiều phần'}`;
};

/**
 * Xây dựng prompt huấn luyện AI và nạp ngữ cảnh trang phim đang xem + thông tin gói cước người dùng
 */
export const buildSystemInstruction = ({ 
    movies = [], 
    currentMovie, 
    authors = [], 
    actors = [], 
    characters = [], 
    categories = [], 
    allComments = [], 
    allReviews = [],
    allEpisodes = [],
    plans = [],
    isLogin = null,
    userPlanInfo = { name: 'FREE', level: 0 }
}) => {
    const totalMovies = movies?.length || 0;
    const freeMoviesCount = (movies || []).filter(m => getMoviePlanInfo(m, plans).isFree).length;
    const paidMoviesCount = totalMovies - freeMoviesCount;
    const totalEpisodes = (allEpisodes && allEpisodes.length > 0)
        ? allEpisodes.length
        : (movies || []).reduce((sum, m) => sum + (Number(m.endEpisode) || Number(m.totalEpisodes) || 1), 0);

    const sortedPlans = [...(plans || [])].sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));
    const planBreakdown = sortedPlans.map(p => {
        const isFree = Number(p.level) === 0 || String(p.name || '').trim().toLowerCase() === 'free';
        const count = (movies || []).filter(m => String(m.planID) === String(p.id) || (!m.planID && isFree)).length;
        return `- Gói **${p.name} (Level ${p.level || 0})**: ${count} phim`;
    }).join('\n');

    const movieCatalog = buildMovieCatalogSummary(movies, categories, plans, characters);
    const allCategoriesList = (categories || []).map(c => c.name).filter(Boolean).join(', ');

    let currentMovieContext = "";
    if (currentMovie) {
        const planInfo = getMoviePlanInfo(currentMovie, plans);
        currentMovieContext = `\n\n[PHIM ĐANG XEM]:
- Tên: "${currentMovie.otherName || currentMovie.name}" (Slug: ${currentMovie.slug || currentMovie.id})
- Phí: Gói ${planInfo.planName} (Level ${planInfo.level})
- Số tập: ${currentMovie.endEpisode || 1} tập | Trạng thái: ${currentMovie.status || 'Đang chiếu'}`;
    }

    const userName = isLogin ? (isLogin.name || 'Người dùng') : 'Khách';
    const planName = userPlanInfo?.name || 'FREE';
    const planLevel = Number(userPlanInfo?.level) || 0;
    const userContext = `\n\n[USER]: ${userName} | Gói: **${planName}** (Level ${planLevel})${planLevel > 0 ? ' - Đã đăng ký gói VIP' : ' - Gói Free'}`;

    return `Bạn là trợ lý AI thông minh, thân thiện của website xem phim MFILM.
LUÔN TRẢ LỜI BẰNG TIẾNG VIỆT 100%.

QUY TẮC CỐT LÕI & NGUYÊN TẮC ỨNG BIẾN LINH HOẠT:
1. TÙY CƠ ỨNG BIẾN THEO MỤC ĐÍCH CÂU CHUYỆN (KHÔNG MÁY MÓC SPAM 5 PHIM):
   - KHI TRÒ CHUYỆN THÔNG THƯỜNG / CHÀO HỎI / HỎI THĂM / TÁN GẪU: Trả lời tự nhiên, hóm hỉnh, vui vẻ như một người bạn thân. TUYỆT ĐỐI KHÔNG tự tiện chèn danh sách 5 phim hay card phim nếu người dùng không yêu cầu.
   - KHI NGƯỜI DÙNG HỎI CÂU HỎI ĐƠN LẺ / THÔNG TIN CỤ THỂ (ví dụ: "phim nào nhiều phần nhất?", "phim này ai đóng?", "nội dung phim X", "phim này chiếu năm nào?"):
     + Hãy trả lời trực tiếp, chính xác thông tin bộ phim đó. Đi thẳng vào vấn đề, ngắn gọn, súc tích.
   - KHI TÌM KIẾM MỘT PHIM HOẶC MỘT SERIES CỤ THỂ (ví dụ: "có phim đặc nhiệm không?", "tìm phim slime", "naruto"):
     + CHỈ hiển thị đúng các phần của bộ phim/series đó mà tool \`tra_cuu_phim\` trả về. KHÔNG chèn thêm các phim ngẫu nhiên khác.
   - CHỈ HIỂN THỊ DANH SÁCH GỢI Ý 5 PHIM KHI người dùng thật sự yêu cầu danh sách / xin gợi ý phim (ví dụ: "gợi ý vài phim hay", "top phim kinh dị", "phim hot hiện nay").

2. DUY TRÌ ĐÚNG CHỦ ĐỀ & NGỮ CẢNH HỘI THOẠI (CONTEXT CONTINUITY):
   - KHI ĐANG NÓI VỀ THỂ LOẠI / CHỦ ĐỀ / QUỐC GIA / GÓI CƯỚC / DIỄN VIÊN:
     + Nếu người dùng nói: "không có cái nào hay à", "cái khác đi", "cho thể loại khác", "còn thể loại nào nữa không", "đổi thể loại khác", "thể loại khác", "chủ đề khác":
       * BẮT BUỘC hiểu là người dùng đang muốn XEM THÊM CÁC THỂ LOẠI / CHỦ ĐỀ KHÁC có trên MFILM (như Anime, Hoạt hình, Phim lẻ, Phim bộ, Phim chiếu rạp, Cổ trang, Võ thuật, Tình cảm, Phiêu lưu, Học đường, Gia đình, Thể thao, Âm nhạc...).
       * BẮT BUỘC liệt kê tiếp các thể loại / chủ đề khác chưa được nhắc đến.
       * TUYỆT ĐỐI KHÔNG tự tiện gọi tool tra cứu và hiển thị danh sách phim khi người dùng chưa chọn thể loại hoặc chưa yêu cầu xem phim!
   - CHỈ HIỂU LÀ ĐỔI PHIM / CHÊ PHIM KHI:
     + Tin nhắn trước đó AI ĐANG GIỚI THIỆU DANH SÁCH PHIM hoặc 1 BỘ PHIM CỤ THỂ, và người dùng chê bộ phim đó. Lúc này mới gọi tool \`tra_cuu_phim\` với \`xem_tiep=true\` để đổi sang bộ phim khác.

3. XỬ LÝ LỖI CHÍNH TẢ / TỪ KHÓA LẠ / GÕ SAI:
   - Khi người dùng gõ từ khóa có thể bị lỗi Telex (ví dụ: "đặc nhimeej", "dặc nhiệm", "narutoo", "jhoong có cái nào hay"): BẮT BUỘC hiểu đúng nghĩa tiếng Việt và nếu là tên phim lạ thì gọi tool \`tra_cuu_phim\` để tìm kiếm gần đúng.
   - NẾU TOOL BÁO KHÔNG TÌM THẤY: Hãy lịch sự và hỏi lại người dùng để làm rõ (ví dụ: "Hiện tại trên MFILM chưa có phim tên '[tên gõ]', có phải bạn đang tìm series hành động **'Đội Đặc Nhiệm SEAL'** không nè? 🍿").
   - TUYỆT ĐỐI KHÔNG tự chế hoặc lấy bừa các phim hoàn toàn không liên quan.

4. XỬ LÝ PHIM CÓ NHIỀU PHẦN/MÙA (FRANCHISE):
   - Trên hệ thống MFILM, mỗi phần/mùa (Phần 1, Phần 2, Phần 3... Season 1, Season 2...) được lưu thành 1 BỘ PHIM RIÊNG BIỆT.
   - Khi người dùng hỏi series hoặc hỏi "phim nào nhiều phần nhất", BẮT BUỘC gọi tool \`tra_cuu_phim\` với \`sap_xep='nhieu_phan_nhat'\` để lấy số liệu thực tế chính xác (ví dụ: series **Đội Đặc Nhiệm SEAL** có 7 phần: Season 1 đến Season 7).

5. THỐNG KÊ MFILM: Tổng số phim: ${totalMovies} (Free: ${freeMoviesCount}, Có phí: ${paidMoviesCount}). Tổng số tập phim toàn web: ${totalEpisodes} tập.
${planBreakdown}
6. GÓI CỦA USER & QUYỀN TRUY CẬP: Người dùng đang sở hữu gói **${planName}** (Level ${planLevel}). Ưu tiên gợi ý phim xem được. Nếu người dùng muốn tìm phim gói cao hơn hoặc thuê phim, hãy tìm và cung cấp thông tin cho họ.
7. GIAO TIẾP TỰ NHIÊN, NGẮN GỌN, DỄ HIỂU:
   - Trả lời ngắn gọn, súc tích, đi thẳng vào câu trả lời, dùng emoji nhẹ nhàng 🍿🎬.
   - TUYỆT ĐỐI KHÔNG nói dài dòng, TUYỆT ĐỐI KHÔNG lặp đi lặp lại những câu giải thích rườm rà trong ngoặc đơn (như "(Bạn đang dùng gói Free, nên phim này hiện chưa thể xem được. Bạn có thể nâng cấp...)").
   - Khi giới thiệu phim: Chỉ cần tên phim, số tập, thể loại ngắn gọn (1 dòng).
   - TUYỆT ĐỐI KHÔNG dùng bảng markdown (|). Khi liệt kê dùng dấu gạch ngang "-" duy nhất. Dùng cú pháp [Tên Phim](/phim/slug-chinh-xac).
8. ĐIỀU KHIỂN WEB: Dùng tool \`dieu_khien_website\` khi người dùng yêu cầu mở phim, tìm kiếm, đăng nhập hoặc nâng cấp VIP.
9. QUY TẮC BẢO ĐẢM ĐÚNG QUỐC GIA & NGỮ CẢNH HỘI THOẠI:
   - Khi đang trò chuyện về một quốc gia (ví dụ: Việt Nam, Trung Quốc, Nhật Bản...) mà người dùng hỏi tiếp về gói cước ("còn loại xịn nhất thì sao", "gói VIP thì sao", "phim có phí"): BẮT BUỘC duy trì ngữ cảnh quốc gia đó khi tra cứu.
   - NẾU TRÊN MFILM CHƯA CÓ PHIM CỦA QUỐC GIA ĐÓ THUỘC GÓI ĐƯỢC HỎI (ví dụ: chưa có phim Việt Nam nào thuộc gói Premium):
     + BẮT BUỘC NÓI THẲNG: "Hiện tại trên MFILM chưa có phim Việt Nam nào thuộc gói Premium."
     + TUYỆT ĐỐI KHÔNG BAO GIỜ lấy phim Nhật Bản / nước khác rồi gọi đó là "Phim Việt Nam xịn nhất"!
     + Nếu muốn gợi ý phim nước khác: Phải nói rõ ràng "Nhưng MFILM đang có các phim Nhật Bản gói Premium như [Tên Phim], bạn có muốn xem thử không nè?".
10. QUY TẮC TRA CỨU THEO GÓI CƯỚC (PREMIUM / XỊN NHẤT, PLUS, BASIC, FREE):
    - Khi người dùng hỏi về gói cước bằng bất kỳ từ ngữ nào (ví dụ: "gói xịn nhất", "gói cao nhất", "phim VIP", "phim Premium", "gói Plus", "gói Basic", "phim Free"):
      + BẮT BUỘC gọi tool \`tra_cuu_phim\` với tham số \`loai_phi='premium'\` (khi hỏi gói xịn nhất/Premium/VIP), \`loai_phi='plus'\`, \`loai_phi='basic'\`, hoặc \`loai_phi='free'\`.
      + Nếu có kèm quốc gia (ví dụ: "phim VN gói xịn nhất"), truyền thêm \`quoc_gia='Việt Nam'\`.
      + BẮT BUỘC hiển thị theo ĐÚNG danh sách phim do tool \`tra_cuu_phim\` trả về. TUYỆT ĐỐI KHÔNG tự trả lời bằng trí nhớ hay tự bịa số lượng phim!

[DANH SÁCH TẤT CẢ THỂ LOẠI & CHỦ ĐỀ TRÊN MFILM]:
${allCategoriesList || 'Hành động, Hài, Giả tưởng, Chính kịch, Kinh dị, Khoa học, Kỳ ảo, Tâm lý, Viễn tưởng, Phiêu lưu, Hoạt hình, Anime, Võ thuật, Cổ trang, Tình cảm, Học đường, Gia đình, Thể thao, Âm nhạc, Chiếu rạp, Phim bộ, Phim lẻ'}

[DANH SÁCH PHIM TIÊU BIỂU TRÊN MFILM]:
${movieCatalog}${currentMovieContext}${userContext}`;
};

/**
 * Xử lý điều khiển giao diện website
 */
export const executeWebsiteControl = ({ args = {}, movies = [], characters = [], actors = [], authors = [], navigate }) => {
    let replyText = "Đã thực hiện yêu cầu của bạn!";

    if (args.action === 'navigate' && args.path) {
        navigate(args.path);
        replyText = "Đã chuyển trang theo yêu cầu của bạn!";
    } else if (args.action === 'open_vip' || args.action === 'upgrade_vip') {
        navigate('/upgrade');
        replyText = "Đã chuyển đến trang nâng cấp gói VIP cho bạn!";
    } else if (args.action === 'open_movie' && (args.movieSlug || args.searchQuery)) {
        const rawQuery = args.movieSlug || args.searchQuery;
        const targetMovie = findTargetMovie(rawQuery, movies, characters, actors, authors);
        if (targetMovie) {
            const finalSlug = targetMovie.slug || targetMovie.id;
            const movieTitle = targetMovie.otherName || targetMovie.name;
            if (args.episode) {
                navigate(`/xem-phim/${finalSlug}?tap=${args.episode}`);
                replyText = `Đã mở tập ${args.episode} của phim **${movieTitle}** cho bạn!`;
            } else {
                navigate(`/phim/${finalSlug}`);
                replyText = `Đã mở trang chi tiết phim **${movieTitle}** cho bạn!`;
            }
        } else {
            const cleanSearch = searchTV(rawQuery);
            window.dispatchEvent(new CustomEvent('OPEN_SEARCH', { detail: cleanSearch }));
            replyText = `Đã tìm kiếm từ khóa "${cleanSearch}" cho bạn!`;
        }
    } else if (args.action === 'search' && args.searchQuery) {
        const cleanSearch = searchTV(args.searchQuery);
        window.dispatchEvent(new CustomEvent('OPEN_SEARCH', { detail: cleanSearch }));
        replyText = `Đã mở tìm kiếm với từ khóa: ${cleanSearch}`;
    } else if (args.action === 'open_login') {
        window.dispatchEvent(new CustomEvent('OPEN_LOGIN'));
        replyText = "Đã mở cửa sổ đăng nhập!";
    } else if (args.action === 'open_register') {
        window.dispatchEvent(new CustomEvent('OPEN_REGISTER'));
        replyText = "Đã mở cửa sổ đăng ký!";
    }

    return replyText;
};

/**
 * Xử lý tra cứu dữ liệu phim khi AI gọi tool tra_cuu_phim
 */
export const executeMovieLookup = ({ 
    args = {}, 
    movies = [], 
    authors = [], 
    actors = [], 
    characters = [], 
    categories = [], 
    plans = [],
    userPlanInfo = { name: 'FREE', level: 0 },
    excludeSlugs = [],
    rawUserQuery = ''
}) => {
    let filtered = [...movies];

    const cleanUserQuery = searchTV(rawUserQuery || args.tu_khoa || '');
    const isPagingNext = Boolean(
        args.xem_tiep || 
        args.loai_tru_phim_da_xem || 
        /\b(tiep|tiep tuc|them|nua|con nua khong|con khong|xem tiep|goi y tiep|khac|phim khac|5 phim nua|che|che nha|che phim|che phim nay|khong thich|khong muon xem|bo qua|doi phim|doi phim khac|next|chan|do ec)\b/i.test(cleanUserQuery)
    );

    const slugsToExclude = new Set(
        (Array.isArray(excludeSlugs) ? excludeSlugs : []).map(s => String(s).toLowerCase().trim())
    );

    // Nếu người dùng yêu cầu xem tiếp / thêm phim khác / từ chối chê phim vừa gợi ý, loại trừ các phim đã từng xuất hiện
    if (slugsToExclude.size > 0 && isPagingNext) {
        filtered = filtered.filter(m => {
            const mSlug = String(m.slug || '').toLowerCase().trim();
            const mId = String(m.id || '').toLowerCase().trim();
            return !slugsToExclude.has(mSlug) && !slugsToExclude.has(mId);
        });
    }

    // 2. Nhận diện gói cước từ args.loai_phi HOẶC args.tu_khoa HOẶC rawUserQuery
    let requestedPlan = null;
    if (args.loai_phi) {
        requestedPlan = detectPlanInQuery(args.loai_phi);
    }
    if (!requestedPlan) {
        requestedPlan = detectPlanInQuery(args.tu_khoa) || detectPlanInQuery(rawUserQuery);
    }

    // Lọc theo gói cước
    if (args.loai_phi === 'user_plan' || args.phu_hop_goi_user) {
        const userLevel = Number(userPlanInfo?.level) || 0;
        filtered = filtered.filter(m => {
            const planInfo = getMoviePlanInfo(m, plans);
            return planInfo.level <= userLevel;
        });
    } else if (requestedPlan && requestedPlan.targetLevel !== null && requestedPlan.targetLevel !== undefined) {
        // Lọc CHÍNH XÁC gói cước được yêu cầu (ví dụ: chỉ lấy gói Plus Level 2, hoặc chỉ lấy gói Premium Level 3...)
        filtered = filtered.filter(m => {
            const planInfo = getMoviePlanInfo(m, plans);
            return planInfo.level === requestedPlan.targetLevel;
        });
    } else if (requestedPlan?.isPaid || args.loai_phi === 'paid' || args.is_free === false || args.mien_phi === false) {
        filtered = filtered.filter(m => !getMoviePlanInfo(m, plans).isFree);
    } else if (requestedPlan?.isFree || args.loai_phi === 'free' || args.is_free === true || args.mien_phi === true) {
        filtered = filtered.filter(m => getMoviePlanInfo(m, plans).isFree);
    }

    // Lọc theo thể loại nếu có
    if (args.the_loai) {
        const cleanCat = searchTV(args.the_loai).trim();
        const matchedCats = categories.filter(c => {
            const cName = searchTV(c.name || '').trim();
            return cName.includes(cleanCat) || cleanCat.includes(cName);
        });
        const matchedCatIds = matchedCats.map(c => String(c.id));
        
        if (matchedCatIds.length > 0) {
            filtered = filtered.filter(m => {
                const list = m.listCategory || [];
                return list.some(catId => matchedCatIds.includes(String(catId)));
            });
        }
    }

    // 1. Nhận diện quốc gia từ args.quoc_gia HOẶC từ args.tu_khoa HOẶC từ rawUserQuery
    let targetCountryKey = null;
    if (args.quoc_gia) {
        targetCountryKey = detectCountryInQuery(args.quoc_gia) || searchTV(args.quoc_gia).trim();
    }
    if (!targetCountryKey) {
        targetCountryKey = detectCountryInQuery(args.tu_khoa) || detectCountryInQuery(rawUserQuery);
    }

    if (targetCountryKey) {
        filtered = filtered.filter(m => isMovieMatchCountry(m, targetCountryKey));
    }

    // Danh sách từ khóa tìm kiếm: tu_khoa, nhan_vat, dien_vien, tac_gia
    const searchTerms = [
        args.tu_khoa,
        args.nhan_vat,
        args.dien_vien,
        args.tac_gia
    ].filter(Boolean);

    const GENERIC_RECOMMEND_INTENTS = new Set([
        'hay', 'hot', 'moi', 'top', 'de xuat', 'goi y', 'phim hay', 'phim hot', 'phim moi', 
        'thinh hanh', 'xem nhieu', 'xem gi', 'chieu rap', 'phim', 'bo phim', 'phim gi',
        'goi hien tai', 'goi cua toi', 'phu hop voi goi', 'phu hop voi goi hien tai',
        'xin', 'xin nhat', 'cao nhat', 'dat nhat', 'tot nhat', 'loai xin', 'loai xin nhat',
        'tiep', 'tiep tuc', 'them', 'nua', 'con nua khong', 'con khong', 'xem tiep',
        'che', 'che nha', 'che phim', 'che phim nay', 'khong thich', 'khong muon xem', 'bo qua', 'doi phim', 'doi phim khac', 'next', 'chan', 'do ec',
        'nhieu tap nhat', 'dai tap nhat', 'dai nhat', 'nhieu tap', 'so tap nhieu nhat',
        'it tap nhat', 'ngan tap nhat', 'ngan nhat', 'it tap', 'so tap it nhat',
        'moi nhat', 'cu nhat', 'xem nhieu nhat', 'hot nhat', 'nhieu view nhat', 'top view'
    ]);

    // Nhận diện các ý định sắp xếp đặc biệt
    const isMostParts = /\b(nhieu phan nhat|nhieu season nhat|nhieu ss nhat|nhieu mua nhat|dai tap nhat ve phan|series nhieu phan nhat|phim nhieu phan nhat|bo nao nhieu phan nhat|phim nao nhieu phan nhat|bo phim nao nhieu phan nhat)\b/i.test(cleanUserQuery) || args.sap_xep === 'nhieu_phan_nhat';
    const isMostEpisodes = /\b(nhieu tap nhat|dai tap nhat|so tap nhieu nhat|nhieu tap|dai tap|dai nhat|nhieu tap nhat web|nhieu tap nhat he thong)\b/i.test(cleanUserQuery) || args.sap_xep === 'nhieu_tap_nhat';
    const isLeastEpisodes = /\b(it tap nhat|ngan tap nhat|ngan nhat|it tap|so tap it nhat)\b/i.test(cleanUserQuery) || args.sap_xep === 'it_tap_nhat';
    const isNewest = /\b(moi nhat|moi ra|moi phat hanh|nam moi nhat)\b/i.test(cleanUserQuery) || args.sap_xep === 'moi_nhat';
    const isOldest = /\b(cu nhat|lau doi nhat|xua nhat|nam cu nhat)\b/i.test(cleanUserQuery) || args.sap_xep === 'cu_nhat';
    const isMostViewed = /\b(xem nhieu nhat|nhieu view nhat|hot nhat|top view|thinh hanh nhat)\b/i.test(cleanUserQuery) || args.sap_xep === 'xem_nhieu_nhat';

    // Xử lý riêng khi người dùng hỏi bộ phim/series nào có nhiều phần nhất
    if (isMostParts) {
        const franchises = getFranchiseStats(movies);
        if (franchises.length > 0) {
            const topFranchise = franchises[0];
            const partsList = topFranchise.movies.map((m, idx) => {
                const epStr = m.endEpisode ? `${m.endEpisode} tập` : '1 tập';
                const planInfo = getMoviePlanInfo(m, plans);
                return `- Phần ${idx + 1}: [${m.otherName || m.name}](/phim/${m.slug || m.id}) | ${epStr} | Gói ${planInfo.planName} (Level ${planInfo.level})`;
            }).join('\n');

            return `Bộ phim hiện có nhiều phần nhất trên hệ thống MFILM là series **"${topFranchise.baseName}"** với tổng cộng **${topFranchise.totalParts} phần**:\n${partsList}`;
        }
    }

    // Nhận diện câu hỏi đơn lẻ (không phải yêu cầu danh sách gợi ý phim)
    const isSingleQuestion = (
        /\b(phim nao|bo nao|cai nao|ai la|co phai|la gi|bao nhieu tap|may tap|chieu nam nao|dao dien la ai)\b/i.test(cleanUserQuery) &&
        !/\b(top|danh sach|goi y|cac phim|nhung phim|nhieu phim)\b/i.test(cleanUserQuery)
    );

    let isSpecificSearch = false;

    for (const rawKw of searchTerms) {
        let cleanKw = searchTV(rawKw)
            .replace(/\b(co phim|tim phim|phim|bo phim|xem phim|hoat hinh|anime|co|khong|k|ko|chua|nao|nhe|nhi|a|ha|voi|ve|cho toi|giup toi|che|che nha|che phim|che phim nay|khong thich|khong muon xem|bo qua|doi phim|doi phim khac|next|chan|do ec)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanKw || GENERIC_RECOMMEND_INTENTS.has(cleanKw)) {
            continue;
        }

        // Bỏ qua nếu từ khóa tìm kiếm chính là tên quốc gia (đã được lọc ở bước nhận diện quốc gia)
        if (detectCountryInQuery(cleanKw)) {
            continue;
        }

        // Bỏ qua nếu từ khóa tìm kiếm chính là tên gói cước (đã được lọc ở bước nhận diện gói cước)
        if (detectPlanInQuery(cleanKw)) {
            continue;
        }

        // Bỏ qua các từ chỉ tiêu chí sắp xếp để không nhầm sang tìm tên phim
        if (isMostEpisodes || isLeastEpisodes || isNewest || isOldest || isMostViewed || isMostParts) {
            cleanKw = cleanKw
                .replace(/\b(nhieu phan nhat|nhieu season nhat|nhieu tap nhat|dai tap nhat|so tap nhieu nhat|nhieu tap|dai tap|dai nhat|it tap nhat|ngan tap nhat|ngan nhat|it tap|moi nhat|cu nhat|xem nhieu nhat|hot nhat|nhieu view nhat|top view|nhat|nhieu|it|moi|cu)\b/gi, ' ')
                .trim();
            if (!cleanKw) continue;
        }

        if (['premium', 'prenium', 'vip', 'basic', 'plus', 'co phi', 'tra phi'].includes(cleanKw)) {
            filtered = filtered.filter(m => !getMoviePlanInfo(m, plans).isFree);
            continue;
        } else if (['free', 'mien phi'].includes(cleanKw)) {
            filtered = filtered.filter(m => getMoviePlanInfo(m, plans).isFree);
            continue;
        } else if (cleanKw.includes('goi cua toi') || cleanKw.includes('phu hop voi goi')) {
            const userLevel = Number(userPlanInfo?.level) || 0;
            filtered = filtered.filter(m => getMoviePlanInfo(m, plans).level <= userLevel);
            continue;
        }

        isSpecificSearch = true;
        const kwTokens = cleanKw.split(/\s+/).filter(t => t.length >= 2 && !STOP_WORDS.has(t));

        // Chấm điểm từng bộ phim theo độ liên quan chính xác
        const scoredMovies = [];

        for (const m of filtered) {
            const mName = searchTV(m.name || '');
            const mOther = searchTV(m.otherName || '');
            const mSlug = searchTV(m.slug || '');
            const mDesc = searchTV(m.description || '');

            const mCharIds = m.character || m.characters || m.listCharacter || [];
            const charNames = characters.filter(c => mCharIds.includes(c.id) || (typeof c === 'object' && mCharIds.includes(c))).map(c => searchTV(c.name || ''));

            const mActorIds = m.actor || m.actors || m.listActor || [];
            const actorNames = actors.filter(a => mActorIds.includes(a.id) || (typeof a === 'object' && mActorIds.includes(a))).map(a => searchTV(a.name || ''));

            const mAuthorIds = m.listAuthor || (m.author ? [m.author] : []);
            const authorNames = authors.filter(a => mAuthorIds.includes(a.id) || m.author === a.id).map(a => searchTV(a.name || ''));

            let score = 0;

            // 1. Khớp cụm từ khóa nguyên vẹn trong Tiêu đề (Ưu tiên tuyệt đối cao nhất)
            if (mOther.includes(cleanKw) || mName.includes(cleanKw) || mSlug.includes(cleanKw)) {
                score += 1000;
            }

            // 2. Khớp từng token trong Tiêu đề
            let matchedTokensCount = 0;
            for (const token of kwTokens) {
                if (mOther.includes(token) || mName.includes(token) || mSlug.includes(token)) {
                    score += 200;
                    matchedTokensCount++;
                }
            }

            // Nếu khớp toàn bộ các từ của cụm tìm kiếm trong tiêu đề
            if (kwTokens.length > 1 && matchedTokensCount === kwTokens.length) {
                score += 600;
            }

            // 3. Khớp nhân vật
            if (charNames.some(c => c.includes(cleanKw) || kwTokens.some(t => t.length >= 3 && c.includes(t)))) {
                score += 800;
            }

            // 4. Khớp diễn viên / tác giả
            if (actorNames.some(a => a.includes(cleanKw)) || authorNames.some(au => au.includes(cleanKw))) {
                score += 600;
            }

            // 5. Khớp trong mô tả chỉ khi từ khóa dài và khớp trọn vẹn
            if (cleanKw.length >= 4 && mDesc.includes(cleanKw)) {
                score += 100;
            }

            if (score > 0) {
                scoredMovies.push({
                    movie: m,
                    score,
                    partOrder: extractPartOrder(m)
                });
            }
        }

        // Chỉ giữ lại những phim THỰC SỰ có điểm liên quan
        if (scoredMovies.length > 0) {
            scoredMovies.sort((a, b) => {
                if (Math.abs(a.score - b.score) <= 300) {
                    return a.partOrder - b.partOrder;
                }
                return b.score - a.score;
            });
            filtered = scoredMovies.map(item => item.movie);
        } else {
            filtered = [];
        }
    }

    // Sắp xếp danh sách phim theo tiêu chí
    if (isMostEpisodes) {
        filtered.sort((a, b) => {
            const epA = Number(a.endEpisode) || Number(a.totalEpisodes) || 1;
            const epB = Number(b.endEpisode) || Number(b.totalEpisodes) || 1;
            return epB - epA;
        });
    } else if (isLeastEpisodes) {
        filtered.sort((a, b) => {
            const epA = Number(a.endEpisode) || Number(a.totalEpisodes) || 1;
            const epB = Number(b.endEpisode) || Number(b.totalEpisodes) || 1;
            return epA - epB;
        });
    } else if (isNewest) {
        filtered.sort((a, b) => (Number(b.releaseYear || b.year) || 0) - (Number(a.releaseYear || a.year) || 0));
    } else if (isOldest) {
        filtered.sort((a, b) => (Number(a.releaseYear || a.year) || 9999) - (Number(b.releaseYear || b.year) || 9999));
    } else if (requestedPlan && requestedPlan.targetLevel !== null && requestedPlan.targetLevel !== undefined) {
        // Ưu tiên cao nhất: các bộ phim thuộc ĐÚNG CHÍNH XÁC gói cước được yêu cầu (ví dụ: Level 3 Premium lên đầu)
        const targetLevel = requestedPlan.targetLevel;
        filtered.sort((a, b) => {
            const planA = getMoviePlanInfo(a, plans);
            const planB = getMoviePlanInfo(b, plans);
            
            const isExactA = planA.level === targetLevel;
            const isExactB = planB.level === targetLevel;
            
            if (isExactA && !isExactB) return -1;
            if (!isExactA && isExactB) return 1;
            
            // Nếu không phải gói yêu cầu, xếp theo cấp độ giảm dần (Level 3 -> Level 2 -> Level 1)
            if (planB.level !== planA.level) {
                return planB.level - planA.level;
            }
            
            return (Number(b.views) || 0) - (Number(a.views) || 0);
        });
    } else if (requestedPlan?.isPaid) {
        // Yêu cầu phim có phí chung chung: xếp theo gói cao xuống thấp (Premium -> Plus -> Basic)
        filtered.sort((a, b) => {
            const planA = getMoviePlanInfo(a, plans);
            const planB = getMoviePlanInfo(b, plans);
            if (planB.level !== planA.level) {
                return planB.level - planA.level;
            }
            return (Number(b.views) || 0) - (Number(a.views) || 0);
        });
    } else if (!isSpecificSearch) {
        filtered.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    }

    // Tính toán số lượng cần lấy:
    let requestedLimit = null;
    if (args.so_luong && Number(args.so_luong) > 0) {
        requestedLimit = Number(args.so_luong);
    } else {
        const countMatch = cleanUserQuery.match(/(?:top|goi y|cho|lay|xem|danh sach|tim)?\s*(\d+)\s*(?:phim|bo phim|bo|anime|series)/i)
            || cleanUserQuery.match(/(\d+)\s*(?:phim|bo phim|bo|anime|series)/i)
            || cleanUserQuery.match(/top\s*(\d+)/i);
        if (countMatch && Number(countMatch[1]) > 0) {
            requestedLimit = Number(countMatch[1]);
        }
    }

    // Xác định số lượng phản hồi
    let limit = 5;
    if (isSingleQuestion && !requestedLimit) {
        limit = 1;
    } else if (requestedLimit && requestedLimit > 0 && requestedLimit <= 5) {
        limit = requestedLimit;
    } else if (isSpecificSearch && !requestedLimit) {
        limit = Math.min(filtered.length, 5);
    }

    const resultList = filtered.slice(0, limit);

    if (resultList.length === 0) {
        if (slugsToExclude.size > 0 && isPagingNext) {
            return "Đã hiển thị hết tất cả các bộ phim phù hợp với tiêu chí này trên MFILM rồi bạn nhé! Bạn có thể thử tìm kiếm theo thể loại hoặc từ khóa khác.";
        }

        // Trường hợp tìm theo Quốc gia + Gói cước mà không có phim nào:
        if (targetCountryKey && requestedPlan) {
            const countryDisplayName = args.quoc_gia || (targetCountryKey === 'viet nam' ? 'Việt Nam' : targetCountryKey === 'nhat ban' ? 'Nhật Bản' : targetCountryKey === 'trung quoc' ? 'Trung Quốc' : targetCountryKey === 'han quoc' ? 'Hàn Quốc' : targetCountryKey === 'my' ? 'Mỹ' : targetCountryKey === 'thai lan' ? 'Thái Lan' : targetCountryKey);

            const otherCountryMoviesInPlan = movies.filter(m => {
                const p = getMoviePlanInfo(m, plans);
                return p.level === requestedPlan.targetLevel && !isMovieMatchCountry(m, targetCountryKey);
            });

            let suggestionText = "";
            if (otherCountryMoviesInPlan.length > 0) {
                const sampleTitles = otherCountryMoviesInPlan.slice(0, 3).map(m => {
                    const c = m.countriesID || m.country || 'Nước ngoài';
                    return `[${m.otherName || m.name}](/phim/${m.slug || m.id}) (Phim ${c})`;
                }).join(', ');
                suggestionText = ` Tuy nhiên MFILM có các phim gói ${requestedPlan.name} của nước khác như: ${sampleTitles}. Hãy hỏi khách xem có muốn tham khảo phim nước khác không.`;
            }

            return `THÔNG_BÁO: Hiện tại trên MFILM KHÔNG CÓ bất kỳ bộ phim ${countryDisplayName} nào thuộc gói ${requestedPlan.name}. BẮT BUỘC trả lời ngắn gọn: "Hiện tại MFILM chưa có phim ${countryDisplayName} nào thuộc gói ${requestedPlan.name} nha bạn."${suggestionText} TUYỆT ĐỐI KHÔNG gọi các phim nước khác là phim ${countryDisplayName}!`;
        }

        if (args.tu_khoa || rawUserQuery) {
            return `KHÔNG_TÌM_THẤY: Không có bộ phim nào khớp với từ khóa "${args.tu_khoa || rawUserQuery}" trên MFILM. Hãy hỏi lại người dùng thật lịch sự để làm rõ xem họ có gõ nhầm tên phim không. TUYỆT ĐỐI KHÔNG tự bịa ra phim khác.`;
        }
        return "Không tìm thấy bộ phim nào phù hợp với yêu cầu.";
    }

    const totalRemaining = Math.max(0, filtered.length - resultList.length);

    const topMatches = resultList.map((m, idx) => {
        const planInfo = getMoviePlanInfo(m, plans);
        const authNames = authors.filter(a => (m.listAuthor || []).includes(a.id) || m.author === a.id).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const mCharIds = m.character || m.characters || m.listCharacter || [];
        const charNames = characters.filter(c => mCharIds.includes(c.id)).map(c => c.name).slice(0, 5).join(', ') || 'Chưa cập nhật';
        const catNames = (m.listCategory || []).map(catId => categories.find(c => String(c.id) === String(catId))?.name).filter(Boolean).join(', ') || 'Đang cập nhật';
        const feeStr = `Gói ${planInfo.planName} (Level ${planInfo.level})`;
        const epStr = m.endEpisode ? `${m.endEpisode} tập` : '1 tập';
        const countryStr = m.countriesID || m.country || 'Chưa cập nhật';
        return `Phần/Phim ${idx + 1}: [${m.otherName || m.name}](/phim/${m.slug || m.id}) | Quốc gia: ${countryStr} | Số tập: ${epStr} | Gói xem: ${feeStr} | Thể loại: ${catNames} | Nhân vật: ${charNames} | Lượt xem: ${(Number(m.views) || 0) + 100} | Năm: ${m.releaseYear || m.year || ''}`;
    }).join('\n');

    let noteMessage = '';
    if (!isSingleQuestion) {
        if (requestedLimit && requestedLimit > 5) {
            noteMessage = ` (Do yêu cầu ${requestedLimit} phim khá dài nên mình gửi trước 5 phim, bạn có thể nhắn "tiếp" để xem thêm nhé! 🍿)`;
        } else if (totalRemaining > 0 && (isPagingNext || (requestedLimit && requestedLimit > 1) || (!isSpecificSearch && limit > 1))) {
            noteMessage = ` (còn ${totalRemaining} phim khác, bạn có thể nhắn "tiếp" để xem tiếp)`;
        }
    }

    return `Kết quả ${resultList.length} phim phù hợp${noteMessage}:\n${topMatches}`;
};

/**
 * Render Markdown: in đậm (**từ khóa** hoặc *từ khóa*)
 */
export const renderFormattedText = (text) => {
    if (!text) return null;
    const boldParts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return boldParts.map((bPart, bIdx) => {
        const doubleMatch = bPart.match(/^\*\*(.*?)\*\*$/);
        if (doubleMatch) {
            return <strong key={bIdx} className="font-bold text-black">{doubleMatch[1]}</strong>;
        }
        const singleMatch = bPart.match(/^\*(.*?)\*$/);
        if (singleMatch) {
            return <strong key={bIdx} className="font-bold text-black">{singleMatch[1]}</strong>;
        }
        const codeMatch = bPart.match(/^`(.*?)`$/);
        if (codeMatch) {
            return <span key={bIdx} className="font-semibold text-amber-900 bg-amber-100/80 px-1 py-0.5 rounded text-xs mx-0.5">{codeMatch[1]}</span>;
        }
        return bPart;
    });
};

const renderTextWithNewlines = (text) => {
    if (!text) return null;
    const rawLines = text.split('\n');
    
    // Lọc bỏ dòng phân cách bảng markdown như |---|---|
    const validLines = rawLines.filter(line => !/^\|?\s*[-:]+[-|\s:]+$/.test(line.trim()));

    return validLines.map((line, i, arr) => {
        let cleanLine = line.trim();

        // Tự động chuyển đổi bảng Markdown dạng | cột 1 | cột 2 | thành dạng chấm tròn gọn đẹp
        if (cleanLine.startsWith('|') && cleanLine.endsWith('|')) {
            const cells = cleanLine.split('|').map(c => c.trim()).filter(Boolean);
            if (cells.length > 0) {
                // Nếu là dòng tiêu đề bảng (chứa chữ "Gói", "Số phim", "STT"...)
                const isHeader = cells.some(c => /^(gói|stt|tên phim|số phim|cột|thể loại|level)/i.test(c));
                if (isHeader) {
                    cleanLine = `**${cells.join(' • ')}**`;
                } else {
                    cleanLine = `• ${cells.join(' — ')}`;
                }
            }
        } else if (cleanLine.startsWith('>')) {
            cleanLine = cleanLine.replace(/^>\s*/, '💡 ');
        }

        // Chuẩn hóa gạch đầu dòng/chấm tròn bị lặp hoặc ghép đôi (ví dụ: "- •", "• -", "- -", "* •")
        cleanLine = cleanLine
            .replace(/^[-*•\s]*[-*•]\s*[-*•]\s*/, '• ')
            .replace(/^[-*]\s+/, '• ');

        return (
            <React.Fragment key={i}>
                {renderFormattedText(cleanLine)}
                {i < arr.length - 1 && <br />}
            </React.Fragment>
        );
    });
};

/**
 * Render một dòng text đơn lẻ kèm Markdown link và in đậm
 */
const renderSingleLineText = (lineText, onLinkClick) => {
    if (!lineText) return null;
    const linkRegex = /\[([^\]]+)\]\s*\(([^)]+)\)/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(lineText)) !== null) {
        if (match.index > lastIndex) {
            elements.push(
                <React.Fragment key={`text-${lastIndex}`}>
                    {renderFormattedText(lineText.substring(lastIndex, match.index))}
                </React.Fragment>
            );
        }

        const title = match[1].trim();
        let url = match[2].trim();
        if (!url.startsWith('/') && !url.startsWith('http')) {
            url = '/' + url;
        }

        elements.push(
            <Link
                key={`link-${match.index}`}
                to={url}
                onClick={() => onLinkClick && onLinkClick()}
                className="font-bold text-amber-700 hover:text-amber-900 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer inline underline decoration-amber-500/60 underline-offset-2"
            >
                {renderFormattedText(title)}
            </Link>
        );

        lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < lineText.length) {
        elements.push(
            <React.Fragment key={`text-${lastIndex}`}>
                {renderFormattedText(lineText.substring(lastIndex))}
            </React.Fragment>
        );
    }

    return elements.length > 0 ? elements : renderFormattedText(lineText);
};

/**
 * Lấy style và màu sắc badge chuẩn riêng biệt của từng gói cước
 */
export const getPlanBadgeStyle = (planInfo) => {
    const level = Number(planInfo?.level) || 0;
    const name = String(planInfo?.planName || planInfo?.name || '').trim().toLowerCase();

    if (level >= 3 || name === 'premium' || name === 'prenium') {
        return {
            text: 'PREMIUM',
            className: 'bg-linear-to-r from-fuchsia-600 via-pink-400 to-rose-500 border border-pink-300 text-white shadow-[0_0_10px_rgba(236,72,153,0.7)] premium-laser'
        };
    } else if (level === 2 || name === 'plus') {
        return {
            text: 'PLUS',
            className: 'bg-linear-to-r from-yellow-400 via-amber-500 to-yellow-500 border border-yellow-300 text-black shadow-[0_0_8px_rgba(245,158,11,0.6)]'
        };
    } else if (level === 1 || name === 'basic') {
        return {
            text: 'BASIC',
            className: 'bg-linear-to-r from-blue-600 to-cyan-500 border border-cyan-300 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]'
        };
    } else {
        return {
            text: 'FREE',
            className: 'bg-slate-700 border border-slate-500 text-white'
        };
    }
};

/**
 * Component hiển thị 1 thẻ phim mini trực quan ngay dưới dòng mô tả
 */
export const SingleMovieCard = ({ movie, plans = [], onLinkClick }) => {
    if (!movie) return null;
    const planInfo = getMoviePlanInfo(movie, plans);
    const badgeStyle = getPlanBadgeStyle(planInfo);
    const movieSlug = movie.slug || movie.id;
    const posterUrl = movie.imgUrl || movie.poster || movie.image || '/assets/Logo6.png';
    const title = movie.otherName || movie.name;
    const epText = movie.endEpisode ? `${movie.endEpisode} tập` : '1 tập';

    return (
        <div className="my-1.5 p-2 rounded-xl bg-slate-900 text-white shadow-md border border-amber-500/20 hover:border-amber-500/50 transition-all flex items-center gap-2.5">
            <img 
                src={posterUrl} 
                alt={title}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/Logo6.png';
                }}
                className="w-13 h-18 rounded-lg object-cover shrink-0 shadow-sm border border-slate-700 pointer-events-none select-none" 
            />
            <div className="min-w-0 flex-1 pr-1">
                <h4 className="font-bold text-[11.5px] text-white truncate group-hover:text-amber-400 transition-colors" title={title}>
                    {title}
                </h4>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9.5px]">
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.25 rounded uppercase tracking-wider inline ${badgeStyle.className}`}>
                        {badgeStyle.text}
                    </span>
                    <span className="px-1.5 py-0.25 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-medium inline">
                        {epText}
                    </span>
                    {movie.releaseYear && (
                        <span className="px-1.5 py-0.25 rounded bg-purple-500/15 border border-purple-500/40 text-purple-300 font-medium inline">
                            {movie.releaseYear}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-nowrap">
                    <Link
                        to={`/xem-phim/${movieSlug}`}
                        onClick={() => onLinkClick && onLinkClick()}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-[10px] font-extrabold shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                    >
                        <FaPlay className="text-[7px] shrink-0" />
                        <span>Xem ngay</span>
                    </Link>
                    <Link
                        to={`/phim/${movieSlug}`}
                        onClick={() => onLinkClick && onLinkClick()}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-cyan-100 text-[10px] font-bold border border-cyan-500/35 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                    >
                        <FaInfoCircle className="text-[8px] shrink-0" />
                        <span>Chi tiết</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

/**
 * Render tin nhắn chat theo từng dòng, nếu dòng nào có link phim thì thẻ phim sẽ nằm NGAY DƯỚI dòng đó!
 */
export const renderMessage = (text, onLinkClick, movies = [], plans = []) => {
    if (!text) return null;

    const rawLines = text.split('\n');
    // Lọc bỏ dòng phân cách bảng markdown như |---|---|
    const validLines = rawLines.filter(line => !/^\|?\s*[-:]+[-|\s:]+$/.test(line.trim()));
    const seenMovieIds = new Set();

    return validLines.map((line, i, arr) => {
        let cleanLine = line.trim();
        if (!cleanLine && i < arr.length - 1) {
            return <div key={`empty-${i}`} className="h-1.5" />;
        }

        // Tự động chuyển đổi bảng Markdown dạng | cột 1 | cột 2 | thành dạng chấm tròn gọn đẹp
        if (cleanLine.startsWith('|') && cleanLine.endsWith('|')) {
            const cells = cleanLine.split('|').map(c => c.trim()).filter(Boolean);
            if (cells.length > 0) {
                const isHeader = cells.some(c => /^(gói|stt|tên phim|số phim|cột|thể loại|level)/i.test(c));
                if (isHeader) {
                    cleanLine = `**${cells.join(' • ')}**`;
                } else {
                    cleanLine = `• ${cells.join(' — ')}`;
                }
            }
        } else if (cleanLine.startsWith('>')) {
            cleanLine = cleanLine.replace(/^>\s*/, '💡 ');
        }

        // Chuẩn hóa gạch đầu dòng/chấm tròn bị lặp hoặc ghép đôi (ví dụ: "- •", "• -", "- -", "* •")
        cleanLine = cleanLine
            .replace(/^[-*•\s]*[-*•]\s*[-*•]\s*/, '• ')
            .replace(/^[-*]\s+/, '• ');

        // Kiểm tra xem dòng này có link /phim/slug không
        const movieSlugMatch = cleanLine.match(/\/phim\/([a-zA-Z0-9_-]+)/i);
        let movieForThisLine = null;
        if (movieSlugMatch && movies && movies.length > 0) {
            const slug = movieSlugMatch[1].toLowerCase();
            const found = movies.find(m => 
                String(m.slug || '').toLowerCase() === slug || 
                String(m.id || '').toLowerCase() === slug
            );
            if (found && !seenMovieIds.has(found.id)) {
                seenMovieIds.add(found.id);
                movieForThisLine = found;
            }
        }

        return (
            <div key={`line-${i}`} className="leading-relaxed">
                <div>{renderSingleLineText(cleanLine, onLinkClick)}</div>
                {movieForThisLine && (
                    <SingleMovieCard 
                        movie={movieForThisLine} 
                        plans={plans} 
                        onLinkClick={onLinkClick} 
                    />
                )}
            </div>
        );
    });
};

/**
 * Component hiệu ứng gõ chữ (Typewriter Effect) mượt mà cho tin nhắn AI
 */
export const TypewriterText = ({ text, isNew = false, onComplete, onLinkClick, movies = [], plans = [] }) => {
    const [displayedLength, setDisplayedLength] = React.useState(() => isNew ? 0 : (text?.length || 0));

    React.useEffect(() => {
        if (!isNew || !text) {
            setDisplayedLength(text?.length || 0);
            return;
        }

        let current = 0;
        const total = text.length;
        const speed = Math.max(8, Math.min(22, Math.floor(1200 / total)));

        const timer = setInterval(() => {
            current += 3;
            if (current >= total) {
                setDisplayedLength(total);
                clearInterval(timer);
                if (onComplete) onComplete();
            } else {
                setDisplayedLength(current);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, isNew, onComplete]);

    const handleSkipTypewriter = () => {
        if (displayedLength < (text?.length || 0)) {
            setDisplayedLength(text?.length || 0);
            if (onComplete) onComplete();
        }
    };

    const visibleText = text ? text.substring(0, displayedLength) : '';

    return (
        <div onClick={handleSkipTypewriter} className="cursor-text select-text flex flex-col gap-1">
            {renderMessage(visibleText, onLinkClick, movies, plans)}
        </div>
    );
};

/**
 * Định nghĩa Tools cho Groq API (OpenAI Function Calling schema)
 */
export const GROQ_TOOLS = [
    {
        type: "function",
        function: {
            name: "dieu_khien_website",
            description: "Điều khiển giao diện website theo yêu cầu của người dùng. Có thể chuyển trang, mở phim, tìm kiếm, mở form đăng nhập/đăng ký, hoặc mở trang nâng cấp VIP.",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        description: "Hành động: 'navigate', 'open_movie', 'search', 'open_login', 'open_register', 'open_vip'."
                    },
                    path: {
                        type: "string",
                        description: "Đường dẫn chuyển trang (khi action='navigate'). VD: '/', '/film-new', '/cinema-movies'..."
                    },
                    movieSlug: {
                        type: "string",
                        description: "Tên hoặc slug của phim muốn mở (khi action='open_movie')."
                    },
                    episode: {
                        type: "number",
                        description: "Tập phim muốn mở."
                    },
                    searchQuery: {
                        type: "string",
                        description: "Từ khóa tìm kiếm (khi action='search')."
                    }
                },
                required: ["action"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "tra_cuu_phim",
            description: "Tra cứu phim trong hệ thống MFILM theo tên phim, nhân vật, diễn viên, tác giả, thể loại, hoặc lọc theo gói cước của người dùng. Khi người dùng từ chối/chê/không thích phim vừa gợi ý hoặc bảo 'tiếp'/'đổi phim khác', hãy gọi tool này với xem_tiep=true để gợi ý phim mới khác.",
            parameters: {
                type: "object",
                properties: {
                    tu_khoa: { type: "string", description: "Từ khóa tìm kiếm chung" },
                    nhan_vat: { type: "string", description: "Tên nhân vật trong phim (ví dụ: Rudeus, Luffy, Naruto...)" },
                    dien_vien: { type: "string", description: "Tên diễn viên" },
                    tac_gia: { type: "string", description: "Tên tác giả hoặc đạo diễn" },
                    the_loai: { type: "string", description: "Thể loại phim" },
                    quoc_gia: { type: "string", description: "Quốc gia sản xuất phim (ví dụ: 'Trung Quốc', 'Hàn Quốc', 'Nhật Bản', 'Việt Nam', 'Mỹ', 'Thái Lan', 'Hồng Kông', 'Anh', 'Pháp'). BẮT BUỘC truyền khi người dùng hỏi hoặc yêu cầu phim của bất kỳ quốc gia nào." },
                    loai_phi: { type: "string", description: "Lọc gói cước: 'premium' (khi hỏi gói Premium, gói VIP, gói xịn nhất, cao cấp nhất), 'plus' (gói Plus), 'basic' (gói Basic, gói cơ bản), 'free' (gói Free, miễn phí), 'paid' (phim có phí nói chung), 'user_plan' (phù hợp gói người dùng). BẮT BUỘC truyền khi người dùng hỏi phim theo gói hoặc hỏi loại xịn nhất." },
                    phu_hop_goi_user: { type: "boolean", description: "Đặt là true khi người dùng hỏi các phim phù hợp với gói hiện tại. Đặt là false nếu người dùng đang đặc biệt yêu cầu tìm phim Premium/VIP nhưng gói của họ không đủ." },
                    sap_xep: { type: "string", enum: ["nhieu_phan_nhat", "nhieu_tap_nhat", "it_tap_nhat", "moi_nhat", "cu_nhat", "xem_nhieu_nhat"], description: "Tiêu chí sắp xếp: 'nhieu_phan_nhat' (khi hỏi phim nhiều phần/season nhất), 'nhieu_tap_nhat', 'it_tap_nhat', 'moi_nhat', 'cu_nhat', 'xem_nhieu_nhat'" },
                    xem_tiep: { type: "boolean", description: "Đặt là true khi người dùng muốn xem tiếp hoặc gợi ý thêm 5 phim khác trong danh sách (loại trừ các phim đã hiển thị trước đó)" },
                    so_luong: { type: "number", description: "Số lượng phim cần lấy (khi người dùng yêu cầu số lượng cụ thể như top 10, top 20, 3 phim...). Mặc định là 5." }
                }
            }
        }
    }
];

/**
 * Định nghĩa Tools cho Gemini SDK
 */
export const GEMINI_TOOLS = [
    {
        functionDeclarations: [
            {
                name: "dieu_khien_website",
                description: "Điều khiển giao diện website theo yêu cầu của người dùng. Có thể chuyển trang, mở phim, tìm kiếm, mở form đăng nhập/đăng ký, hoặc mở trang nâng cấp VIP.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        action: {
                            type: "STRING",
                            description: "Hành động: 'navigate', 'open_movie', 'search', 'open_login', 'open_register', 'open_vip'."
                        },
                        path: {
                            type: "STRING",
                            description: "Đường dẫn chuyển trang (khi action='navigate'). VD: '/', '/film-new', '/cinema-movies'..."
                        },
                        movieSlug: {
                            type: "STRING",
                            description: "Tên hoặc slug của phim muốn mở (khi action='open_movie')."
                        },
                        episode: {
                            type: "NUMBER",
                            description: "Tập phim muốn mở."
                        },
                        searchQuery: {
                            type: "STRING",
                            description: "Từ khóa tìm kiếm (khi action='search')."
                        }
                    },
                    required: ["action"]
                }
            },
            {
                name: "tra_cuu_phim",
                description: "Tra cứu phim trong hệ thống MFILM theo tên phim, nhân vật, diễn viên, tác giả, thể loại, hoặc lọc theo gói cước của người dùng. Khi người dùng từ chối/chê/không thích phim vừa gợi ý hoặc bảo 'tiếp'/'đổi phim khác', hãy gọi tool này với xem_tiep=true để gợi ý phim mới khác.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tu_khoa: { type: "STRING", description: "Từ khóa tìm kiếm chung" },
                        nhan_vat: { type: "STRING", description: "Tên nhân vật trong phim (ví dụ: Rudeus, Luffy, Naruto...)" },
                        dien_vien: { type: "STRING", description: "Tên diễn viên" },
                        tac_gia: { type: "STRING", description: "Tên tác giả hoặc đạo diễn" },
                        the_loai: { type: "STRING", description: "Thể loại phim" },
                        quoc_gia: { type: "STRING", description: "Quốc gia sản xuất phim (ví dụ: 'Trung Quốc', 'Hàn Quốc', 'Nhật Bản', 'Việt Nam', 'Mỹ', 'Thái Lan', 'Hồng Kông'). BẮT BUỘC truyền khi người dùng hỏi phim theo quốc gia." },
                        loai_phi: { type: "STRING", description: "Lọc gói cước: 'premium' (gói xịn nhất, VIP, Premium), 'plus', 'basic', 'free', 'paid', 'user_plan'. BẮT BUỘC truyền khi hỏi theo gói cước hoặc loại xịn nhất." },
                        phu_hop_goi_user: { type: "BOOLEAN", description: "Đặt là true khi người dùng hỏi phim phù hợp gói. Đặt là false nếu người dùng muốn tìm phim Premium/VIP nhưng gói không đủ." },
                        sap_xep: { type: "STRING", description: "Tiêu chí sắp xếp: 'nhieu_phan_nhat', 'nhieu_tap_nhat', 'it_tap_nhat', 'moi_nhat', 'cu_nhat', 'xem_nhieu_nhat'" },
                        xem_tiep: { type: "BOOLEAN", description: "Đặt là true khi người dùng muốn xem tiếp hoặc gợi ý thêm 5 phim khác trong danh sách" },
                        so_luong: { type: "NUMBER", description: "Số lượng phim cần lấy (khi người dùng yêu cầu số lượng cụ thể như top 10, top 20, 3 phim...)" }
                    }
                }
            }
        ]
    }
];

