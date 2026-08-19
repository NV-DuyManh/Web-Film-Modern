import React from 'react';
import { Link } from 'react-router-dom';

export const STOP_WORDS = new Set(['phim', 'bo', 'tap', 'xem', 'mo', 'cho', 'toi', 'co', 'nay', 'va', 'la', 'nhung', 'cac', 'the']);

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
 * Thuật toán tìm phim chính xác dựa trên chấm điểm từ khóa (Scoring Algorithm)
 */
export const findTargetMovie = (query, movies = []) => {
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

    return highestScore >= 100 ? bestMovie : null;
};

/**
 * Lấy thông tin gói cước và trạng thái miễn phí/có phí của phim
 */
export const getMoviePlanInfo = (movie, plans = []) => {
    if (!movie?.planID) return { isFree: true, planName: 'Miễn phí', level: 0 };
    const plan = (plans || []).find(p => String(p.id) === String(movie.planID));
    if (!plan || Number(plan.level) === 0) {
        return { isFree: true, planName: 'Miễn phí', level: 0 };
    }
    return { isFree: false, planName: plan.name || 'VIP', level: Number(plan.level) || 1 };
};

/**
 * Xây dựng danh mục phim tóm tắt cho prompt để AI luôn biết chính xác phim nào có trong website (tối ưu token)
 */
export const buildMovieCatalogSummary = (movies = [], categories = [], plans = []) => {
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
        const title = m.otherName || m.name || 'Không rõ';
        const origTitle = (m.name && m.otherName && m.name !== m.otherName) ? ` (${m.name})` : '';
        const slug = m.slug || m.id;
        const views = (Number(m.views) || 0) + 100;
        const feeStatus = planInfo.isFree ? '[MIỄN PHÍ]' : `[CÓ PHÍ - Gói ${planInfo.planName}]`;
        return `- [${slug}] "${title}"${origTitle} | ${feeStatus} | Thể loại: ${catNames} | Lượt xem: ${views}`;
    }).join('\n');
};

/**
 * Xây dựng prompt huấn luyện AI và nạp ngữ cảnh trang phim đang xem
 */
