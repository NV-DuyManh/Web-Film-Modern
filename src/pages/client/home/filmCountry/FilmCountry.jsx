import React, { useContext, useMemo, useRef, useState, useEffect, useLayoutEffect } from "react";
import { useMovies } from '../../../../hooks/useCollections';
import { FaChevronLeft, FaChevronRight, FaClock, FaCalendarAlt, FaEye } from "react-icons/fa";
import { getObjectById } from "../../../../services/firebaseResponse";
import { getOptimizedUrl } from '../../../../utils/cloudinary';
import { PlanContext } from "../../../../contexts/PlanProvider";
import { Link } from 'react-router-dom';

function FilmCountry({ title, countryName, titleClass, speed = 40, reverse, index }) {
    const movies = useMovies();
    const plans = useContext(PlanContext);

    const isReverse = reverse !== undefined ? reverse : (index !== undefined ? index % 2 !== 0 : false);

    const containerRef = useRef(null);
    const trackRef = useRef(null);
    const posRef = useRef(0);
    const [cardWidth, setCardWidth] = useState(0);
    const [gap, setGap] = useState(20);

    const [isHovered, setIsHovered] = useState(false);
    const isInteracting = useRef(false);

    // Smooth button animation state
    const isAnimatingBtn = useRef(false);
    const startPos = useRef(0);
    const targetPos = useRef(0);
    const animStartTime = useRef(0);
    const animDuration = 400; // ms

    // Mouse / Touch drag support
    const isDragging = useRef(false);
    const startX = useRef(0);
    const dragStartPos = useRef(0);
    const dragMoved = useRef(false);

    const filteredMovies = useMemo(() => {
        if (!countryName) return movies || [];
        return (movies || []).filter(m => m.countriesID?.toLowerCase() === countryName.toLowerCase());
    }, [movies, countryName]);

    // Ensure enough items so duplicating creates a seamless infinite loop
    const duplicatedMovies = useMemo(() => {
        if (!filteredMovies || filteredMovies.length === 0) return [];
        let list = [...filteredMovies];
        while (list.length < 8) {
            list = [...list, ...filteredMovies];
        }
        return [...list, ...list].map((m, idx) => ({
            ...m,
            _slideKey: `${m.id}-${idx}`
        }));
    }, [filteredMovies]);

    // Calculate exact pixel dimensions for responsive breakpoints (matching original Swiper)
    useLayoutEffect(() => {
        const updateSizes = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            let count = 4;
            let g = 20;
            if (width < 400) {
                count = 1;
                g = 10;
            } else if (width < 900) {
                count = 2;
                g = 12;
            } else if (width < 1280) {
                count = 3;
                g = 15;
            } else {
                count = 4;
                g = 20;
            }
            setGap(g);
            setCardWidth(Math.max(100, (width - (count - 1) * g) / count));
        };

        updateSizes();
        const observer = new ResizeObserver(() => updateSizes());
        if (containerRef.current) observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    // Set initial position for reverse direction
    useEffect(() => {
        if (isReverse && trackRef.current && posRef.current === 0) {
            const halfWidth = trackRef.current.scrollWidth / 2;
            if (halfWidth > 0) {
                posRef.current = halfWidth;
                trackRef.current.style.transform = `translate3d(-${halfWidth}px, 0, 0)`;
            }
        }
    }, [isReverse, cardWidth]);

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    // 60/120fps GPU hardware-accelerated continuous animation loop (zero jerk, zero pause)
    useEffect(() => {
        const track = trackRef.current;
        if (!track || duplicatedMovies.length === 0) return;

        let animationFrameId;
        let lastTime = performance.now();

        const tick = (currentTime) => {
            if (!trackRef.current) {
                animationFrameId = requestAnimationFrame(tick);
                return;
            }

            const halfWidth = trackRef.current.scrollWidth / 2;

            if (isAnimatingBtn.current) {
                const elapsed = currentTime - animStartTime.current;
                const progress = Math.min(1, elapsed / animDuration);
                const eased = easeOutCubic(progress);

                posRef.current = startPos.current + (targetPos.current - startPos.current) * eased;

                if (progress >= 1) {
                    isAnimatingBtn.current = false;
                    posRef.current = targetPos.current;
                }
            } else if (!isHovered && !isInteracting.current) {
                const deltaTime = currentTime - lastTime;
                const distance = (speed * deltaTime) / 1000;

                if (isReverse) {
                    posRef.current -= distance;
                } else {
                    posRef.current += distance;
                }
            }
            lastTime = currentTime;

            if (halfWidth > 0) {
                while (posRef.current >= halfWidth) posRef.current -= halfWidth;
                while (posRef.current < 0) posRef.current += halfWidth;
                trackRef.current.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
            }

            animationFrameId = requestAnimationFrame(tick);
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isHovered, duplicatedMovies, speed, isReverse, cardWidth]);

    // Smooth button click handlers (no stutter, no snapback)
    const handleNext = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (!cardWidth) return;
        const step = cardWidth + gap;
        startPos.current = posRef.current;
        targetPos.current = posRef.current + step;
        animStartTime.current = performance.now();
        isAnimatingBtn.current = true;
    };

    const handlePrev = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (!cardWidth) return;
        const step = cardWidth + gap;
        startPos.current = posRef.current;
        targetPos.current = posRef.current - step;
        animStartTime.current = performance.now();
        isAnimatingBtn.current = true;
    };

    // Touch & Mouse Drag Handlers
    const onMouseDown = (e) => {
        if (!trackRef.current) return;
        isDragging.current = true;
        dragMoved.current = false;
        isInteracting.current = true;
        isAnimatingBtn.current = false;
        startX.current = e.pageX;
        dragStartPos.current = posRef.current;
    };

    const onMouseMove = (e) => {
        if (!isDragging.current || !trackRef.current) return;
        const diff = e.pageX - startX.current;
        if (Math.abs(diff) > 5) dragMoved.current = true;
        const halfWidth = trackRef.current.scrollWidth / 2;
        let newPos = dragStartPos.current - diff;
        if (halfWidth > 0) {
            while (newPos >= halfWidth) newPos -= halfWidth;
            while (newPos < 0) newPos += halfWidth;
        }
        posRef.current = newPos;
        trackRef.current.style.transform = `translate3d(-${newPos}px, 0, 0)`;
    };

    const onMouseUp = () => {
        if (isDragging.current) {
            isDragging.current = false;
            setTimeout(() => {
                isInteracting.current = false;
                dragMoved.current = false;
            }, 300);
        }
    };

    const handleClickCard = (e) => {
        if (dragMoved.current) {
            e.preventDefault();
        }
    };

    if (countryName && filteredMovies.length === 0) return null;

    return (
        <div className="country-section w-full md:flex md:items-center gap-6 lg:gap-8 py-2 px-6 md:px-10 overflow-hidden font-sans">
            <div className="country-sidebar justify-center items-center md:items-start max-md:mt-4 shrink-0 flex flex-col max-md:w-full md:w-40 md:-translate-y-5">
                <h2 className={`m-0 mb-3 md:mb-4 text-xl md:text-2xl font-bold text-center md:text-left leading-snug tracking-wide drop-shadow-md ${titleClass || 'text-white'}`}>
                    {title}
                </h2>
                <Link to={`/country/${countryName}`} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] uppercase tracking-wider font-semibold hover:bg-white/10 hover:text-white hover:border-white/20 transition cursor-pointer group">
                    Khám phá <FaChevronRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-1 text-[#facc15]" />
                </Link>
            </div>

            <div className="country-slider flex-1 min-w-0" ref={containerRef}>
                <div
                    className="movie-slider-wrapper relative group/slider py-3"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => {
                        setIsHovered(false);
                        onMouseUp();
                    }}
                >
                    {/* Centered exactly on the 16:9 image poster (accounting for wrapper and track paddings) */}
                    <button
                        aria-label="Previous"
                        onClick={handlePrev}
                        className="movie-nav-btn movie-nav-btn--prev filmcountry-prev-btn z-30 cursor-pointer pointer-events-auto!"
                        draggable="false"
                    >
                        <FaChevronLeft />
                    </button>

                    <div
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onTouchStart={(e) => {
                            if (!trackRef.current) return;
                            isDragging.current = true;
                            dragMoved.current = false;
                            isInteracting.current = true;
                            isAnimatingBtn.current = false;
                            startX.current = e.touches[0].pageX;
                            dragStartPos.current = posRef.current;
                        }}
                        onTouchMove={(e) => {
                            if (!isDragging.current || !trackRef.current) return;
                            const diff = e.touches[0].pageX - startX.current;
                            if (Math.abs(diff) > 5) dragMoved.current = true;
                            const halfWidth = trackRef.current.scrollWidth / 2;
                            let newPos = dragStartPos.current - diff;
                            if (halfWidth > 0) {
                                while (newPos >= halfWidth) newPos -= halfWidth;
                                while (newPos < 0) newPos += halfWidth;
                            }
                            posRef.current = newPos;
                            trackRef.current.style.transform = `translate3d(-${newPos}px, 0, 0)`;
                        }}
                        onTouchEnd={onMouseUp}
                        className="overflow-hidden select-none cursor-grab active:cursor-grabbing w-full"
                    >
                        <div
                            ref={trackRef}
                            className="flex w-max will-change-transform py-3"
                            style={{
                                gap: `${gap}px`,
                                transform: 'translate3d(0, 0, 0)'
                            }}
                        >
                            {duplicatedMovies.map((e) => (
                                <div
                                    key={e._slideKey}
                                    className="shrink-0"
                                    style={{
                                        width: cardWidth ? `${cardWidth}px` : '280px'
                                    }}
                                >
                                    <Link
                                        to={`/phim/${e.slug || e.id}`}
                                        onClick={handleClickCard}
                                        draggable="false"
                                        className="block select-none"
                                    >
                                        <div className="group cursor-pointer flex flex-col h-full">
                                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-lg border-3 border-transparent transition duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                                <img
                                                    src={getOptimizedUrl(e.bannerUrl, 480, 270, 'thumb')}
                                                    alt=""
                                                    draggable="false"
                                                    className="w-full h-full object-cover pointer-events-none"
                                                    width={480}
                                                    height={270}
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40 pointer-events-none"></div>

                                                {e.planID && (() => {
                                                    const plan = getObjectById(plans, e.planID);
                                                    if (!plan) return null;
                                                    const level = Number(plan.level) || 0;
                                                    let cls = "bg-slate-600 border-slate-500 text-white";
                                                    let text = plan.name;

                                                    if (level >= 3) {
                                                        cls = "bg-linear-to-r from-fuchsia-600 via-pink-400 to-rose-500 border-pink-300 text-white shadow-[0_0_15px_rgba(236,72,153,0.8)] premium-laser";
                                                    } else if (level === 2) {
                                                        cls = "bg-linear-to-r from-yellow-400 via-amber-500 to-yellow-500 border-yellow-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.7)]";
                                                    } else if (level === 1) {
                                                        cls = "bg-linear-to-r from-blue-600 to-cyan-500 border-cyan-300 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]";
                                                    }

                                                    return (
                                                        <div className="absolute top-2 right-2 flex gap-1.5 z-10 group-hover:scale-105 transition-transform duration-300">
                                                            <p className={`text-[9px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${cls} uppercase tracking-wider`}>
                                                                {text}
                                                            </p>
                                                        </div>
                                                    );
                                                })()}

                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 w-max pointer-events-none">
                                                    {(() => {
                                                        const cId = (e.countriesID || '').toLowerCase();
                                                        let bgCls = "from-indigo-500 to-purple-600 border-indigo-400 shadow-[0_2px_4px_rgba(99,102,241,0.4)]";
                                                        if (cId.includes('korea') || cId.includes('hàn')) {
                                                            bgCls = "from-cyan-500 to-blue-600 border-cyan-400 shadow-[0_2px_4px_rgba(6,182,212,0.4)]";
                                                        } else if (cId.includes('china') || cId.includes('trung')) {
                                                            bgCls = "from-red-500 to-rose-600 border-red-400 shadow-[0_2px_4px_rgba(239,68,68,0.4)]";
                                                        } else if (cId.includes('japan') || cId.includes('nhật')) {
                                                            bgCls = "from-pink-500 to-rose-500 border-pink-400 shadow-[0_2px_4px_rgba(236,72,153,0.4)]";
                                                        } else if (cId.includes('thai') || cId.includes('thái')) {
                                                            bgCls = "from-emerald-500 to-teal-600 border-emerald-400 shadow-[0_2px_4px_rgba(16,185,129,0.4)]";
                                                        } else if (cId.includes('vietnam') || cId.includes('việt')) {
                                                            bgCls = "from-yellow-400 to-orange-500 border-yellow-300 text-black shadow-[0_2px_4px_rgba(250,204,21,0.4)]";
                                                        } else if (cId.includes('us') || cId.includes('mỹ') || cId.includes('u.s') || cId.includes('america')) {
                                                            bgCls = "from-blue-600 to-indigo-700 border-blue-400 shadow-[0_2px_4px_rgba(37,99,235,0.4)]";
                                                        }

                                                        const textCls = cId.includes('vietnam') || cId.includes('việt') ? 'text-black' : 'text-white';

                                                        return (
                                                            <p className={`bg-linear-to-r ${bgCls} ${textCls} border text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider`}>
                                                                {e.countriesID}
                                                            </p>
                                                        );
                                                    })()}
                                                    {e.duration && (
                                                        <span className="flex items-center gap-1 text-black bg-linear-to-r from-yellow-300 to-yellow-500 px-1.5 py-0.5 rounded shadow-md text-[8px] md:text-[9px] font-bold whitespace-nowrap">
                                                            <FaClock /> {e.duration} phút
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="pt-2 px-1 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                                <h3 className="m-0 text-base font-bold text-white truncate w-full transition-colors group-hover:text-[#facc15]">{e.otherName}</h3>
                                                <p className="m-0 mt-1 text-[#8c909e] text-[10px] md:text-[11px] truncate w-full transition-colors group-hover:text-slate-300">{e.name}</p>
                                                <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5 w-full font-bold">
                                                    {e.releaseYear && (
                                                        <span className="flex items-center gap-1.5 text-white bg-linear-to-r from-blue-500 to-cyan-500 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                            <FaCalendarAlt /> {e.releaseYear}
                                                        </span>
                                                    )}

                                                    <span className="flex items-center gap-1.5 text-white bg-linear-to-r from-purple-500 to-fuchsia-600 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(192,38,211,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                        <FaEye /> {(Number(e.views) || 0) + 100}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        aria-label="Next"
                        onClick={handleNext}
                        className="movie-nav-btn movie-nav-btn--next filmcountry-next-btn z-30 cursor-pointer pointer-events-auto!"
                        draggable="false"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FilmCountry;


