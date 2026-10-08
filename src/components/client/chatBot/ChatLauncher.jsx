import { Suspense, useState, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthProvider';
import lazyRetry from '../../../utils/lazyRetry';
import ErrorBoundary from '../../ErrorBoundary';

const ChatBot = lazyRetry(() => import('./GroqChatBot'));

export default function ChatLauncher() {
    const { isLogin } = useContext(AuthContext);
    const [activated, setActivated] = useState(() => {
        try { return sessionStorage.getItem('mfilm_chatbot_is_open') === 'true'; }
        catch { return false; }
    });
    const launcher = (
        <button onClick={() => setActivated(true)} aria-label="Mở Chat AI"
            className="fixed z-999 bottom-6 right-6 bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold p-4 rounded-full shadow-2xl flex items-center gap-2 transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="relative">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
            </div>
            <span className="hidden md:inline font-semibold">Chat AI</span>
        </button>
    );
    return activated ? <ErrorBoundary><Suspense fallback={launcher}><ChatBot key={isLogin?.id || 'guest'} initiallyOpen /></Suspense></ErrorBoundary> : launcher;
}