export const buildSystemInstruction = ({ 
    movies = [], 
    currentMovie, 
    authors = [], 
    actors = [], 
    categories = [], 
    allComments = [], 
    allReviews = [],
    plans = []
}) => {
    const movieCatalog = buildMovieCatalogSummary(movies, categories, plans);
    const categoryList = (categories || []).map(c => c.name).filter(Boolean).join(', ');

    let currentMovieContext = "";
    if (currentMovie) {
        const planInfo = getMoviePlanInfo(currentMovie, plans);
        const movieAuthors = authors.filter(a => (currentMovie.listAuthor || []).includes(a.id) || currentMovie.author === a.id).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const movieActors = actors.filter(a => (currentMovie.listActor || []).includes(a.id) || (currentMovie.actors || []).includes(a.id)).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const movieCategories = categories.filter(c => (currentMovie.listCategory || []).includes(c.id)).map(c => c.name).join(', ') || 'Chưa cập nhật';
        const cmtCount = allComments.filter(c => c.movieID === currentMovie.id).length;
        const reviewCount = allReviews.filter(r => r.movieID === currentMovie.id || r.movieId === currentMovie.id).length;
        const feeDescription = planInfo.isFree 
            ? "MIỄN PHÍ (Người dùng có thể xem toàn bộ phim mà không mất phí)" 
            : `CÓ PHÍ (Yêu cầu mua gói ${planInfo.planName} hoặc Mua/Thuê phim để xem các tập có khóa 🔒)`;

        currentMovieContext = `\n\n[THÔNG TIN PHIM NGƯỜI DÙNG ĐANG XEM]:
- Tên phim: "${currentMovie.otherName || currentMovie.name}"
- Slug: ${currentMovie.slug || currentMovie.id}
- Phí xem: ${feeDescription}
- Tác giả / Đạo diễn: ${movieAuthors}
- Diễn viên: ${movieActors}
- Thể loại: ${movieCategories}
- Lượt xem: ${(Number(currentMovie.views) || 0) + 100} lượt
- Số lượt bình luận (cmt / comment): ${cmtCount} bình luận
- Số lượt đánh giá (review): ${reviewCount} đánh giá
- Năm phát hành: ${currentMovie.releaseYear || currentMovie.year || 'N/A'}
- Số tập: ${currentMovie.endEpisode || currentMovie.totalEpisodes || 1} tập
- Trạng thái: ${currentMovie.status || ''}
- Mô tả: ${currentMovie.description || ''}`;
    }

    return `Bạn là trợ lý AI thông minh, nhiệt tình của website xem phim MFILM.

QUY TẮC CỐT LÕI VỀ DỮ LIỆU (BẮT BUỘC TUÂN THỦ 100%):
1. TUYỆT ĐỐI KHÔNG TỰ BỊA PHIM: CHỈ ĐƯỢC gợi ý các bộ phim CÓ THẬT trong [DANH SÁCH PHIM HIỆN CÓ TRONG HỆ THỐNG] bên dưới hoặc kết quả từ công cụ tra cứu tra_cuu_phim. Tuyệt đối không tự sáng tác, dịch nghĩa hoặc bịa ra bất kỳ tên phim nào không tồn tại trong hệ thống.
2. ĐỊNH DẠNG LINK PHIM: Khi nhắc đến hoặc gợi ý bất kỳ bộ phim nào, BẮT BUỘC dùng cú pháp: [Tên Phim](/phim/slug-chinh-xac). Lấy đúng slug trong dấu ngoặc vuông [slug] ở danh sách bên dưới.
   Ví dụ: [Đấu La Đại Lục](/phim/dau-la-dai-luc)
3. ĐỊNH DẠNG LINK THỂ LOẠI: Khi gợi ý thể loại, dùng cú pháp: [Tên Thể Loại](/category/Tên Thể Loại). Ví dụ: [Hành Động](/category/Hành Động).
4. QUY TẮC PHIM MIỄN PHÍ VÀ CÓ PHÍ (CỰC KỲ QUAN TRỌNG):
   - Phim có nhãn [MIỄN PHÍ]: Là phim xem hoàn toàn MIỄN PHÍ, không mất tiền, không cần tài khoản VIP.
   - Phim có nhãn [CÓ PHÍ - Gói ...]: Là phim TRẢ PHÍ (Basic, VIP, Premium...), cần nâng cấp gói hoặc mua phim mới xem được, KHÔNG PHẢI phim miễn phí!
   - Khi người dùng hỏi tìm/gợi ý **phim miễn phí (free, không tốn tiền, xem miễn phí)**: TUYỆT ĐỐI CHỈ gợi ý các phim có nhãn [MIỄN PHÍ]. TUYỆT ĐỐI KHÔNG ĐƯỢC gợi ý các phim [CÓ PHÍ] (ví dụ: các phim có gói Basic/VIP như Thất Nghiệp Chuyển Sinh).
   - Khi người dùng hỏi tìm **phim trả phí / VIP / Premium / Basic / có phí / các gói phim**: Gợi ý các phim hoặc các gói cước có nhãn [CÓ PHÍ - Gói ...] kèm link [Nâng Cấp VIP](/upgrade).
   - Khi người dùng hỏi về phim đang xem có miễn phí không: Hãy dựa vào thông tin [THÔNG TIN PHIM NGƯỜI DÙNG ĐANG XEM] -> "Phí xem" để trả lời chính xác. Nếu phim có phí, hãy hướng dẫn người dùng nhấn nút "Mua phim" hoặc vào [Nâng Cấp VIP](/upgrade).
5. KHI GỢI Ý PHIM THEO THỂ LOẠI HOẶC HOT:
   - Nếu theo thể loại: Lọc đúng các phim thuộc thể loại đó trong danh sách và liệt kê 3 - 5 phim tiêu biểu kèm link.
   - Nếu hỏi phim hot / nhiều lượt xem: Chọn các phim có Lượt xem cao nhất trong danh sách.
   - Định dạng ngắn gọn bằng dấu gạch đầu dòng (-).
6. HỎI GÌ TRẢ LỜI NẤY: Trả lời ngắn gọn, tự nhiên, đi thẳng vào trọng tâm. Luôn in đậm **từ khóa quan trọng** (tên phim, diễn viên, số liệu).
7. TUYỆT ĐỐI KHÔNG DÙNG BẢNG MARKDOWN (không dùng ký tự |---|---| hay |).

[DANH SÁCH THỂ LOẠI CỦA HỆ THỐNG]:
${categoryList || 'Hành Động, Hoạt Hình, Anime, Phiêu Lưu, Tình Cảm, Kinh Dị, Viễn Tưởng, Hài Hước, Cổ Trang'}

[DANH SÁCH PHIM HIỆN CÓ TRONG HỆ THỐNG]:
${movieCatalog}${currentMovieContext}`;
};

