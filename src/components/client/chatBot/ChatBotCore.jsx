import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';

export const STOP_WORDS = new Set([
    'phim', 'bo', 'tap', 'xem', 'mo', 'cho', 'toi', 'co', 'nay', 'va', 'la', 'nhung', 'cac', 'the',
    'nhan', 'vat', 'dien', 'vien', 'tac', 'gia', 'dao', 'dien', 'k', 'ko', 'khong', 'chua', 'nao',
    'nhi', 'nhe', 'a', 'ha', 'tim', 'kiem', 'muon', 'can', 'hoi', 've', 'co phai', 'hay khong', 'voi',
    'gi', 'trong', 'duoc', 'o', 'tai', 'website', 'mfilm', 'app'
]);

export const searchTV = (str) => {
    if (!str) return '';
    return str
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
 * Xây dựng danh mục phim tóm tắt cho prompt để AI luôn biết chính xác phim & nhân vật nào có trong website
 */
export const buildMovieCatalogSummary = (movies = [], categories = [], plans = [], characters = []) => {
    if (!movies || movies.length === 0) return "Chưa có phim nào trong hệ thống.";
    
    // Lấy top 10 phim tiêu biểu nhất để siêu tiết kiệm token
    const sorted = [...movies].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    return sorted.slice(0, 10).map(m => {
        const planInfo = getMoviePlanInfo(m, plans);
        const catNames = (m.listCategory || [])
            .map(catId => categories.find(c => String(c.id) === String(catId))?.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(', ') || 'Chung';
        const title = m.otherName || m.name || 'Không rõ';
        const slug = m.slug || m.id;
        const epStr = m.endEpisode ? `${m.endEpisode} tập` : '1 tập';
        return `- [${slug}] "${title}" | [Gói ${planInfo.planName} L${planInfo.level}] | ${epStr} | ${catNames}`;
    }).join('\n');
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

QUY TẮC CỐT LÕI:
1. CHỈ GIỚI THIỆU PHIM CÓ TRÊN MFILM & ĐÚNG TỪ KHÓA:
   - Khi người dùng hỏi về một phim/series (ví dụ: "có phim slime không", "tìm phim naruto", "conan"...), BẮT BUỘC dùng tool \`tra_cuu_phim\` để tra cứu dữ liệu thực tế.
   - CHỈ nhắc đến và đề xuất ĐÚNG các bộ/phần phim mà tool \`tra_cuu_phim\` trả về.
   - TUYỆT ĐỐI KHÔNG tự bịa hoặc chèn thêm các bộ phim không liên quan.
   - Khi gợi ý/nhắc phim, BẮT BUỘC dùng cú pháp: [Tên Phim](/phim/slug-chinh-xac).
2. XỬ LÝ PHIM CÓ NHIỀU PHẦN/MÙA (FRANCHISE):
   - Trên hệ thống MFILM, mỗi phần/mùa phim (Phần 1, Phần 2, Phần 3, Phần 4, Movie, Ngoại truyện...) được lưu thành 1 BỘ PHIM RIÊNG BIỆT.
   - Khi người dùng hỏi về một series/phim có nhiều phần, hãy LIỆT KÊ ĐẦY ĐỦ TẤT CẢ CÁC PHẦN mà hệ thống tìm thấy theo đúng thứ tự (Phần 1, Phần 2, Phần 3, Phần 4...), cung cấp link và thông tin chi tiết từng phần để người dùng dễ chọn xem.
3. SỐ LƯỢNG ĐỀ XUẤT PHIM (QUY TẮC CHIA ĐỢT TỐI ĐA 5 PHIM / LẦN):
   - MỖI LẦN TRẢ LỜI CHỈ GỬI TỐI ĐA 5 BỘ PHIM để giao diện chat luôn gọn gàng, đẹp mắt và không bị đứt đoạn token.
   - KHI NGƯỜI DÙNG YÊU CẦU SỐ LƯỢNG LỚN (ví dụ: "100 phim", "top 20", "50 phim"...):
     + Hãy giải thích thân thiện: "Danh sách [N] phim khá dài có thể làm rối khung chat nè. Mình xin phép gửi trước 5 bộ phim tiêu biểu nhất nhé! Bạn có thể bấm nút **Xem tiếp** bên dưới hoặc nhắn *tiếp* nha! 🍿"
     + Sau đó hiển thị đúng 5 phim do tool \`tra_cuu_phim\` trả về.
   - KHI NGƯỜI DÙNG YÊU CẦU SỐ LƯỢNG NHỎ (từ 1 đến 5 phim): Gửi đúng số lượng phim được yêu cầu.
   - KHI TÌM SERIES NHIỀU PHẦN (như Slime, Naruto...): Liệt kê đầy đủ tất cả các phần của series mà hệ thống tìm thấy.
4. XỬ LÝ KHI NGƯỜI DÙNG BẢO "TIẾP", "THÊM", "CÒN NỮA KHÔNG", "XEM TIẾP":
   - Khi người dùng muốn xem tiếp danh sách, gọi tool \`tra_cuu_phim\` với xem_tiep=true.
   - Đề xuất 5 bộ phim TIẾP THEO từ kết quả tra cứu, TUYỆT ĐỐI KHÔNG lặp lại các phim đã giới thiệu ở các tin nhắn phía trên.
5. THỐNG KÊ MFILM: Tổng số phim: ${totalMovies} (Free: ${freeMoviesCount}, Có phí: ${paidMoviesCount}). Tổng số tập phim toàn web: ${totalEpisodes} tập.
${planBreakdown}
6. GÓI CỦA USER: Người dùng đang sở hữu gói **${planName}** (Level ${planLevel}). Nếu Level > 0, gợi ý phim phù hợp quyền hạn (Level <= ${planLevel}). Nếu Free (Level 0), gợi ý phim Free và mời [Nâng Cấp Gói VIP](/upgrade).
7. GIAO TIẾP: Lễ phép, duyên dáng, thân thiện, dùng emoji 🍿🎬✨. TUYỆT ĐỐI KHÔNG dùng bảng markdown (|). Dùng gạch đầu dòng (-) hoặc chấm tròn (•).
8. ĐIỀU KHIỂN WEB: Dùng tool \`dieu_khien_website\` khi người dùng yêu cầu mở phim, tìm kiếm, đăng nhập hoặc nâng cấp VIP.
9. PHÂN BIỆT CÂU HỎI TRẢ LỜI ĐƠN LẺ VS DANH SÁCH GỢI Ý:
   - KHI NGƯỜI DÙNG HỎI CÂU HỎI ĐƠN LẺ (ví dụ: "phim nào nhiều tập nhất?", "phim này do ai đóng?", "nội dung phim X", "phim này chiếu năm nào?"):
     + Hãy trả lời trực tiếp, chính xác thông tin bộ phim đó.
     + TUYỆT ĐỐI KHÔNG tự chèn thêm câu "nếu cần thêm gợi ý hãy nhắn tiếp" hay mở luồng xem tiếp khi người dùng không yêu cầu danh sách gợi ý.
   - KHI NGƯỜI DÙNG YÊU CẦU DANH SÁCH / GỢI Ý NHIỀU PHIM (ví dụ: "gợi ý phim hay", "top 5 phim", "phim hành động hot", hoặc bấm "Xem tiếp"):
     + Gợi ý danh sách các bộ phim kèm thông tin chi tiết.

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
        /\b(tiep|tiep tuc|them|nua|con nua khong|con khong|xem tiep|goi y tiep|khac|phim khac|5 phim nua)\b/i.test(cleanUserQuery)
    );

    const slugsToExclude = new Set(
        (Array.isArray(excludeSlugs) ? excludeSlugs : []).map(s => String(s).toLowerCase().trim())
    );

    // Nếu người dùng yêu cầu xem tiếp / thêm phim khác, loại trừ các phim đã từng xuất hiện
    if (slugsToExclude.size > 0 && isPagingNext) {
        filtered = filtered.filter(m => {
            const mSlug = String(m.slug || '').toLowerCase().trim();
            const mId = String(m.id || '').toLowerCase().trim();
            return !slugsToExclude.has(mSlug) && !slugsToExclude.has(mId);
        });
    }

    // Lọc theo gói cước
    if (args.loai_phi === 'user_plan' || args.phu_hop_goi_user) {
        const userLevel = Number(userPlanInfo?.level) || 0;
        filtered = filtered.filter(m => {
            const planInfo = getMoviePlanInfo(m, plans);
            return planInfo.level <= userLevel;
        });
    } else if (args.loai_phi === 'free' || args.is_free === true || args.mien_phi === true) {
        filtered = filtered.filter(m => getMoviePlanInfo(m, plans).isFree);
    } else if (args.loai_phi === 'paid' || args.is_free === false || args.mien_phi === false || args.loai_phi === 'premium' || args.loai_phi === 'vip' || args.loai_phi === 'basic' || args.loai_phi === 'plus') {
        filtered = filtered.filter(m => !getMoviePlanInfo(m, plans).isFree);
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

    // Lọc theo quốc gia nếu có
    if (args.quoc_gia) {
        const countryKw = searchTV(args.quoc_gia).trim();
        filtered = filtered.filter(m => 
            (m.country && searchTV(m.country).includes(countryKw)) ||
            (m.countriesID && searchTV(String(m.countriesID)).includes(countryKw))
        );
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
        'tiep', 'tiep tuc', 'them', 'nua', 'con nua khong', 'con khong', 'xem tiep',
        'nhieu tap nhat', 'dai tap nhat', 'dai nhat', 'nhieu tap', 'so tap nhieu nhat',
        'it tap nhat', 'ngan tap nhat', 'ngan nhat', 'it tap', 'so tap it nhat',
        'moi nhat', 'cu nhat', 'xem nhieu nhat', 'hot nhat', 'nhieu view nhat', 'top view'
    ]);

    // Nhận diện các ý định sắp xếp đặc biệt
    const isMostEpisodes = /\b(nhieu tap nhat|dai tap nhat|so tap nhieu nhat|nhieu tap|dai tap|dai nhat|nhieu tap nhat web|nhieu tap nhat he thong)\b/i.test(cleanUserQuery) || args.sap_xep === 'nhieu_tap_nhat';
    const isLeastEpisodes = /\b(it tap nhat|ngan tap nhat|ngan nhat|it tap|so tap it nhat)\b/i.test(cleanUserQuery) || args.sap_xep === 'it_tap_nhat';
    const isNewest = /\b(moi nhat|moi ra|moi phat hanh|nam moi nhat)\b/i.test(cleanUserQuery) || args.sap_xep === 'moi_nhat';
    const isOldest = /\b(cu nhat|lau doi nhat|xua nhat|nam cu nhat)\b/i.test(cleanUserQuery) || args.sap_xep === 'cu_nhat';
    const isMostViewed = /\b(xem nhieu nhat|nhieu view nhat|hot nhat|top view|thinh hanh nhat)\b/i.test(cleanUserQuery) || args.sap_xep === 'xem_nhieu_nhat';

    // Nhận diện câu hỏi đơn lẻ (không phải yêu cầu danh sách gợi ý phim)
    const isSingleQuestion = (
        /\b(phim nao|bo nao|cai nao|ai la|co phai|la gi|bao nhieu tap|may tap|chieu nam nao|dao dien la ai)\b/i.test(cleanUserQuery) &&
        !/\b(top|danh sach|goi y|cac phim|nhung phim|nhieu phim)\b/i.test(cleanUserQuery)
    );

    let isSpecificSearch = false;

    for (const rawKw of searchTerms) {
        let cleanKw = searchTV(rawKw)
            .replace(/\b(co phim|tim phim|phim|bo phim|xem phim|hoat hinh|anime|co|khong|k|ko|chua|nao|nhe|nhi|a|ha|voi|ve|cho toi|giup toi)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanKw || GENERIC_RECOMMEND_INTENTS.has(cleanKw)) {
            continue;
        }

        // Bỏ qua các từ chỉ tiêu chí sắp xếp để không nhầm sang tìm tên phim
        if (isMostEpisodes || isLeastEpisodes || isNewest || isOldest || isMostViewed) {
            cleanKw = cleanKw
                .replace(/\b(nhieu tap nhat|dai tap nhat|so tap nhieu nhat|nhieu tap|dai tap|dai nhat|it tap nhat|ngan tap nhat|ngan nhat|it tap|moi nhat|cu nhat|xem nhieu nhat|hot nhat|nhieu view nhat|top view|nhat|nhieu|it|moi|cu)\b/gi, ' ')
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
                    score += 150;
                    matchedTokensCount++;
                }
            }

            // Nếu khớp toàn bộ các từ của cụm tìm kiếm trong tiêu đề
            if (kwTokens.length > 1 && matchedTokensCount === kwTokens.length) {
                score += 500;
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
        return "Không tìm thấy bộ phim nào phù hợp với yêu cầu.";
    }

    const totalRemaining = Math.max(0, filtered.length - resultList.length);

    const topMatches = resultList.map((m, idx) => {
        const planInfo = getMoviePlanInfo(m, plans);
        const authNames = authors.filter(a => (m.listAuthor || []).includes(a.id) || m.author === a.id).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const actNames = actors.filter(a => (m.listActor || []).includes(a.id)).map(a => a.name).slice(0, 3).join(', ') || 'Chưa cập nhật';
        const mCharIds = m.character || m.characters || m.listCharacter || [];
        const charNames = characters.filter(c => mCharIds.includes(c.id)).map(c => c.name).slice(0, 5).join(', ') || 'Chưa cập nhật';
        const catNames = (m.listCategory || []).map(catId => categories.find(c => String(c.id) === String(catId))?.name).filter(Boolean).join(', ') || 'Đang cập nhật';
        const feeStr = `Gói ${planInfo.planName} (Level ${planInfo.level})`;
        const epStr = m.endEpisode ? `${m.endEpisode} tập` : '1 tập';
        return `Phần/Phim ${idx + 1}: [${m.otherName || m.name}](/phim/${m.slug || m.id}) | Số tập: ${epStr} | Gói xem: ${feeStr} | Thể loại: ${catNames} | Nhân vật: ${charNames} | Lượt xem: ${(Number(m.views) || 0) + 100} | Năm: ${m.releaseYear || m.year || ''}`;
    }).join('\n');

    let noteMessage = '';
    if (!isSingleQuestion) {
        if (requestedLimit && requestedLimit > 5) {
            noteMessage = ` (Do yêu cầu ${requestedLimit} phim khá dài nên mình gửi trước 5 phim, bạn có thể bấm nút **Xem tiếp** bên dưới hoặc nhắn "tiếp" nhé! 🍿)`;
        } else if (totalRemaining > 0 && (isPagingNext || (requestedLimit && requestedLimit > 1) || (!isSpecificSearch && limit > 1))) {
            noteMessage = ` (còn ${totalRemaining} phim khác, bạn có thể bấm nút **Xem tiếp** bên dưới hoặc nhắn "tiếp")`;
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
            description: "Tra cứu phim trong hệ thống MFILM theo tên phim, nhân vật, diễn viên, tác giả, thể loại, hoặc lọc theo gói cước của người dùng.",
            parameters: {
                type: "object",
                properties: {
                    tu_khoa: { type: "string", description: "Từ khóa tìm kiếm chung" },
                    nhan_vat: { type: "string", description: "Tên nhân vật trong phim (ví dụ: Rudeus, Luffy, Naruto...)" },
                    dien_vien: { type: "string", description: "Tên diễn viên" },
                    tac_gia: { type: "string", description: "Tên tác giả hoặc đạo diễn" },
                    the_loai: { type: "string", description: "Thể loại phim" },
                    quoc_gia: { type: "string", description: "Quốc gia" },
                    loai_phi: { type: "string", description: "Lọc phim: 'free' (chỉ phim miễn phí), 'paid' (chỉ phim có phí), 'user_plan' (chỉ phim phù hợp gói cước hiện tại của người dùng)" },
                    phu_hop_goi_user: { type: "boolean", description: "Đặt là true khi người dùng hỏi các phim phù hợp với gói hiện tại của họ" },
                    sap_xep: { type: "string", enum: ["nhieu_tap_nhat", "it_tap_nhat", "moi_nhat", "cu_nhat", "xem_nhieu_nhat"], description: "Tiêu chí sắp xếp: 'nhieu_tap_nhat' (khi hỏi phim nhiều tập nhất/dài nhất), 'it_tap_nhat', 'moi_nhat', 'cu_nhat', 'xem_nhieu_nhat'" },
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
                description: "Tra cứu phim trong hệ thống MFILM theo tên phim, nhân vật, diễn viên, tác giả, thể loại, hoặc lọc theo gói cước của người dùng.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tu_khoa: { type: "STRING", description: "Từ khóa tìm kiếm chung" },
                        nhan_vat: { type: "STRING", description: "Tên nhân vật trong phim (ví dụ: Rudeus, Luffy, Naruto...)" },
                        dien_vien: { type: "STRING", description: "Tên diễn viên" },
                        tac_gia: { type: "STRING", description: "Tên tác giả hoặc đạo diễn" },
                        the_loai: { type: "STRING", description: "Thể loại phim" },
                        quoc_gia: { type: "STRING", description: "Quốc gia" },
                        loai_phi: { type: "STRING", description: "Lọc phim: 'free', 'paid', 'user_plan'" },
                        phu_hop_goi_user: { type: "BOOLEAN", description: "Đặt là true khi người dùng hỏi các phim phù hợp với gói hiện tại của họ" },
                        sap_xep: { type: "STRING", description: "Tiêu chí sắp xếp: 'nhieu_tap_nhat', 'it_tap_nhat', 'moi_nhat', 'cu_nhat', 'xem_nhieu_nhat'" },
                        xem_tiep: { type: "BOOLEAN", description: "Đặt là true khi người dùng muốn xem tiếp hoặc gợi ý thêm 5 phim khác trong danh sách" },
                        so_luong: { type: "NUMBER", description: "Số lượng phim cần lấy (khi người dùng yêu cầu số lượng cụ thể như top 10, top 20, 3 phim...)" }
                    }
                }
            }
        ]
    }
];

