import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';

export const STOP_WORDS = new Set(['phim', 'bo', 'tap', 'xem', 'mo', 'cho', 'toi', 'co', 'nay', 'va', 'la', 'nhung', 'cac', 'the', 'nhan', 'vat', 'dien', 'vien', 'tac', 'gia', 'dao', 'dien']);

export const normalizeTokens = (str) => {
    return String(str || '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
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
    const s1 = normalizeTokens(searchTerm).join(' ');
    const s2 = normalizeTokens(targetStr).join(' ');
    if (!s1 || !s2) return false;

    if (s2.includes(s1) || s1.includes(s2)) return true;

    const s1Tokens = normalizeTokens(searchTerm);
    const s2Tokens = normalizeTokens(targetStr);

    for (const t1 of s1Tokens) {
        if (t1.length < 3) {
            if (s2Tokens.includes(t1)) return true;
            continue;
        }
        for (const t2 of s2Tokens) {
            if (t2.includes(t1) || t1.includes(t2)) return true;
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

    // 2. Tách tokens từ query
    let queryTokens = normalizeTokens(clean);
    if (queryTokens.length === 0) {
        queryTokens = String(clean).toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
    }
    if (queryTokens.length === 0) return null;

    // 3. Chấm điểm độ khớp
    let bestMovie = null;
    let highestScore = 0;

    for (const m of movies) {
        const otherTokens = normalizeTokens(m.otherName);
        const nameTokens = normalizeTokens(m.name);
        const slugTokens = normalizeTokens(m.slug);

        const mCharIds = m.character || m.characters || m.listCharacter || [];
        const charNames = (characters || []).filter(c => mCharIds.includes(c.id)).map(c => c.name);
        const charTokens = normalizeTokens(charNames.join(' '));

        const mActorIds = m.actor || m.actors || m.listActor || [];
        const actorNames = (actors || []).filter(a => mActorIds.includes(a.id)).map(a => a.name);
        const actorTokens = normalizeTokens(actorNames.join(' '));

        const mAuthorIds = m.listAuthor || (m.author ? [m.author] : []);
        const authorNames = (authors || []).filter(a => mAuthorIds.includes(a.id) || m.author === a.id).map(a => a.name);
        const authorTokens = normalizeTokens(authorNames.join(' '));

        let score = 0;
        let matchedQueryTokens = 0;

        for (const qToken of queryTokens) {
            let tokenMatched = false;

            if (otherTokens.includes(qToken)) {
                score += 100;
                tokenMatched = true;
            } else if (otherTokens.some(t => t.startsWith(qToken) && qToken.length >= 2)) {
                score += 50;
                tokenMatched = true;
            } else if (nameTokens.includes(qToken) || slugTokens.includes(qToken)) {
                score += 30;
                tokenMatched = true;
            } else if (slugTokens.some(t => t.startsWith(qToken) && qToken.length >= 2)) {
                score += 15;
                tokenMatched = true;
            } else if (charTokens.includes(qToken) || charTokens.some(t => isFuzzyMatch(qToken, t))) {
                score += 90;
                tokenMatched = true;
            } else if (actorTokens.includes(qToken) || actorTokens.some(t => isFuzzyMatch(qToken, t))) {
                score += 70;
                tokenMatched = true;
            } else if (authorTokens.includes(qToken) || authorTokens.some(t => isFuzzyMatch(qToken, t))) {
                score += 50;
                tokenMatched = true;
            } else if (otherTokens.some(t => isFuzzyMatch(qToken, t))) {
                score += 40;
                tokenMatched = true;
            }

            if (tokenMatched) matchedQueryTokens++;
        }

        if (matchedQueryTokens >= Math.ceil(queryTokens.length / 2)) {
            if (matchedQueryTokens === queryTokens.length) {
                score += 200;
            }
            if (score > highestScore) {
                highestScore = score;
                bestMovie = m;
            }
        }
    }

    return highestScore >= 70 ? bestMovie : null;
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
    
    // Lấy top 20 phim có nhiều lượt xem nhất để cung cấp đủ thông tin và tối ưu token
    const sorted = [...movies].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    return sorted.slice(0, 20).map(m => {
        const planInfo = getMoviePlanInfo(m, plans);
        const catNames = (m.listCategory || [])
            .map(catId => categories.find(c => String(c.id) === String(catId))?.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(', ') || 'Chung';
        const mCharIds = m.character || m.characters || m.listCharacter || [];
        const charNames = (characters || [])
            .filter(c => mCharIds.includes(c.id))
            .map(c => c.name)
            .slice(0, 4)
            .join(', ');
        const charInfo = charNames ? ` | Nhân vật: ${charNames}` : '';
        const title = m.otherName || m.name || 'Không rõ';
        const origTitle = (m.name && m.otherName && m.name !== m.otherName) ? ` (${m.name})` : '';
        const slug = m.slug || m.id;
        const views = (Number(m.views) || 0) + 100;
        const epStr = m.endEpisode ? `${m.endEpisode} tập` : '1 tập';
        const feeStatus = `[Gói ${planInfo.planName} (Level ${planInfo.level})]`;
        return `- [${slug}] "${title}"${origTitle} | ${feeStatus} | ${epStr} | Thể loại: ${catNames}${charInfo} | Lượt xem: ${views}`;
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
    const totalCategories = categories?.length || 0;
    const totalCharacters = characters?.length || 0;
    const totalActors = actors?.length || 0;
    const totalAuthors = authors?.length || 0;

    // Tổng số tập phim trên toàn bộ website MFILM
    const totalEpisodes = (allEpisodes && allEpisodes.length > 0)
        ? allEpisodes.length
        : (movies || []).reduce((sum, m) => sum + (Number(m.endEpisode) || Number(m.totalEpisodes) || 1), 0);

    // Sắp xếp các gói cước theo Level từ thấp đến cao (Free, Basic, Plus, Premium...)
    const sortedPlans = [...(plans || [])].sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));

    // Thống kê chính xác số phim theo từng gói cước được thiết lập trong database
    let planBreakdown = [];
    if (sortedPlans.length > 0) {
        planBreakdown = sortedPlans.map(p => {
            const isFree = Number(p.level) === 0 || String(p.name || '').trim().toLowerCase() === 'free';
            const count = (movies || []).filter(m => {
                if (String(m.planID) === String(p.id)) return true;
                if (!m.planID && isFree) return true;
                return false;
            }).length;
            return `- Gói **${p.name} (Level ${p.level || 0})**: ${count} bộ phim`;
        });
    } else {
        planBreakdown = [
            `- Gói **Free (Level 0)**: ${freeMoviesCount} bộ phim`,
            `- Gói **VIP (Level 1)**: ${paidMoviesCount} bộ phim`
        ];
    }
    const planStatsText = planBreakdown.join('\n');

    const movieCatalog = buildMovieCatalogSummary(movies, categories, plans, characters);
    const categoryList = (categories || []).map(c => c.name).filter(Boolean).join(', ');

    let currentMovieContext = "";
    if (currentMovie) {
        const planInfo = getMoviePlanInfo(currentMovie, plans);
        const movieAuthors = authors.filter(a => (currentMovie.listAuthor || []).includes(a.id) || currentMovie.author === a.id).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const movieActors = actors.filter(a => (currentMovie.listActor || []).includes(a.id) || (currentMovie.actors || []).includes(a.id)).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const charList = currentMovie.character || currentMovie.characters || currentMovie.listCharacter || [];
        const movieCharacters = characters.filter(c => charList.includes(c.id)).map(c => c.name).join(', ') || 'Chưa cập nhật';
        const movieCategories = categories.filter(c => (currentMovie.listCategory || []).includes(c.id)).map(c => c.name).join(', ') || 'Chưa cập nhật';
        const cmtCount = allComments.filter(c => c.movieID === currentMovie.id).length;
        const reviewCount = allReviews.filter(r => r.movieID === currentMovie.id || r.movieId === currentMovie.id).length;
        const feeDescription = planInfo.isFree 
            ? "Gói Free (Level 0 - Xem tự do không tốn phí)" 
            : `Gói ${planInfo.planName} (Level ${planInfo.level} hoặc Mua/Thuê phim)`;

        currentMovieContext = `\n\n[THÔNG TIN PHIM NGƯỜI DÙNG ĐANG XEM]:
- Tên phim: "${currentMovie.otherName || currentMovie.name}"
- Slug: ${currentMovie.slug || currentMovie.id}
- Phí xem: ${feeDescription}
- Tác giả / Đạo diễn: ${movieAuthors}
- Diễn viên: ${movieActors}
- Nhân vật trong phim: ${movieCharacters}
- Thể loại: ${movieCategories}
- Lượt xem: ${(Number(currentMovie.views) || 0) + 100} lượt
- Số lượt bình luận (cmt / comment): ${cmtCount} bình luận
- Số lượt đánh giá (review): ${reviewCount} đánh giá
- Năm phát hành: ${currentMovie.releaseYear || currentMovie.year || 'N/A'}
- Số tập: ${currentMovie.endEpisode || currentMovie.totalEpisodes || 1} tập
- Trạng thái: ${currentMovie.status || ''}
- Mô tả: ${currentMovie.description || ''}`;
    }

    let userContext = "";
    if (isLogin) {
        const planName = userPlanInfo?.name || 'FREE';
        const planLevel = Number(userPlanInfo?.level) || 0;
        const isPaidPlan = planLevel > 0;
        const userName = isLogin.name || isLogin.email || 'Người dùng';

        userContext = `\n\n[THÔNG TIN TÀI KHOẢN VÀ GÓI ĐĂNG KÝ CỦA NGƯỜI DÙNG HIỆN TẠI]:
- Trạng thái: Đã đăng nhập tài khoản
- Tên người dùng: "${userName}"
- Gói cước người dùng đang sở hữu: Gói **${planName}** (Cấp độ Level: ${planLevel})
- Quyền hạn xem phim của người dùng: ${isPaidPlan 
    ? `Tài khoản ĐÃ ĐĂNG KÝ VÀ SỞ HỮU GÓI **${planName}**. Người dùng ĐƯỢC QUYỀN XEM TOÀN BỘ các phim thuộc Gói Free VÀ TẤT CẢ các phim thuộc Gói có cấp độ Level <= ${planLevel}.` 
    : `Tài khoản hiện ở Gói Free, chưa mua gói trả phí. Chỉ xem được các phim Gói Free. Muốn xem phim trả phí cần mua gói.`}`;
    } else {
        userContext = `\n\n[THÔNG TIN TÀI KHOẢN VÀ GÓI ĐĂNG KÝ CỦA NGƯỜI DÙNG HIỆN TẠI]:
- Trạng thái: Chưa đăng nhập (Khách vãng lai)
- Gói cước: Chưa có gói (Chỉ được xem các phim thuộc Gói Free). Cần đăng nhập và nâng cấp gói VIP để xem phim trả phí.`;
    }

    return `Bạn là trợ lý AI thông minh, nhiệt tình của website xem phim MFILM.
BẮT BUỘC LUÔN TRẢ LỜI BẰNG TIẾNG VIỆT 100%.

QUY TẮC CỐT LÕI VỀ DỮ LIỆU & GÓI CƯỚC (BẮT BUỘC TUÂN THỦ 100%):
1. TUYỆT ĐỐI KHÔNG TỰ BỊA PHIM HOẶC SỐ TẬP: CHỈ ĐƯỢC trả lời các bộ phim và số tập CÓ THẬT trong hệ thống MFILM. Tuyệt đối không tự suy diễn hoặc lấy số tập từ truyện tranh/manga bên ngoài.
2. ĐỊNH DẠNG LINK PHIM: Khi nhắc đến hoặc gợi ý bất kỳ bộ phim nào, BẮT BUỘC dùng cú pháp: [Tên Phim](/phim/slug-chinh-xac). Viết liền mạch trên cùng 1 dòng, không được xuống dòng hoặc chèn khoảng trắng giữa [] và (). Lấy đúng slug trong dấu ngoặc vuông [slug] ở danh sách bên dưới hoặc từ kết quả tra cứu.
   Ví dụ: [Thất Nghiệp Chuyển Sinh](/phim/that-nghiep-chuyen-sinh)
3. ĐỊNH DẠNG LINK THỂ LOẠI: Khi gợi ý thể loại, dùng cú pháp: [Tên Thể Loại](/category/Tên Thể Loại). Ví dụ: [Hành Động](/category/Hành Động).
4. THỐNG KÊ SỐ LƯỢNG PHIM / TẬP PHIM / THEO GÓI (CỰC KỲ QUAN TRỌNG):
   - Khi người dùng hỏi hệ thống có bao nhiêu phim, có tổng cộng bao nhiêu tập phim, hoặc liệt kê chi tiết xem bao nhiêu phim Free, bao nhiêu phim Basic, Plus, Premium...:
     * Luôn mở đầu lễ phép, nhã nhặn (Ví dụ: "Dạ chào bạn, mình xin gửi bạn thông tin chi tiết trên MFILM nhé! 😊").
     * Nếu hỏi về tổng số tập phim toàn hệ thống: Trả lời chuẩn xác: "Hiện tại toàn bộ hệ thống MFILM đang có tổng cộng **${totalEpisodes} tập phim** phục vụ người xem nhé! 🍿".
     * Nếu hỏi về số phim theo từng gói:
       + BẮT BUỘC dùng đúng tên chuẩn của từng gói cước: **Gói Free**, **Gói Basic**, **Gói Plus**, **Gói Premium**...
       + BẮT BUỘC trả lời chính xác từng con số theo mục [THỐNG KÊ CHI TIẾT TOÀN DIỆN TRÊN MFILM] bên dưới.
       + Sử dụng các dấu gạch đầu dòng (-) hoặc chấm tròn (•) rõ ràng, KHÔNG DÙNG BẢNG MARKDOWN có ký tự |.
5. TRA CỨU MỘT BỘ PHIM / SERIES / VŨ TRỤ PHIM / NHÂN VẬT (CỰC KỲ QUAN TRỌNG):
   - Khi người dùng hỏi về một bộ phim hoặc một series (Ví dụ: "tổng phim của bộ slime", "bộ naruto có mấy phim", "nhân vật Rudeus có ở phim nào"...):
     + BẮT BUỘC GỌI TOOL \`tra_cuu_phim\` với tham số \`tu_khoa\` hoặc \`nhan_vat\` để tra cứu chính xác các phần phim hiện có trên MFILM.
     + Dựa vào kết quả tool trả về để trả lời:
       * Tổng số phần/bộ phim của series đó hiện có trên MFILM.
       * Tổng số tập phim của series đó.
       * Liệt kê từng phần kèm link [Tên Phim](/phim/slug), số tập của từng phần và gói cước tương ứng.
       * TUYỆT ĐỐI KHÔNG tự bịa số tập hoặc lấy dữ liệu ngoài web.
   - Khi người dùng hỏi về phim đang xem hoặc nói "trả lời lại", "phim này có mấy tập":
     + BẮT BUỘC lấy chính xác số tập từ [THÔNG TIN PHIM NGƯỜI DÙNG ĐANG XEM] (Mục "Số tập: X tập").
     + TUYỆT ĐỐI KHÔNG lặp lại con số sai từ các tin nhắn cũ trong lịch sử trò chuyện.
6. QUY TẮC NHẬN BIẾT GÓI CỦA NGƯỜI DÙNG VÀ GỢI Ý PHIM PHÙ HỢP (CỰC KỲ QUAN TRỌNG):
   - Hãy xem kỹ [THÔNG TIN TÀI KHOẢN VÀ GÓI ĐĂNG KÝ CỦA NGƯỜI DÙNG HIỆN TẠI]:
     + Nếu người dùng đang có gói trả phí (như PLUS, VIP, PREMIUM, BASIC, ADMIN... Level > 0):
       * TUYỆT ĐỐI KHÔNG ĐƯỢC NÓI người dùng đang ở gói Free!
       * Khi người dùng hỏi "các phim phù hợp với gói hiện tại của tôi", "gói của tôi xem được phim gì", "tôi xem được những phim nào":
         - Chào bạn và xác nhận rõ ràng: "Bạn hiện đang sở hữu gói **${userPlanInfo?.name || 'PLUS'}**...".
         - Gợi ý 3 - 5 bộ phim hay và đặc sắc mà gói của họ được quyền xem (các phim gói Free và các phim có Level <= ${Number(userPlanInfo?.level) || 1}) kèm link [Tên Phim](/phim/slug) và 1 câu mô tả cuốn hút.
     + Nếu người dùng ở gói FREE hoặc chưa đăng nhập (Level = 0):
       * Thông báo bạn hiện đang ở gói Free (hoặc chưa đăng nhập).
       * Gợi ý các bộ phim thuộc gói [Free], đồng thời kèm lời mời [Nâng Cấp Gói VIP](/upgrade) nếu muốn mở khóa thêm nhiều phim hấp dẫn khác.
   - Khi người dùng hỏi tìm/gợi ý **phim gói Free**: Chỉ gợi ý các phim thuộc gói Free.
   - Khi người dùng hỏi tìm **phim trả phí / VIP / Premium / các gói cước**: Giới thiệu các bộ phim có phí hoặc thông tin gói cước kèm link [Nâng Cấp VIP](/upgrade).
   - Khi người dùng hỏi về phim đang xem thuộc gói nào: Dựa vào thông tin [THÔNG TIN PHIM NGƯỜI DÙNG ĐANG XEM] -> "Phí xem" để trả lời chính xác.
7. KHI GỢI Ý PHIM THEO THỂ LOẠI HOẶC PHIM HAY / PHIM HOT:
   - Nếu người dùng hỏi gợi ý phim hay / phim hot / phim mới / phim xem nhiều: Chọn 3 - 5 phim tiêu biểu và hay nhất trong danh sách.
   - Mỗi phim gợi ý kèm link [Tên Phim](/phim/slug) và 1 câu mô tả ngắn gọn, lôi cuốn về nội dung hoặc điểm đặc sắc của phim.
8. TƯ VẤN PHIM THEO TÂM TRẠNG & THỜI LƯỢNG RẢNH (CỰC KỲ THÔNG MINH):
   - Khi người dùng tâm sự về cảm xúc (buồn, stress, mệt mỏi, cần nụ cười, muốn hồi hộp, lãng mạn cùng người yêu...):
     + Luôn lắng nghe, thấu cảm và đưa ra lời động viên ấm áp.
     + Gợi ý các bộ phim phù hợp nhất với tâm trạng (Buồn/Stress -> Hài hước, Hoạt hình chữa lành; Muốn gay cấn -> Hành động, Trinh thám, Kinh dị...).
   - Khi người dùng hỏi theo thời gian rảnh (chỉ rảnh 20-30 phút, phim ngắn xem nhanh, hoặc cày đêm dài tập):
     + Thời gian ngắn (< 30 phút): Gợi ý các tập Anime ngắn hoặc phim lẻ thời lượng vừa phải.
     + Thời gian dài: Gợi ý các Series nhiều tập cuốn hút.
9. MINI-GAME ĐỐ VUI ĐIỆN ẢNH (FILM TRIVIA / QUIZ - QUẢN TRÒ SÔI NỔI):
   - Khi người dùng yêu cầu đố vui (Ví dụ: "đố tôi về phim X", "chơi quiz", "đố vui anime"...):
     + Đóng vai người quản trò cực kỳ sôi nổi, hài hước và nhiệt huyết.
     + Đưa ra câu hỏi trắc nghiệm kịch tính với 4 đáp án A, B, C, D rõ ràng, kèm lời thách đố vui vẻ.
   - KHI NGƯỜI DÙNG GỬI ĐÁP ÁN (Ví dụ người dùng nhắn "A", "b", "C", "D" hoặc nội dung đáp án):
     + NGHIÊM CẤM TUYỆT ĐỐI KHÔNG ĐƯỢC chỉ trả lời 1 ký tự cộc lốc (như chỉ gõ "C", "B", "Đúng" hay "Sai")!
     + BẮT BUỘC phải phản hồi đầy đủ cảm xúc 3 phần:
       1. Công bố kết quả hào hứng: 
          - Nếu đúng: "🎉 **Chính xác 100%!** Bạn quá am hiểu bộ phim này luôn! 👏✨"
          - Nếu sai: "😅 **Tiếc quá, chưa chính xác rồi!** Đáp án đúng của câu này phải là **[Chữ cái]. [Tên đáp án]** cơ!"
       2. Giải thích / Bình luận thú vị 1-2 câu về tình tiết, nhân vật hoặc bối cảnh trong phim để người chơi thấy lôi cuốn.
       3. Lời mời tiếp tục: "Bạn có muốn mình đố tiếp 1 câu nữa để thử tài không nào? Sẵn sàng thì bảo mình nhé! 🎮🔥"
10. PHONG CÁCH GIAO TIẾP VÀ THÁI ĐỘ PHỤC VỤ (CỰC KỲ QUAN TRỌNG):
   - Luôn giữ thái độ thân thiện, lễ phép, lịch sự, nhiệt tình, có văn hóa và duyên dáng (như một người bạn rành phim đồng hành cùng người xem).
   - Có lời mở đầu tự nhiên, nhã nhặn (Ví dụ: "Dạ chào bạn, mình xin gửi bạn thông tin chi tiết nhé! 🍿").
   - Luôn có câu kết lịch sự, chu đáo (Ví dụ: "Chúc bạn có những phút giây xem phim thật thư giãn! Nếu bạn muốn tìm thêm phim gì thì cứ nhắn mình nhé! 😊").
   - NGHIÊM CẤM TUYỆT ĐỐI việc trả lời cộc lốc, cụt lủn một vài chữ cái hoặc một từ trơ trọi (như 'A', 'B', 'C', 'Đúng', 'Sai', 'Ok', 'Ừ'). Mọi câu trả lời đều phải có đại từ nhân xưng xưng hô thân mật, đầy đủ chủ ngữ vị ngữ và biểu cảm ấm áp, vui vẻ.
   - Luôn in đậm **từ khóa quan trọng** (tên phim, diễn viên, nhân vật, thể loại, số lượng).
11. TUYỆT ĐỐI KHÔNG DÙNG BẢNG MARKDOWN: CẤM DÙNG KÝ TỰ | HOẶC |---|---| TRONG CÂU TRẢ LỜI. Mọi danh sách, thống kê đều dùng gạch đầu dòng (-) hoặc chấm tròn (•) để hiển thị thông thoáng, dễ đọc trên khung chat điện thoại.

[THỐNG KÊ CHI TIẾT TOÀN DIỆN TRÊN MFILM]:
- Tổng số phim hiện có trên website MFILM: ${totalMovies} bộ phim (Gồm ${freeMoviesCount} phim Gói Free và ${paidMoviesCount} phim Gói trả phí).
- Tổng số tập phim (episodes) trong toàn bộ hệ thống: ${totalEpisodes} tập phim.
- Chi tiết số lượng phim theo từng gói:
${planStatsText}
- Tổng số thể loại phim: ${totalCategories} thể loại (${categoryList}).
- Tổng số nhân vật trong hệ thống: ${totalCharacters} nhân vật.
- Tổng số diễn viên: ${totalActors} diễn viên.
- Tổng số tác giả / đạo diễn: ${totalAuthors} người.

[DANH SÁCH 20 PHIM TIÊU BIỂU NỔI BẬT NHẤT TRONG TỔNG SỐ ${totalMovies} PHIM]:
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
            const cleanSearch = normalizeTokens(rawQuery).join(' ') || rawQuery;
            window.dispatchEvent(new CustomEvent('OPEN_SEARCH', { detail: cleanSearch }));
            replyText = `Đã tìm kiếm từ khóa "${cleanSearch}" cho bạn!`;
        }
    } else if (args.action === 'search' && args.searchQuery) {
        const cleanSearch = normalizeTokens(args.searchQuery).join(' ') || args.searchQuery;
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
    userPlanInfo = { name: 'FREE', level: 0 }
}) => {
    let filtered = [...movies];

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

    if (args.the_loai) {
        const catKw = normalizeTokens(args.the_loai).join(' ').toLowerCase();
        const matchedCats = categories.filter(c => {
            const cName = normalizeTokens(c.name).join(' ').toLowerCase();
            return cName.includes(catKw) || catKw.includes(cName) || isFuzzyMatch(catKw, cName);
        });
        const matchedCatIds = matchedCats.map(c => String(c.id));
        
        if (matchedCatIds.length > 0) {
            filtered = filtered.filter(m => {
                const list = m.listCategory || [];
                return list.some(catId => matchedCatIds.includes(String(catId)));
            });
        }
    }

    if (args.quoc_gia) {
        const countryKw = String(args.quoc_gia).toLowerCase();
        filtered = filtered.filter(m => 
            (m.country && m.country.toLowerCase().includes(countryKw)) ||
            (m.countriesID && String(m.countriesID).toLowerCase().includes(countryKw))
        );
    }

    // Các từ khóa tìm kiếm: nhan_vat, dien_vien, tac_gia, tu_khoa
    const searchTerms = [
        args.nhan_vat,
        args.dien_vien,
        args.tac_gia,
        args.tu_khoa
    ].filter(Boolean);

    const GENERIC_RECOMMEND_INTENTS = new Set([
        'hay', 'hot', 'moi', 'top', 'de xuat', 'goi y', 'phim hay', 'phim hot', 'phim moi', 
        'thinh hanh', 'xem nhieu', 'xem gi', 'chieu rap', 'phim', 'bo phim', 'phim gi', 'k ban', 'k', 'co phim nao hay',
        'goi hien tai', 'goi cua toi', 'phu hop voi goi', 'phu hop voi goi hien tai'
    ]);

    for (const rawKw of searchTerms) {
        const lowerKw = String(rawKw).toLowerCase().trim();
        if (['premium', 'prenium', 'vip', 'basic', 'plus', 'co phi', 'tra phi'].includes(lowerKw)) {
            filtered = filtered.filter(m => !getMoviePlanInfo(m, plans).isFree);
            continue;
        } else if (['free', 'mien phi'].includes(lowerKw)) {
            filtered = filtered.filter(m => getMoviePlanInfo(m, plans).isFree);
            continue;
        } else if (lowerKw.includes('goi cua toi') || lowerKw.includes('phu hop voi goi')) {
            const userLevel = Number(userPlanInfo?.level) || 0;
            filtered = filtered.filter(m => getMoviePlanInfo(m, plans).level <= userLevel);
            continue;
        }

        const kwTokens = normalizeTokens(rawKw);

        // Nếu từ khóa chỉ là ý định xin gợi ý phim hay / phim hot / đề xuất -> không lọc theo chuỗi cứng mà giữ lại phim để sort theo views
        if (GENERIC_RECOMMEND_INTENTS.has(lowerKw) || kwTokens.length === 0 || kwTokens.every(t => ['hay', 'hot', 'moi', 'top'].includes(t))) {
            continue;
        }

        filtered = filtered.filter(m => {
            const mName = String(m.name || '');
            const mOther = String(m.otherName || '');
            const mDesc = String(m.description || '');

            const mCharIds = m.character || m.characters || m.listCharacter || [];
            const charNames = characters.filter(c => mCharIds.includes(c.id) || (typeof c === 'object' && mCharIds.includes(c))).map(c => c.name);

            const mActorIds = m.actor || m.actors || m.listActor || [];
            const actorNames = actors.filter(a => mActorIds.includes(a.id) || (typeof a === 'object' && mActorIds.includes(a))).map(a => a.name);

            const mAuthorIds = m.listAuthor || (m.author ? [m.author] : []);
            const authorNames = authors.filter(a => mAuthorIds.includes(a.id) || m.author === a.id).map(a => a.name);

            // 1. Direct contains check
            const allText = [mName, mOther, mDesc, ...charNames, ...actorNames, ...authorNames].join(' ').toLowerCase();
            if (allText.includes(lowerKw)) return true;

            // 2. Token overlap check
            if (kwTokens.length > 0 && kwTokens.some(t => allText.includes(t))) return true;

            // 3. Fuzzy typo check for each target
            if (isFuzzyMatch(rawKw, mOther) || isFuzzyMatch(rawKw, mName)) return true;
            if (charNames.some(cName => isFuzzyMatch(rawKw, cName))) return true;
            if (actorNames.some(aName => isFuzzyMatch(rawKw, aName))) return true;
            if (authorNames.some(auName => isFuzzyMatch(rawKw, auName))) return true;

            return false;
        });
    }
    
    filtered.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    const resultList = filtered.length > 0 ? filtered.slice(0, 6) : [];

    if (resultList.length === 0) {
        return "Không tìm thấy bộ phim nào phù hợp với yêu cầu.";
    }

    const totalFound = filtered.length;
    const totalEpsFound = filtered.reduce((sum, m) => sum + (Number(m.endEpisode) || Number(m.totalEpisodes) || 1), 0);

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

    return `Tìm thấy ${totalFound} bộ/phần phim liên quan trên hệ thống MFILM (Tổng cộng: ${totalEpsFound} tập phim):\n${topMatches}`;
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
                    phu_hop_goi_user: { type: "boolean", description: "Đặt là true khi người dùng hỏi các phim phù hợp với gói hiện tại của họ" }
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
                        phu_hop_goi_user: { type: "BOOLEAN", description: "Đặt là true khi người dùng hỏi các phim phù hợp với gói hiện tại của họ" }
                    }
                }
            }
        ]
    }
];