/**
 * Xử lý điều khiển giao diện website
 */
export const executeWebsiteControl = ({ args = {}, movies = [], navigate }) => {
    let replyText = "Đã thực hiện yêu cầu của bạn!";

    if (args.action === 'navigate' && args.path) {
        navigate(args.path);
        replyText = "Đã chuyển trang theo yêu cầu của bạn!";
    } else if (args.action === 'open_vip' || args.action === 'upgrade_vip') {
        navigate('/upgrade');
        replyText = "Đã chuyển đến trang nâng cấp gói VIP cho bạn!";
    } else if (args.action === 'open_movie' && (args.movieSlug || args.searchQuery)) {
        const rawQuery = args.movieSlug || args.searchQuery;
        const targetMovie = findTargetMovie(rawQuery, movies);
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
export const executeMovieLookup = ({ args = {}, movies = [], authors = [], actors = [], categories = [], plans = [] }) => {
    let filtered = [...movies];

    if (args.loai_phi === 'free' || args.is_free === true || args.mien_phi === true) {
        filtered = filtered.filter(m => getMoviePlanInfo(m, plans).isFree);
    } else if (args.loai_phi === 'paid' || args.is_free === false || args.mien_phi === false || args.loai_phi === 'premium' || args.loai_phi === 'vip' || args.loai_phi === 'basic') {
        filtered = filtered.filter(m => !getMoviePlanInfo(m, plans).isFree);
    }

    if (args.the_loai) {
        const catKw = normalizeTokens(args.the_loai).join(' ').toLowerCase();
        const matchedCats = categories.filter(c => {
            const cName = normalizeTokens(c.name).join(' ').toLowerCase();
            return cName.includes(catKw) || catKw.includes(cName);
        });
        const matchedCatIds = matchedCats.map(c => String(c.id));
        
        if (matchedCatIds.length > 0) {
            filtered = filtered.filter(m => {
                const list = m.listCategory || [];
                return list.some(catId => matchedCatIds.includes(String(catId)));
            });
        }
    }

    if (args.tu_khoa) {
        const rawKw = String(args.tu_khoa).toLowerCase().trim();
        if (['premium', 'prenium', 'vip', 'basic', 'co phi', 'tra phi'].includes(rawKw)) {
            filtered = filtered.filter(m => !getMoviePlanInfo(m, plans).isFree);
        } else if (['free', 'mien phi'].includes(rawKw)) {
            filtered = filtered.filter(m => getMoviePlanInfo(m, plans).isFree);
        } else {
            const kw = rawKw;
            const tokens = normalizeTokens(kw);
            filtered = filtered.filter(m => {
                const mName = String(m.name || '').toLowerCase();
                const mOther = String(m.otherName || '').toLowerCase();
                const mDesc = String(m.description || '').toLowerCase();
                return mName.includes(kw) || mOther.includes(kw) || mDesc.includes(kw) ||
                    tokens.some(t => mName.includes(t) || mOther.includes(t));
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
    
    filtered.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    const resultList = filtered.length > 0 ? filtered.slice(0, 6) : [];

    if (resultList.length === 0) {
        return "Không tìm thấy bộ phim nào phù hợp với yêu cầu.";
    }

    const topMatches = resultList.map(m => {
        const planInfo = getMoviePlanInfo(m, plans);
        const authNames = authors.filter(a => (m.listAuthor || []).includes(a.id) || m.author === a.id).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const actNames = actors.filter(a => (m.listActor || []).includes(a.id)).map(a => a.name).slice(0, 3).join(', ') || 'Chưa cập nhật';
        const catNames = (m.listCategory || []).map(catId => categories.find(c => String(c.id) === String(catId))?.name).filter(Boolean).join(', ') || 'Đang cập nhật';
        const feeStr = planInfo.isFree ? 'MIỄN PHÍ' : `CÓ PHÍ (Gói ${planInfo.planName})`;
        return `Tên: ${m.otherName || m.name} | Gốc: ${m.name || ''} | Phí xem: ${feeStr} | Thể loại: ${catNames} | Tác giả: ${authNames} | Diễn viên: ${actNames} | Lượt xem: ${(Number(m.views) || 0) + 100} | Năm: ${m.releaseYear || m.year || ''} | Slug: ${m.slug || m.id} | Link: [${m.otherName || m.name}](/phim/${m.slug || m.id})`;
    }).join('\n');

    return topMatches;
};

/**
 * Render Markdown: in đậm (**từ khóa** hoặc *từ khóa*)
 */
export const renderFormattedText = (text) => {
    if (!text) return null;
    const boldParts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return boldParts.map((bPart, bIdx) => {
        const doubleMatch = bPart.match(/^\*\*(.*?)\*\*$/);
        if (doubleMatch) {
            return <strong key={bIdx} className="font-bold text-black">{doubleMatch[1]}</strong>;
        }
        const singleMatch = bPart.match(/^\*(.*?)\*$/);
        if (singleMatch) {
            return <strong key={bIdx} className="font-bold text-black">{singleMatch[1]}</strong>;
        }
        return bPart;
    });
};

/**
 * Render tin nhắn chat với link chuyển trang và chữ in đậm
 */
export const renderMessage = (text, onLinkClick) => {
    if (!text) return null;
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    
    return parts.map((part, index) => {
        const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (match) {
            return (
                <Link 
                    key={index} 
                    to={match[2]} 
                    onClick={() => {
                        if (typeof onLinkClick === 'function') {
                            onLinkClick();
                        }
                    }}
                    className="font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                >
                    {match[1]}
                </Link>
            );
        }
        return <span key={index}>{
            part.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                    {renderFormattedText(line)}
                    {i < part.split('\n').length - 1 && <br />}
                </React.Fragment>
            ))
        }</span>;
    });
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
            description: "Tra cứu danh sách phim trong hệ thống khi người dùng hỏi gợi ý phim, tìm phim theo thể loại, quốc gia, hoặc lọc theo miễn phí / có phí.",
            parameters: {
                type: "object",
                properties: {
                    tu_khoa: { type: "string", description: "Từ khóa tìm kiếm" },
                    the_loai: { type: "string", description: "Thể loại phim" },
                    quoc_gia: { type: "string", description: "Quốc gia" },
                    loai_phi: { type: "string", description: "Lọc phim: 'free' (chỉ phim miễn phí), 'paid' (chỉ phim có phí/VIP)" }
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
                description: "Tra cứu danh sách phim trong hệ thống khi người dùng hỏi gợi ý phim, tìm phim theo thể loại, quốc gia, hoặc lọc theo miễn phí / có phí.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tu_khoa: { type: "STRING", description: "Từ khóa tìm kiếm" },
                        the_loai: { type: "STRING", description: "Thể loại phim" },
                        quoc_gia: { type: "STRING", description: "Quốc gia" },
                        loai_phi: { type: "STRING", description: "Lọc phim: 'free' (chỉ phim miễn phí), 'paid' (chỉ phim có phí/VIP)" }
                    }
                }
            }
        ]
    }
];
