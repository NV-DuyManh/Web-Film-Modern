import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMovies, useAuthors, useActors, useCategories, useComments, useReviews } from '../../../hooks/useCollections';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKeys } from '../../../utils/Constants';
import {
    buildSystemInstruction,
    executeWebsiteControl,
    executeMovieLookup,
    renderMessage,
    GEMINI_TOOLS
} from './ChatBotCore.jsx';

export default function GeminiChatBot() {
    const navigate = useNavigate();
    const location = useLocation();
    const movies = useMovies() || [];
    const authors = useAuthors() || [];
    const actors = useActors() || [];
    const categories = useCategories() || [];
    const allComments = useComments() || [];
    const allReviews = useReviews() || [];

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: 'Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?', sender: 'ai' }
    ]);
    const messagesEndRef = useRef(null);

    // Xác định phim đang xem từ URL
    const currentSlug = location.pathname.startsWith('/phim/') 
        ? location.pathname.replace('/phim/', '') 
        : location.pathname.startsWith('/xem-phim/') 
            ? location.pathname.replace('/xem-phim/', '').split('?')[0] 
            : null;
    const currentMovie = currentSlug ? movies.find(m => m.slug === currentSlug || m.id === currentSlug) : null;

    useEffect(() => {
        if (isChatOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatOpen]);

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMsg = { id: Date.now(), text: message.trim(), sender: 'user' };
        setMessages((prev) => [...prev, userMsg]);
        setMessage('');
        setIsTyping(true);

        try {
            const systemInstruction = buildSystemInstruction({
                movies,
                currentMovie,
                authors,
                actors,
                categories,
                allComments,
                allReviews
            });

            const apiKey = apiKeys && apiKeys.length > 0 ? apiKeys[0] : '';
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                systemInstruction: systemInstruction,
                tools: GEMINI_TOOLS
            });

            const recentMessages = messages
                .slice(-6)
                .filter(m => m.id !== 1 && m.text && !m.text.startsWith('Hệ thống báo lỗi')); 
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
                        finalAiMsgText = executeWebsiteControl({ args: call.args, movies, navigate });
                        break; 
                    } else if (call.name === "tra_cuu_phim") {
                        const topMatches = executeMovieLookup({ args: call.args, movies, authors, actors, categories });
                        result = await chat.sendMessage([{ 
                            functionResponse: { 
                                name: 'tra_cuu_phim', 
                                response: { movies: topMatches } 
                            } 
                        }]);
                        response = await result.response;
                        continue;
                    }
                } else {
                    finalAiMsgText = response.text();
                    break;
                }
            }

            const aiMsg = { 
                id: Date.now() + 1, 
                text: finalAiMsgText, 
                sender: 'ai' 
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Error:", error);
            let errorMessage = "Hệ thống báo lỗi: Không rõ nguyên nhân";
            if (error.message) {
                if (error.message.includes("429") || error.message.includes("Quota exceeded") || error.message.includes("Rate limit")) {
                    errorMessage = "Hệ thống báo lỗi: Trợ lý AI đang tạm thời vượt quá giới hạn lượt dùng. Bạn vui lòng đợi 1-2 giây rồi thử lại nhé!";
                } else {
                    errorMessage = `Hệ thống báo lỗi: ${error.message}`;
                }
            }
            setMessages((prev) => [
                ...prev, 
                { id: Date.now() + 1, text: errorMessage, sender: 'ai' }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div>
            {!isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed z-999 bottom-6 right-6 bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold p-4 rounded-full shadow-2xl flex items-center gap-2 transform hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                    <div className="relative">
                        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                        </svg>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                    <span className="hidden md:inline font-semibold">Chat AI</span>
                </button>
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
                                <h3 className="font-bold text-lg leading-tight tracking-wide">Trợ lý MFILM AI</h3>
                                <p className="text-amber-100 text-xs">Luôn sẵn sàng hỗ trợ</p>
                            </div>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="text-white hover:bg-white/20 transition-colors cursor-pointer p-1.5 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4 scroll-smooth">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && (
                                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-amber-200">
                                        AI
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm text-sm leading-relaxed ${
                                     msg.sender === 'user' 
                                         ? 'bg-amber-600 text-white font-medium rounded-tr-none' 
                                         : 'bg-white text-black border border-gray-100 rounded-tl-none'
                                }`}>
                                     {renderMessage(msg.text)}
                                 </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start gap-2.5 justify-start">
                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-amber-200">
                                    AI
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            className="flex-1 border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-xl px-4 py-2.5 text-sm text-black outline-none transition-all placeholder:text-gray-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || isTyping}
                            className="bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
                        >
                            <svg className="w-5 h-5 -rotate-45 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

