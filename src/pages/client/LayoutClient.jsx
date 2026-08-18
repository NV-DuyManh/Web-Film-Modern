import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
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
    const scrollMap = useRef({});
    const prevPath = useRef(location.pathname);
    const movies = useMovies();

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [message, setMessage] = useState('');
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
                        onClick={() => setIsChatOpen(false)}
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

        try {
            const moviesContext = movies.map(m => {
                return `- Tên: ${m.name || m.title} | Thể loại: ${m.category || 'Chưa cập nhật'} | Lượt xem: ${m.views || 0} | Quốc gia: ${m.country || 'Đang cập nhật'} | Năm: ${m.year || 'Đang cập nhật'} | Đánh giá: ${m.rating || 0} sao | Mô tả: ${m.description ? m.description.substring(0, 150) + '...' : ''} | Link: /phim/${m.slug || m.id}`;
            }).join('\n');
            const systemInstruction = `Bạn là chuyên gia tư vấn phim. Bạn CHỈ được tư vấn dựa trên danh sách phim sau đây, tuyệt đối không lấy dữ liệu bên ngoài:
${moviesContext}

QUAN TRỌNG: Khi gợi ý phim, bạn BẮT BUỘC phải tạo link dưới dạng Markdown: [Tên Phim](/phim/slug-cua-phim). VD: [Spider Man](/phim/spider-man)`;

            const model = genAI.getGenerativeModel({ 
                model: "gemini-3-flash-preview",
                systemInstruction: systemInstruction 
            });
            const result = await model.generateContent(userMsg.text);
            const response = await result.response;
            const text = response.text();
            
            const aiMsg = { 
                id: Date.now() + 1, 
                text: text, 
                sender: 'ai' 
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg = { 
                id: Date.now() + 1, 
                text: 'Xin lỗi, tôi đã gặp lỗi khi kết nối. Vui lòng kiểm tra lại API key hoặc kết nối mạng.', 
                sender: 'ai' 
            };
            setMessages((prev) => [...prev, errorMsg]);
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
                                <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                    msg.sender === 'user' 
                                        ? 'bg-amber-600 text-white rounded-br-sm' 
                                        : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                                }`}>
                                    {renderMessage(msg.text)}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>


                    <div className="p-3.5 bg-white border-t border-gray-100 flex items-end gap-2 relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-xl px-4 py-3 outline-none text-sm text-black border border-gray-200 focus:border-amber-400 transition-all resize-none overflow-hidden max-h-32 shadow-inner"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim()}
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
