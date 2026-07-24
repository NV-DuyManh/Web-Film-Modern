import React, { useState, useEffect, useContext } from 'react';
import { MovieContext } from '../../../contexts/MovieProvider';
import { CategoriesContext } from '../../../contexts/CategoryProvider';
import Logo from '../../../assets/Icon.png';
import './LoadingScreen.css';

function LoadingScreen({ onFinished }) {
    const [fadeOut, setFadeOut] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [progress, setProgress] = useState(0);

    const movies = useContext(MovieContext);
    const categories = useContext(CategoriesContext);

    // Kiểm tra data đã load chưa
    const isDataReady = movies?.length > 0 && categories?.length > 0;

    // Animate progress bar
    useEffect(() => {
        if (isDataReady) {
            // Data loaded → fill progress to 100% rồi fade out
            setProgress(100);
            const timer = setTimeout(() => {
                setFadeOut(true);
                // Sau khi fade out xong → ẩn hoàn toàn
                const hideTimer = setTimeout(() => {
                    setHidden(true);
                    if (onFinished) onFinished();
                }, 600);
                return () => clearTimeout(hideTimer);
            }, 400);
            return () => clearTimeout(timer);
        } else {
            // Chưa load xong → animate progress giả (max 85%)
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 85) return 85;
                    return prev + Math.random() * 12;
                });
            }, 300);
            return () => clearInterval(interval);
        }
    }, [isDataReady]);

    if (hidden) return null;

    return (
        <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
            {/* Logo with spinning rings */}
            <div className="loading-logo-wrapper">
                <div className="loading-ring"></div>
                <div className="loading-ring-inner"></div>
                <img
                    src={Logo}
                    alt="MFilm Logo"
                    className="loading-logo"
                    draggable="false"
                />
            </div>

            {/* Brand text */}
            <div className="loading-brand">MFILM</div>

            {/* Progress bar */}
            <div className="loading-progress-track">
                <div
                    className="loading-progress-bar"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
            </div>

            {/* Animated dots */}
            <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
            </div>
        </div>
    );
}

export default LoadingScreen;
