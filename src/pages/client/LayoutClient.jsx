import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import HeaderClient from '../../components/client/header/HeaderClient';
import ClientRouters from '../../routers/ClientRouters';
import FooterClient from '../../components/client/footer/FooterClient';
import LoadingScreen from '../../components/client/loadingScreen/LoadingScreen';
import ChatLauncher from '../../components/client/chatBot/ChatLauncher';
import { startDailyMovieActivity } from '../../services/dailyMovieActivity';
// import GeminiChatBot from '../../components/client/chatBot/GeminiChatBot';

function LayoutClient() {
    const location = useLocation();
    const scrollMap = useRef({});
    const prevPath = useRef(location.pathname);
    useEffect(() => startDailyMovieActivity(), []);

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
        const opensAtTop = ['/ho-tro', '/gioi-thieu', '/upgrade', '/upgrade-vip'].includes(location.pathname);
        if (opensAtTop) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            prevPath.current = location.pathname;
        } else if (prevPath.current !== location.pathname) {
            const targetY = scrollMap.current[location.pathname] || 0;

            window.scrollTo(0, targetY);
            prevPath.current = location.pathname;
        }
    }, [location.pathname, location.key]);

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

            <ChatLauncher />
            {/* <GeminiChatBot /> */}
        </>
    );
}

export default LayoutClient;
