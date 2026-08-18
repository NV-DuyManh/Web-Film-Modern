import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import HeaderClient from '../../components/client/header/HeaderClient';
import ClientRouters from '../../routers/ClientRouters';
import FooterClient from '../../components/client/footer/FooterClient';
import LoadingScreen from '../../components/client/loadingScreen/LoadingScreen';
import GroqChatBot from '../../components/client/chatBot/GroqChatBot';
// import GeminiChatBot from '../../components/client/chatBot/GeminiChatBot';

function LayoutClient() {
    const location = useLocation();
    const navigate = useNavigate();
    const scrollMap = useRef({});
    const prevPath = useRef(location.pathname);

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

            <GroqChatBot />
            {/* <GeminiChatBot /> */}
        </>
    );
}

export default LayoutClient;
