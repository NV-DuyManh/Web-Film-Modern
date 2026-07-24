import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import HeaderClient from '../../components/client/header/HeaderClient';
import ClientRouters from '../../routers/ClientRouters';
import FooterClient from '../../components/client/footer/FooterClient';
import LoadingScreen from '../../components/client/loadingScreen/LoadingScreen';

function LayoutClient(props) {
    const location = useLocation();
    const scrollMap = useRef({});

    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            scrollMap.current[location.pathname] = window.scrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    useLayoutEffect(() => {
        const targetY = scrollMap.current[location.pathname] || 0;
        window.scrollTo(0, targetY);
    }, [location.pathname]);

    return (
        <div>
            <LoadingScreen />
            <HeaderClient />
            <ClientRouters />
            <FooterClient />
        </div>
    );
}

export default LayoutClient;    
