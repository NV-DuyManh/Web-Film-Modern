import React, { useEffect, useRef, useState, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { useMovies, useAuthors, useActors, useCharacters, useCategories, useComments, useReviews, useSubscriptions, useEpisodes } from '../../../hooks/useCollections';
import { getUserPlanInfo } from '../../../utils/appUtils';
import { FaPlus, FaHistory, FaTimes, FaTrashAlt, FaRegCommentDots } from 'react-icons/fa';
import {
    buildSystemInstruction,
    executeWebsiteControl,
    executeMovieLookup,
    renderMessage,
    GROQ_TOOLS
} from './ChatBotCore.jsx';

const SESSIONS_STORAGE_KEY = 'mfilm_chatbot_sessions';
const ACTIVE_SESSION_ID_KEY = 'mfilm_chatbot_active_id';
const CHAT_OPEN_KEY = 'mfilm_chatbot_is_open';

const createNewSession = () => ({
    id: `session_${Date.now()}`,
    title: 'Đoạn chat mới',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [
        { id: 1, text: 'Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?', sender: 'ai' }
    ]
});

export default function GroqChatBot() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLogin } = useContext(AuthContext);
    const subscriptions = useSubscriptions() || [];
    const plans = useContext(PlanContext) || [];
    const movies = useMovies() || [];
    const authors = useAuthors() || [];
    const actors = useActors() || [];
    const characters = useCharacters() || [];
    const categories = useCategories() || [];
    const allComments = useComments() || [];
    const allReviews = useReviews() || [];
    const allEpisodes = useEpisodes() || [];

    const userPlanInfo = useMemo(() => {
        return getUserPlanInfo(isLogin, subscriptions, plans);
    }, [isLogin, subscriptions, plans]);

    const [sessions, setSessions] = useState(() => {
        try {
            const saved = localStorage.getItem(SESSIONS_STORAGE_KEY) || sessionStorage.getItem(SESSIONS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Error loading sessions:", e);
        }
        return [createNewSession()];
    });

    const [activeSessionId, setActiveSessionId] = useState(() => {
        try {
            const savedId = localStorage.getItem(ACTIVE_SESSION_ID_KEY) || sessionStorage.getItem(ACTIVE_SESSION_ID_KEY);
            if (savedId) return savedId;
        } catch (e) {}
        return sessions[0]?.id || `session_${Date.now()}`;
    });

    const [isChatOpen, setIsChatOpen] = useState(() => {
        try {
            return sessionStorage.getItem(CHAT_OPEN_KEY) === 'true';
        } catch (e) {
            return false;
        }
    });

    const [showHistory, setShowHistory] = useState(false);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Save sessions to localStorage & sessionStorage
    useEffect(() => {
        try {
            localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
            sessionStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
        } catch (e) {}
    }, [sessions]);

    useEffect(() => {
        try {
            localStorage.setItem(ACTIVE_SESSION_ID_KEY, activeSessionId);
            sessionStorage.setItem(ACTIVE_SESSION_ID_KEY, activeSessionId);
        } catch (e) {}
    }, [activeSessionId]);

    useEffect(() => {
        try {
            sessionStorage.setItem(CHAT_OPEN_KEY, String(isChatOpen));
        } catch (e) {}
    }, [isChatOpen]);

    // Current active session and messages
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || createNewSession();
    const messages = activeSession.messages || [];

    const updateSessionMessages = (sessionId, updater) => {
        setSessions(prevSessions => {
            return prevSessions.map(session => {
                if (session.id === sessionId) {
                    const newMessages = typeof updater === 'function' ? updater(session.messages || []) : updater;
                    let title = session.title;
                    const firstUserMsg = newMessages.find(m => m.sender === 'user');
                    if (firstUserMsg && (session.title === 'Đoạn chat mới' || !session.title)) {
                        title = firstUserMsg.text.length > 28 
                            ? firstUserMsg.text.substring(0, 28) + '...' 
                            : firstUserMsg.text;
                    }
                    return {
                        ...session,
                        title,
                        updatedAt: Date.now(),
                        messages: newMessages
                    };
                }
                return session;
            });
        });
    };

    const handleNewChat = () => {
        // Hủy bỏ bất kỳ truy vấn nào đang chạy ở tab cũ
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsTyping(false);

        // If current session is already empty, just close history
        const userMsgCount = messages.filter(m => m.sender === 'user').length;
        if (userMsgCount === 0) {
            setShowHistory(false);
            return;
        }

        const newSession = createNewSession();
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setShowHistory(false);
    };

    const handleSelectSession = (id) => {
        if (id === activeSessionId) {
            setShowHistory(false);
            return;
        }

        // Hủy bỏ bất kỳ truy vấn nào đang chạy khi chuyển sang tab khác
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsTyping(false);
        setActiveSessionId(id);
        setShowHistory(false);
    };

    const handleDeleteSession = (e, id) => {
        e.stopPropagation();
        if (id === activeSessionId && abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsTyping(false);
        }
        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== id);
            if (filtered.length === 0) {
                const fresh = createNewSession();
                setActiveSessionId(fresh.id);
                return [fresh];
            }
            if (activeSessionId === id) {
                setActiveSessionId(filtered[0].id);
            }
            return filtered;
        });
    };

    const handleClearAllSessions = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsTyping(false);
        const fresh = createNewSession();
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
        setShowHistory(false);
    };

    // Xác định phim đang xem từ URL
    const currentSlug = location.pathname.startsWith('/phim/') 
        ? location.pathname.replace('/phim/', '') 
        : location.pathname.startsWith('/xem-phim/') 
            ? location.pathname.replace('/xem-phim/', '').split('?')[0] 
            : null;
    const cleanSlug = currentSlug ? decodeURIComponent(currentSlug).replace(/\/$/, '') : null;
    const currentMovie = cleanSlug 
        ? movies.find(m => m.slug === cleanSlug || m.id === cleanSlug || m.slug === currentSlug || m.id === currentSlug) 
        : null;

    useEffect(() => {
        if (isChatOpen && !showHistory) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatOpen, showHistory]);

    const callGroqWithRetry = async (payload, apiKeysList, signal) => {
        const fallbackKeys = import.meta.env.VITE_GROQ_API_KEY ? [import.meta.env.VITE_GROQ_API_KEY] : [];
        const keys = apiKeysList.length > 0 ? apiKeysList : fallbackKeys;

        // Bắt đầu ngẫu nhiên một key để phân tán tải
        let keyIndex = keys.length > 0 ? Math.floor(Math.random() * keys.length) : 0;
        const maxAttempts = Math.max(keys.length * 2, 6);
        let lastError = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (signal?.aborted) {
                const err = new Error("Request was aborted");
                err.name = "AbortError";
                throw err;
            }

            const currentApiKey = keys.length > 0 ? keys[keyIndex % keys.length] : '';

            try {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${currentApiKey}`
                    },
                    body: JSON.stringify(payload),
                    signal
                });

                if (res.status === 429 || res.status >= 500) {
                    // Chuyển sang key tiếp theo ngay lập tức (không chờ delay nếu còn key khác)
                    keyIndex++;
                    if (keys.length > 0 && (attempt + 1) % keys.length === 0 && attempt < maxAttempts - 1) {
                        await new Promise((resolve, reject) => {
                            const timer = setTimeout(resolve, 600);
                            signal?.addEventListener('abort', () => {
                                clearTimeout(timer);
                                const abortErr = new Error("Request was aborted");
                                abortErr.name = "AbortError";
                                reject(abortErr);
                            }, { once: true });
                        });
                    }
                    continue;
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    const errMsg = err.error?.message || `Lỗi API Groq (${res.status})`;
                    lastError = new Error(errMsg);
                    keyIndex++;
                    continue;
                }

                return await res.json();
            } catch (err) {
                if (err.name === 'AbortError' || signal?.aborted) {
                    throw err;
                }
                lastError = err;
                keyIndex++;
                if (keys.length > 0 && (attempt + 1) % keys.length === 0 && attempt < maxAttempts - 1) {
                    await new Promise((resolve, reject) => {
                        const timer = setTimeout(resolve, 600);
                        signal?.addEventListener('abort', () => {
                            clearTimeout(timer);
                            const abortErr = new Error("Request was aborted");
                            abortErr.name = "AbortError";
                            reject(abortErr);
                        }, { once: true });
                    });
                }
            }
        }

        throw lastError || new Error("Không thể kết nối đến máy chủ Groq AI sau nhiều lần thử.");
    };

    const handleSend = async () => {
        if (!message.trim() || isTyping) return;

        const targetSessionId = activeSessionId;
        const targetSession = sessions.find(s => s.id === targetSessionId);
        const currentSessionMessages = targetSession?.messages || [];

        const userMsg = { id: Date.now(), text: message.trim(), sender: 'user' };
        updateSessionMessages(targetSessionId, prev => [...prev, userMsg]);
        setMessage('');
        setIsTyping(true);

        // Hủy request trước đó nếu còn đang chạy
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const systemInstruction = buildSystemInstruction({
                movies,
                currentMovie,
                authors,
                actors,
                characters,
                categories,
                allComments,
                allReviews,
                allEpisodes,
                plans,
                isLogin,
                userPlanInfo
            });

            const apiKeyString = import.meta.env.VITE_GROQ_API_KEYS || import.meta.env.VITE_GROQ_API_KEY;
            const apiKeys = apiKeyString ? apiKeyString.split(',').map(k => k.trim()).filter(Boolean) : [];

            const recentMessages = currentSessionMessages
                .slice(-6)
                .filter(m => m.id !== 1 && m.text && !m.text.startsWith('Hệ thống báo lỗi')); 
            let groqMessages = [
                { role: "system", content: systemInstruction },
                ...recentMessages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                })),
                { role: "user", content: userMsg.text }
            ];

            let finalAiMsgText = "";
            let loopCount = 0;
            let lastLookupResults = "";

            while (loopCount < 4) {
                loopCount++;
                
                const data = await callGroqWithRetry({
                    model: "openai/gpt-oss-20b", 
                    messages: groqMessages,
                    tools: GROQ_TOOLS,
                    tool_choice: "auto",
                    max_tokens: 2048
                }, apiKeys, abortController.signal);

                const responseMessage = data.choices[0].message;
                groqMessages.push(responseMessage);

                if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                    const toolCall = responseMessage.tool_calls[0];
                    const functionName = toolCall.function.name;
                    let args = {};
                    try {
                        args = JSON.parse(toolCall.function.arguments);
                    } catch (e) {
                        console.error("Lỗi parse arguments của Groq:", e);
                    }

                    if (functionName === "dieu_khien_website") {
                        finalAiMsgText = executeWebsiteControl({ args, movies, characters, actors, authors, navigate });
                        if (window.innerWidth < 768) {
                            setIsChatOpen(false);
                        }
                        break; 
                    } else if (functionName === "tra_cuu_phim") {
                        const topMatches = executeMovieLookup({ args, movies, authors, actors, characters, categories, plans, userPlanInfo });
                        lastLookupResults = topMatches;
                        groqMessages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: functionName,
                            content: JSON.stringify({ movies: topMatches })
                        });
                        continue; 
                    }
                } else {
                    finalAiMsgText = responseMessage.content || "";
                    break;
                }
            }

            if (!finalAiMsgText && lastLookupResults && lastLookupResults !== "Không tìm thấy bộ phim nào phù hợp với yêu cầu.") {
                finalAiMsgText = `Chào bạn, mình xin gợi ý một số bộ phim rất hấp dẫn đang có trên MFILM để bạn tham khảo nhé! 🍿\n\n${lastLookupResults.split('\n').map(line => `- ${line}`).join('\n')}\n\nChúc bạn xem phim vui vẻ! Nếu bạn cần tìm thể loại nào khác thì cứ nhắn mình nha! 😊`;
            }

            const aiMsg = { 
                id: Date.now() + 1, 
                text: finalAiMsgText || "Dạ chào bạn! Bạn đang tìm kiếm bộ phim hay thể loại nào để mình hỗ trợ gợi ý cho bạn nhé? 😊", 
                sender: 'ai' 
            };
            updateSessionMessages(targetSessionId, prev => [...prev, aiMsg]);
        } catch (error) {
            // Nếu hủy do người dùng chuyển tab hoặc đóng chat thì không ghi lỗi ra giao diện
            if (error?.name === 'AbortError' || abortController.signal.aborted) {
                console.log("Chat request cancelled due to session switch or abort.");
                return;
            }
            console.error("Groq AI Error:", error);
            let errorMessage = "Hệ thống báo lỗi: Không rõ nguyên nhân";
            if (error && error.message) {
                if (error.message.includes("429") || error.message.includes("Rate limit") || error.message.includes("Quota exceeded")) {
                    errorMessage = "Hệ thống báo lỗi: Trợ lý AI đang xử lý nhiều lượt yêu cầu cùng lúc. Bạn vui lòng đợi 1-2 giây rồi gửi lại nhé!";
                } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
                    errorMessage = "Hệ thống báo lỗi: Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra mạng hoặc API Key!";
                } else {
                    errorMessage = `Hệ thống báo lỗi: ${error.message}`;
                }
            }
            updateSessionMessages(targetSessionId, prev => [
                ...prev, 
                { id: Date.now() + 1, text: errorMessage, sender: 'ai' }
            ]);
        } finally {
            if (abortControllerRef.current === abortController) {
                abortControllerRef.current = null;
                setIsTyping(false);
            }
        }
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
            setIsChatOpen(false);
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
                    {/* Header */}
                    <div className="bg-linear-to-r from-amber-600 via-amber-500 to-amber-600 text-white p-3 md:p-3.5 flex justify-between items-center shadow-md relative z-10">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-inner">
                                    <span className="text-amber-600 font-black text-xs tracking-tighter">AI</span>
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm md:text-base leading-tight tracking-wide truncate">
                                    Trợ lý MFILM AI
                                </h3>
                                <p className="text-amber-100 text-[11px] truncate">
                                    {showHistory ? "Lịch sử đoạn chat" : (activeSession?.title || "Đoạn chat mới")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            {/* Nút + Chat mới */}
                            <button 
                                onClick={handleNewChat} 
                                title="Tạo đoạn chat mới"
                                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                                <FaPlus className="text-[10px]" />
                                <span className="hidden sm:inline text-xs">Chat mới</span>
                            </button>

                            {/* Nút Xem lịch sử */}
                            <button 
                                onClick={() => setShowHistory(!showHistory)} 
                                title={showHistory ? "Quay lại đoạn chat" : "Danh sách đoạn chat đã lưu"} 
                                className={`transition-colors cursor-pointer p-1.5 rounded-full ${showHistory ? 'bg-white text-amber-600 shadow-md font-bold' : 'text-amber-100 hover:text-white hover:bg-white/20'}`}
                            >
                                <FaHistory className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Đóng chat */}
                            <button 
                                onClick={() => setIsChatOpen(false)} 
                                title="Đóng chat" 
                                className="text-white hover:bg-white/20 transition-colors cursor-pointer p-1.5 rounded-full"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Nội dung: Hiển thị Lịch sử chat hoặc Hộp thoại chat */}
                    {showHistory ? (
                        <div className="flex-1 p-3 overflow-y-auto bg-slate-900 text-white flex flex-col justify-between">
                            <div className="flex-1 overflow-y-auto">
                                <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-700">
                                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                        Đoạn chat gần đây ({sessions.length})
                                    </span>
                                    {sessions.length > 1 && (
                                        <button 
                                            onClick={handleClearAllSessions} 
                                            className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer hover:underline"
                                        >
                                            Xóa tất cả
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5 mt-2.5">
                                    {sessions.map((sess) => {
                                        const isActive = sess.id === activeSessionId;
                                        const userMsgCount = (sess.messages || []).filter(m => m.sender === 'user').length;
                                        return (
                                            <div 
                                                key={sess.id}
                                                onClick={() => handleSelectSession(sess.id)}
                                                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                                                    isActive 
                                                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm' 
                                                        : 'bg-slate-800/80 border-slate-700/60 text-slate-200 hover:bg-slate-700/80 hover:border-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                                    <FaRegCommentDots className={`text-base shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs md:text-sm font-semibold truncate">
                                                            {sess.title || 'Đoạn chat mới'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {userMsgCount} tin nhắn • {new Date(sess.updatedAt || sess.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={(e) => handleDeleteSession(e, sess.id)}
                                                    title="Xóa đoạn chat này"
                                                    className="opacity-60 group-hover:opacity-100 hover:text-red-400 text-slate-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                                                >
                                                    <FaTrashAlt className="text-xs" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button 
                                onClick={handleNewChat}
                                className="w-full py-2.5 mt-2 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-98 shrink-0"
                            >
                                <FaPlus className="text-xs" /> Bắt đầu đoạn chat mới
                            </button>
                        </div>
                    ) : (
                        <>
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
                                            {renderMessage(msg.text, handleLinkClick)}
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
