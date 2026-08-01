import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { MovieContext } from '../../../contexts/MovieProvider';
import { CategoriesContext } from '../../../contexts/CategoryProvider';
import Logo from '../../../assets/Icon.png';
import './LoadingScreen.css';

function generateParticles(count) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.5 + 0.2,
    }));
}

function generateFilmStrips(count) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        size: Math.random() * 20 + 15,
        duration: Math.random() * 8 + 8,
        delay: Math.random() * 3,
    }));
}

function LoadingScreen({ onFinished }) {
    const [fadeOut, setFadeOut] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logoReady, setLogoReady] = useState(false);
    const [brandReady, setBrandReady] = useState(false);
    const [burst, setBurst] = useState(false);

    const movies = useContext(MovieContext);
    const categories = useContext(CategoriesContext);

    const particles = useMemo(() => generateParticles(35), []);
    const filmStrips = useMemo(() => generateFilmStrips(6), []);

    const isDataReady = movies?.length > 0 && categories?.length > 0;

    useEffect(() => {
        const t1 = setTimeout(() => setLogoReady(true), 150);
        const t2 = setTimeout(() => setBrandReady(true), 400);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    useEffect(() => {
        if (isDataReady) {
            setProgress(100);
            setBurst(true);
            const timer = setTimeout(() => {
                setFadeOut(true);
                const hideTimer = setTimeout(() => {
                    setHidden(true);
                    if (onFinished) onFinished();
                }, 150);
                return () => clearTimeout(hideTimer);
            }, 0);
            return () => clearTimeout(timer);
        } else {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 85) return 85;
                    return prev + Math.random() * 10;
                });
            }, 350);
            return () => clearInterval(interval);
        }
    }, [isDataReady]);

    if (hidden) return null;

    const brandText = 'MFILM';
    const tagline = 'Unlimited Entertainment';

    return (
        <div className={`loading-screen ${fadeOut ? 'fade-out' : ''} ${burst ? 'burst-active' : ''}`}>

            {/* Floating particles */}
            <div className="loading-particles" aria-hidden="true">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="loading-particle"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`,
                            opacity: p.opacity,
                        }}
                    />
                ))}
            </div>

            {/* Film strip floating decorations */}
            <div className="loading-film-strips" aria-hidden="true">
                {filmStrips.map(f => (
                    <div
                        key={f.id}
                        className="loading-film-icon"
                        style={{
                            left: `${f.x}%`,
                            top: `${f.y}%`,
                            fontSize: `${f.size}px`,
                            transform: `rotate(${f.rotation}deg)`,
                            animationDuration: `${f.duration}s`,
                            animationDelay: `${f.delay}s`,
                        }}
                    >
                        🎬
                    </div>
                ))}
            </div>

            {/* Central burst effect */}
            <div className="loading-burst" aria-hidden="true"></div>

            {/* Logo with orbital rings */}
            <div className={`loading-logo-wrapper ${logoReady ? 'entered' : ''}`}>
                <div className="loading-orbit loading-orbit-1"></div>
                <div className="loading-orbit loading-orbit-2"></div>
                <div className="loading-orbit loading-orbit-3"></div>

                {/* Glow behind logo */}
                <div className="loading-logo-glow"></div>

                <img
                    src={Logo}
                    alt="MFilm Logo"
                    className="loading-logo"
                    draggable="false"
                />
            </div>

            {/* Brand text - typewriter effect */}
            <div className={`loading-brand ${brandReady ? 'revealed' : ''}`}>
                {brandText.split('').map((char, i) => (
                    <p
                        key={i}
                        className="loading-brand-char inline"
                        style={{ animationDelay: `${i * 0.07}s` }}
                    >
                        {char}
                    </p>
                ))}
            </div>

            {/* Tagline - stagger fade */}
            <div className={`loading-tagline ${brandReady ? 'revealed' : ''}`}>
                {tagline.split('').map((char, i) => (
                    <p
                        key={i}
                        className="loading-tagline-char inline"
                        style={{ animationDelay: `${0.45 + i * 0.02}s` }}
                    >
                        {char === ' ' ? '\u00A0' : char}
                    </p>
                ))}
            </div>

            {/* Progress section */}
            <div className="loading-progress-section">
                <div className="loading-progress-track">
                    <div
                        className="loading-progress-bar"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                    {/* Shimmer overlay */}
                    <div className="loading-progress-shimmer"></div>
                </div>
                <div className="loading-progress-text">
                    {Math.round(Math.min(progress, 100))}%
                </div>
            </div>

            {/* Animated loading pulse dots */}
            <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
            </div>
        </div>
    );
}

export default LoadingScreen;
