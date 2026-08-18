import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import HeaderClient from '../../components/client/header/HeaderClient';
import ClientRouters from '../../routers/ClientRouters';
import FooterClient from '../../components/client/footer/FooterClient';
import LoadingScreen from '../../components/client/loadingScreen/LoadingScreen';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKey } from '../../utils/Constants';
import { useMovies } from '../../hooks/useCollections';

const genAI = new GoogleGenerativeAI(apiKey);
function LayoutClient() {
    const location = useLocation();
    const navigate = useNavigate();
    const scrollMap = useRef({});
    const prevPath = useRef(location.pathname);
    const movies = useMovies();

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: 'Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?', sender: 'ai' }
    ]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isChatOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatOpen]);

    useEffect(() => {
        const handleScroll = () => {
            scrollMap.current[location.pathname] = window.scrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [location.pathname]);

    useLayoutEffect(() => {
        if (prevPath.current !== location.pathname) {
            const targetY = scrollMap.current[location.pathname] || 0;

            window.scrollTo(0, targetY);
            prevPath.current = location.pathname;
        }
    }, [location.pathname]);

    const renderMessage = (text) => {
        if (!text) return null;
        const parts = text.split(/(\[.*?\]\(.*?\))/g);
        
        return parts.map((part, index) => {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
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
                        {line}
                        {i < part.split('\n').length - 1 && <br />}
                    </React.Fragment>
                ))
            }</span>;
        });
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMsg = { id: Date.now(), text: message.trim(), sender: 'user' };
        setMessages((prev) => [...prev, userMsg]);
        setMessage('');
        setIsTyping(true);

        try {
            const systemInstruction = `Bạn là chuyên gia tư vấn phim. Bạn có công cụ tra_cuu_phim để tìm kiếm thông tin phim trong hệ thống khi người dùng hỏi. CHỈ tư vấn dựa trên dữ liệu tìm được, không tự bịa thông tin.

QUAN TRỌNG: 
- Khi gợi ý PHIM, BẮT BUỘC tạo link Markdown: [Tên Phim](/phim/slug-cua-phim). VD: [Spider Man](/phim/spider-man)
- Khi gợi ý THỂ LOẠI, BẮT BUỘC tạo link Markdown: [Tên Thể Loại](/category/Tên Thể Loại). VD: [Hành động](/category/Hành Động)`;

            const tools = [
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
                                        description: "Hành động cần thực hiện. Các giá trị hợp lệ: 'navigate' (chuyển trang chung), 'open_movie' (mở trang chi tiết phim), 'search' (tìm kiếm phim), 'open_login' (mở form đăng nhập), 'open_register' (mở form đăng ký)."
                                    },
                                    path: {
                                        type: "STRING",
                                        description: "Đường dẫn cần chuyển đến (chỉ dùng khi action='navigate'). VD: '/' (trang chủ), '/film-new' (phim mới), '/cinema-movies' (phim chiếu rạp), '/film-coming' (phim sắp chiếu), '/anime' (hoạt hình), '/account/history' (lịch sử xem), '/account/notifications' (thông báo), '/account/subscriptions' (gói đăng ký), '/account/rentMovies' (phim đang thuê)."
                                    },
                                    movieSlug: {
                                        type: "STRING",
                                        description: "Slug hoặc ID của phim cần mở (chỉ dùng khi action='open_movie')."
                                    },
                                    episode: {
                                        type: "NUMBER",
                                        description: "Tập phim muốn mở (chỉ dùng khi action='open_movie'). LƯU Ý: Phải kiểm tra 'Số tập' của phim trong danh sách, nếu tập yêu cầu lớn hơn số tập hiện có thì KHÔNG ĐƯỢC gọi hàm này, hãy trả lời bằng văn bản báo cho người dùng biết phim chỉ có X tập và hỏi họ có muốn mở không."
                                    },
                                    searchQuery: {
                                        type: "STRING",
                                        description: "Từ khóa tìm kiếm (chỉ dùng khi action='search')."
                                    }
                                },
                                required: ["action"]
                            }
                        },
                        {
                            name: "tra_cuu_phim",
                            description: "Tìm kiếm phim trong hệ thống dựa trên từ khóa, thể loại, hoặc quốc gia để lấy thông tin phim trả lời người dùng.",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    tu_khoa: { type: "STRING", description: "Từ khóa tên phim (ví dụ: 'Natra', 'Hành động', để trống nếu không có)" },
                                    the_loai: { type: "STRING", description: "Thể loại phim (ví dụ: 'Hành Động', 'Tình Cảm', để trống nếu không có)" },
                                    quoc_gia: { type: "STRING", description: "Quốc gia (ví dụ: 'Mỹ', 'Hàn Quốc', để trống nếu không có)" }
                                }
                            }
                        }
                    ]
                }
            ];

            const model = genAI.getGenerativeModel({ 
                model: "gemini-3-flash-preview",
                systemInstruction: systemInstruction,
                tools: tools
            });

            // Chuyển lịch sử local sang định dạng Gemini
            const recentMessages = messages.slice(-10).filter(m => m.id !== 1 && m.text); 
            let history = [];
            let lastRole = null;
            for (const m of recentMessages) {
                const role = m.sender === 'user' ? 'user' : 'model';
                if (role === lastRole) continue; 
                if (history.length === 0 && role === 'model') continue; 
                history.push({ role, parts: [{ text: m.text }] });
                lastRole = role;
            }

            const chat = model.startChat({ history: history });
            let result = await chat.sendMessage(userMsg.text);
            let response = await result.response;
            
            let finalAiMsgText = "";
            let loopCount = 0;

            while (loopCount < 5) {
                loopCount++;
                const calls = response.functionCalls();
                
                if (calls && calls.length > 0) {
                    const call = calls[0];
                    if (call.name === "dieu_khien_website") {
                        const args = call.args;
                        let replyText = "Đã thực hiện yêu cầu của bạn!";
                        
                        if (args.action === 'navigate' && args.path) {
                            navigate(args.path);
                            replyText = "Đã chuyển trang theo yêu cầu của bạn!";
                        } else if (args.action === 'open_movie' && args.movieSlug) {
                            const cleanSlug = args.movieSlug.replace(/^\/?phim\//, '');
                            if (args.episode) {
                                navigate(`/xem-phim/${cleanSlug}?tap=${args.episode}`);
                                replyText = `Đã mở tập ${args.episode} của phim cho bạn!`;
                            } else {
                                navigate(`/phim/${cleanSlug}`);
                                replyText = "Đã mở trang chi tiết phim cho bạn!";
                            }
                        } else if (args.action === 'search' && args.searchQuery) {
                            window.dispatchEvent(new CustomEvent('OPEN_SEARCH', { detail: args.searchQuery }));
                            replyText = `Đã mở tìm kiếm với từ khóa: ${args.searchQuery}`;
                        } else if (args.action === 'open_login') {
                            window.dispatchEvent(new CustomEvent('OPEN_LOGIN'));
                            replyText = "Đã mở cửa sổ đăng nhập!";
                        } else if (args.action === 'open_register') {
                            window.dispatchEvent(new CustomEvent('OPEN_REGISTER'));
                            replyText = "Đã mở cửa sổ đăng ký!";
                        }

                        finalAiMsgText = replyText;
                        break; 
                    } else if (call.name === "tra_cuu_phim") {
                        const args = call.args;
                        let filtered = movies;
                        if (args.tu_khoa) {
                            const kw = args.tu_khoa.toLowerCase();
                            filtered = filtered.filter(m => 
                                (m.name && m.name.toLowerCase().includes(kw)) || 
                                (m.otherName && m.otherName.toLowerCase().includes(kw)) ||
                                (m.category && m.category.toLowerCase().includes(kw))
                            );
                        }
                        if (args.the_loai) {
                            filtered = filtered.filter(m => m.category && m.category.toLowerCase().includes(args.the_loai.toLowerCase()));
                        }
                        if (args.quoc_gia) {
                            filtered = filtered.filter(m => m.country && m.country.toLowerCase().includes(args.quoc_gia.toLowerCase()));
                        }
                        
                        const topMatches = filtered.slice(0, 10).map(m => {
                            return `Tên:${m.otherName||m.name} | Gốc:${m.name} | Loại:${m.category} | Tập:${m.endEpisode||m.totalEpisodes||1} | View:${(m.views||0)+100} | Năm:${m.year} | Slug:${m.slug||m.id} | Mô tả:${m.description ? m.description.substring(0, 100) : ''}`;
                        }).join('\n');

                        const functionResponse = {
                            movies: topMatches || "Không tìm thấy phim nào phù hợp."
                        };

                        result = await chat.sendMessage([{ 
                            functionResponse: { name: 'tra_cuu_phim', response: functionResponse } 
                        }]);
                        response = await result.response;
                        continue; 
                    }
                } else {
                    finalAiMsgText = response.text();
                    break;
                }
            }

            const text = finalAiMsgText;
            
            const aiMsg = { 
                id: Date.now() + 1, 
                text: text, 
                sender: 'ai' 
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Error:", error);
            
            let errorMessage = `Hệ thống báo lỗi: ${error.message || "Không rõ nguyên nhân"}`;
            if (error.message && error.message.includes("429")) {
                errorMessage = "Hệ thống báo lỗi: AI đang bị quá tải do vượt quá 5 tin nhắn/phút (giới hạn của Google). Bạn vui lòng đợi 10 giây rồi gửi lại nha!";
            }
            
            const errorMsg = { 
                id: Date.now() + 1, 
                text: errorMessage, 
                sender: 'ai' 
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            <div className="max-w-480 mx-auto w-full shadow-2xl bg-[#0a0a0f] relative">
                <LoadingScreen />
                <HeaderClient />

                <main>
                    <ClientRouters />
                </main>

                <FooterClient />
            </div>


            {!isChatOpen && (
                <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-999">
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="cursor-pointer flex items-center gap-2 rounded-full px-5 py-3 bg-linear-to-r from-amber-600 to-amber-500 font-bold text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-amber-400/50"
                    >
                        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                        <span>Chat AI</span>
                    </button>
                </div>
            )}


            {isChatOpen && (
                <div className="fixed inset-0 bg-black/40 z-998 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsChatOpen(false)}></div>
            )}


            {isChatOpen && (
                <div className="fixed z-999 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-auto md:left-auto md:translate-x-0 md:translate-y-0 md:bottom-6 md:right-6 w-11/12 md:w-96 h-[75vh] md:h-128 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
                    

                    <div className="bg-linear-to-r from-amber-600 to-amber-500 text-white p-4 flex justify-between items-center shadow-md relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
                                    <span className="text-amber-600 font-black text-sm tracking-tighter">AI</span>
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight tracking-wide">Trợ lý AI</h3>
                                <p className="text-amber-100 text-xs">Luôn sẵn sàng hỗ trợ</p>
                            </div>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="text-white hover:bg-white/20 transition-colors cursor-pointer p-1.5 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>


                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4 scroll-smooth">
                        <div className="text-center my-2">
                            <span className="text-xs text-gray-400 bg-gray-200/60 px-3 py-1 rounded-full">Hôm nay</span>
                        </div>
                        
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-2 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                {msg.sender === 'ai' && (
                                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mb-1 border border-amber-200">
                                        <span className="text-amber-600 font-bold text-xs">AI</span>
                                    </div>
                                )}
                                <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed break-words whitespace-pre-wrap min-w-0 overflow-hidden ${
                                    msg.sender === 'user' 
                                        ? 'bg-amber-600 text-white rounded-br-sm' 
                                        : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                                }`}>
                                    {renderMessage(msg.text)}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-end gap-2 self-start">
                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mb-1 border border-amber-200">
                                    <span className="text-amber-600 font-bold text-xs">AI</span>
                                </div>
                                <div className="p-3.5 rounded-2xl shadow-sm bg-white border border-gray-100 text-gray-700 rounded-bl-sm flex gap-1.5 items-center h-[42px]">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>


                    <div className="p-3.5 bg-white border-t border-gray-100 flex items-end gap-2 relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!isTyping) handleSend();
                                }
                            }}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-xl px-4 py-3 outline-none text-sm text-black border border-gray-200 focus:border-amber-400 transition-all resize-none overflow-hidden max-h-32 shadow-inner"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || isTyping}
                            className="bg-amber-600 text-white p-3 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-md"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default LayoutClient;
