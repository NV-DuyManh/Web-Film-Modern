/**
 * Module xử lý bản quyền, phân quyền gói cước và hậu kiểm AI cho MFILM
 */

export const normalizeVietnameseTypo = (str) => {
    if (!str) return '';
    return str
        .toString()
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
 * Lấy tên hiển thị chuẩn hóa cho người dùng (Free, Plus, Premium, Admin)
 */
export const getHumanPlanName = (userPlanInfo) => {
    if (!userPlanInfo || !userPlanInfo.name) return 'Free';
    let name = String(userPlanInfo.name).trim();
    if (name.toUpperCase() === 'PRENIUM') name = 'Premium';
    else if (name.toUpperCase() === 'FREE') name = 'Free';
    else if (name.toUpperCase() === 'PLUS') name = 'Plus';
    else if (name.toUpperCase() === 'ADMIN') name = 'Admin';
    return name;
};

/**
 * Kiểm tra xem câu truy vấn có phải là yêu cầu xem phim theo gói cước của tài khoản hay không
 */
export const isPlanAppropriateQuery = (query) => {
    if (!query || typeof query !== 'string') return false;
    const clean = searchTV(query).trim();
    return (
        (clean.includes('phu hop') && clean.includes('goi')) ||
        (clean.includes('hop goi')) ||
        (clean.includes('goi cua toi')) ||
        (clean.includes('goi hien tai')) ||
        (clean.includes('goi tai khoan')) ||
        (clean.includes('theo goi') && clean.includes('phim'))
    );
};

/**
 * Bộ lọc bản quyền/gói cước tất định (Deterministic Entitlement Filter):
 * Chỉ giữ lại các phim mà người dùng có quyền xem (movieLevel <= userLevel)
 */
export const filterMoviesByEntitlement = (movies = [], plans = [], userPlanInfo = null) => {
    const userLevel = Number(userPlanInfo?.level) || 0;
    return (movies || []).filter(movie => {
        const moviePlan = getMoviePlanInfo(movie, plans);
        return Number(moviePlan.level) <= userLevel;
    });
};

/**
 * Xác thực và hậu kiểm kết quả trả về từ AI (Post-AI Validation):
 * 1. Kiểm tra từng phim xuất hiện trong text: slug/id phải tồn tại trong catalog thực tế
 * 2. Quyền xem của phim phải phù hợp với gói người dùng (movieLevel <= userLevel)
 * 3. Loại bỏ các phim bị trùng lặp hoặc phim vượt gói
 * 4. Nếu toàn bộ phim gợi ý bị rớt do AI sinh sai/vượt quyền, cung cấp danh sách phim hợp lệ dự phòng
 */
export const validateAndFilterAiResponse = (responseText, movies = [], plans = [], userPlanInfo = null, isPlanSpecific = false) => {
    if (!responseText || typeof responseText !== 'string') return responseText;
    if (!isPlanSpecific || !userPlanInfo) return responseText;

    const userLevel = Number(userPlanInfo.level) || 0;
    const lines = responseText.split('\n');
    const validLines = [];
    const seenSlugs = new Set();
    let validMovieCount = 0;

    for (const line of lines) {
        const match = line.match(/\/phim\/([a-zA-Z0-9_-]+)/i);
        if (match) {
            const slug = match[1].toLowerCase().trim();
            // Kiểm tra slug có trong danh mục phim thực tế không
            const movie = (movies || []).find(m => 
                String(m.slug || '').toLowerCase().trim() === slug || 
                String(m.id || '').toLowerCase() === slug
            );

            // Nếu không có trong catalog -> BỎ QUA dòng này (chống AI hallucination)
            if (!movie) {
                continue;
            }

            // Kiểm tra phân quyền gói cước: cấp độ phim không được vượt quá cấp độ người dùng
            const moviePlan = getMoviePlanInfo(movie, plans);
            if (moviePlan.level > userLevel) {
                // BỎ QUA dòng phim vượt quyền (chống phim Plus/Premium lọt vào câu trả lời của user Free)
                continue;
            }

            const movieKey = String(movie.id || movie.slug);
            if (seenSlugs.has(movieKey)) {
                // BỎ QUA phim trùng lặp trong cùng 1 câu trả lời
                continue;
            }
            seenSlugs.add(movieKey);
            validMovieCount++;
        }
        validLines.push(line);
    }

    let sanitized = validLines.join('\n').trim();

    // Nếu AI sinh toàn phim vượt quyền hoặc bị loại hết, thay thế bằng danh sách phim hợp lệ thực tế
    if (validMovieCount === 0) {
        const allowedList = (movies || [])
            .filter(m => getMoviePlanInfo(m, plans).level <= userLevel)
            .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
            .slice(0, 5);

        const planDisplayName = getHumanPlanName(userPlanInfo);
        if (allowedList.length > 0) {
            const fallbackMovies = allowedList.map(m => {
                const title = m.otherName || m.name;
                const slug = m.slug || m.id;
                const epStr = m.endEpisode ? `${m.endEpisode} tập` : '1 tập';
                return `- [${title}](/phim/${slug}) • ${epStr}`;
            }).join('\n');

            sanitized = `Với gói ${planDisplayName} hiện tại của bạn, bạn có thể xem các bộ phim hấp dẫn sau đây:\n\n${fallbackMovies}\n\nChúc bạn có những giây phút xem phim thật vui vẻ trên MFILM! 🍿`;
        }
    }

    return sanitized;
};
