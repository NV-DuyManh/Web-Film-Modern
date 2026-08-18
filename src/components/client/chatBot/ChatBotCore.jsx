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
 * Xây dựng danh mục phim tóm tắt cho prompt để AI luôn biết chính xác phim nào có trong website (tối ưu token)
 */
export const buildMovieCatalogSummary = (movies = [], categories = []) => {
    if (!movies || movies.length === 0) return "Chưa có phim nào trong hệ thống.";
    
    // Lấy top 15 phim tiêu biểu nhất để tối ưu tốc độ và giới hạn token
    const sorted = [...movies].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    return sorted.slice(0, 15).map(m => {
        const catNames = (m.listCategory || [])
            .map(catId => categories.find(c => String(c.id) === String(catId))?.name)
            .filter(Boolean)
            .join(', ') || 'Chung';
        const title = m.otherName || m.name || 'Không rõ';
        const origTitle = (m.name && m.otherName && m.name !== m.otherName) ? ` (Tên gốc: ${m.name})` : '';
        const slug = m.slug || m.id;
        const views = (Number(m.views) || 0) + 100;
        return `- [${slug}] "${title}"${origTitle} | Thể loại: ${catNames} | Lượt xem: ${views}`;
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
    allReviews = [] 
}) => {
    const movieCatalog = buildMovieCatalogSummary(movies, categories);
    const categoryList = (categories || []).map(c => c.name).filter(Boolean).join(', ');

    let currentMovieContext = "";
    if (currentMovie) {
        const movieAuthors = authors.filter(a => (currentMovie.listAuthor || []).includes(a.id) || currentMovie.author === a.id).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const movieActors = actors.filter(a => (currentMovie.listActor || []).includes(a.id) || (currentMovie.actors || []).includes(a.id)).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const movieCategories = categories.filter(c => (currentMovie.listCategory || []).includes(c.id)).map(c => c.name).join(', ') || 'Chưa cập nhật';
        const cmtCount = allComments.filter(c => c.movieID === currentMovie.id).length;
        const reviewCount = allReviews.filter(r => r.movieID === currentMovie.id || r.movieId === currentMovie.id).length;

        currentMovieContext = `\n\n[THÔNG TIN PHIM NGƯỜI DÙNG ĐANG XEM]:
- Tên phim: "${currentMovie.otherName || currentMovie.name}"
- Slug: ${currentMovie.slug || currentMovie.id}
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
1. TUYỆT ĐỐI KHÔNG TỰ BỊA PHIM: CHỈ ĐƯỢC gợi ý các bộ phim CÓ THẬT trong [DANH SÁCH PHIM HIỆN CÓ TRONG HỆ THỐNG] bên dưới. Tuyệt đối không tự sáng tác, dịch nghĩa hoặc bịa ra bất kỳ tên phim nào không tồn tại trong hệ thống.
2. ĐỊNH DẠNG LINK PHIM: Khi nhắc đến hoặc gợi ý bất kỳ bộ phim nào, BẮT BUỘC dùng cú pháp: [Tên Phim](/phim/slug-chinh-xac). Lấy đúng slug trong dấu ngoặc vuông [slug] ở danh sách bên dưới.
   Ví dụ: [Đấu La Đại Lục](/phim/dau-la-dai-luc)
3. ĐỊNH DẠNG LINK THỂ LOẠI: Khi gợi ý thể loại, dùng cú pháp: [Tên Thể Loại](/category/Tên Thể Loại). Ví dụ: [Hành Động](/category/Hành Động).
4. KHI GỢI Ý PHIM:
   - Nếu người dùng yêu cầu gợi ý phim theo thể loại (như hành động, anime, tình cảm, viễn tưởng...): Hãy lọc đúng các phim thuộc thể loại đó trong danh sách và liệt kê 3 - 5 phim tiêu biểu kèm link.
   - Nếu hỏi phim hot / nhiều lượt xem: Chọn các phim có Lượt xem cao nhất trong danh sách.
   - Định dạng ngắn gọn bằng dấu gạch đầu dòng (-).
5. HỎI GÌ TRẢ LỜI NẤY: Trả lời ngắn gọn, tự nhiên, đi thẳng vào trọng tâm. Luôn in đậm **từ khóa quan trọng** (tên phim, diễn viên, số liệu).
6. TUYỆT ĐỐI KHÔNG DÙNG BẢNG MARKDOWN (không dùng ký tự |---|---| hay |).

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
export const executeMovieLookup = ({ args = {}, movies = [], authors = [], actors = [], categories = [] }) => {
    let filtered = [...movies];

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
        const kw = String(args.tu_khoa).toLowerCase();
        const tokens = normalizeTokens(kw);
        filtered = filtered.filter(m => {
            const mName = String(m.name || '').toLowerCase();
            const mOther = String(m.otherName || '').toLowerCase();
            const mDesc = String(m.description || '').toLowerCase();
            return mName.includes(kw) || mOther.includes(kw) || mDesc.includes(kw) ||
                tokens.some(t => mName.includes(t) || mOther.includes(t));
        });
    }

    if (args.quoc_gia) {
        const countryKw = String(args.quoc_gia).toLowerCase();
        filtered = filtered.filter(m => 
            (m.country && m.country.toLowerCase().includes(countryKw)) ||
            (m.countriesID && String(m.countriesID).toLowerCase().includes(countryKw))
        );
    }
    
    filtered.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    const resultList = filtered.length > 0 ? filtered.slice(0, 5) : movies.slice(0, 5);

    const topMatches = resultList.map(m => {
        const authNames = authors.filter(a => (m.listAuthor || []).includes(a.id) || m.author === a.id).map(a => a.name).join(', ') || 'Chưa cập nhật';
        const actNames = actors.filter(a => (m.listActor || []).includes(a.id)).map(a => a.name).slice(0, 3).join(', ') || 'Chưa cập nhật';
        const catNames = (m.listCategory || []).map(catId => categories.find(c => String(c.id) === String(catId))?.name).filter(Boolean).join(', ') || 'Đang cập nhật';
        return `Tên: ${m.otherName || m.name} | Gốc: ${m.name || ''} | Thể loại: ${catNames} | Tác giả: ${authNames} | Diễn viên: ${actNames} | Lượt xem: ${(Number(m.views) || 0) + 100} | Năm: ${m.releaseYear || m.year || ''} | Slug: ${m.slug || m.id} | Link: [${m.otherName || m.name}](/phim/${m.slug || m.id})`;
    }).join('\n');

    return topMatches || "Chưa có phim nào trong hệ thống.";
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
export const renderMessage = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    
    return parts.map((part, index) => {
        const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (match) {
            return (
                <Link 
                    key={index} 
                    to={match[2]} 
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
            description: "Điều khiển giao diện website theo yêu cầu của người dùng. Có thể chuyển trang, mở phim, tìm kiếm, mở form đăng nhập/đăng ký.",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        description: "Hành động: 'navigate', 'open_movie', 'search', 'open_login', 'open_register'."
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
            description: "Tra cứu danh sách phim trong hệ thống khi người dùng hỏi gợi ý phim, tìm phim theo thể loại, quốc gia...",
            parameters: {
                type: "object",
                properties: {
                    tu_khoa: { type: "string", description: "Từ khóa tìm kiếm" },
                    the_loai: { type: "string", description: "Thể loại phim" },
                    quoc_gia: { type: "string", description: "Quốc gia" }
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
                description: "Điều khiển giao diện website theo yêu cầu của người dùng. Có thể chuyển trang, mở phim, tìm kiếm, mở form đăng nhập/đăng ký.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        action: {
                            type: "STRING",
                            description: "Hành động: 'navigate', 'open_movie', 'search', 'open_login', 'open_register'."
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
                description: "Tra cứu danh sách phim trong hệ thống khi người dùng hỏi gợi ý phim, tìm phim theo thể loại, quốc gia...",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tu_khoa: { type: "STRING", description: "Từ khóa tìm kiếm" },
                        the_loai: { type: "STRING", description: "Thể loại phim" },
                        quoc_gia: { type: "STRING", description: "Quốc gia" }
                    }
                }
            }
        ]
    }
];
