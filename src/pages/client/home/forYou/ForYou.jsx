import React, { useContext, useMemo, useState, useEffect, useRef } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft, FaCalendarAlt, FaClock, FaEye } from 'react-icons/fa';
import { getObjectById } from '../../../../services/firebaseResponse';
import { getOptimizedUrl } from '../../../../utils/cloudinary';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { trackEvent } from '../../../../services/eventTracker';

function ForYou() {
    const movies = useMovies();
    const plans = useContext(PlanContext);
    const authContext = useContext(AuthContext);
    const isLogin = authContext?.isLogin;
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const viewedMoviesRef = useRef(new Set());

    const RECOMMENDATIONS_ENABLED = import.meta.env?.VITE_RECOMMENDATIONS_ENABLED === 'true';
    const API_BASE_URL =
        import.meta.env?.VITE_API_BASE_URL ||
        import.meta.env?.VITE_EVENT_API_BASE_URL ||
        'https://mfilm-backend.onrender.com/api/v1';

    useEffect(() => {
        if (!RECOMMENDATIONS_ENABLED) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        async function fetchRecommendations() {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                const headers = { 'Content-Type': 'application/json' };

                if (user) {
                    try {
                        const token = await user.getIdToken();
                        headers['Authorization'] = `Bearer ${token}`;
                    } catch (e) {
                        // proceed without token
                    }
                }

                // Bridge authenticated user ID from isLogin (Firestore user profile) and Firebase Auth
                const localUserId = isLogin?.id || isLogin?.uid || user?.uid;
                if (localUserId) {
                    headers['x-user-id'] = String(localUserId);
                }

                const queryParams = new URLSearchParams({ limit: '15' });
                if (localUserId) {
                    queryParams.set('userId', String(localUserId));
                }

                const url = `${API_BASE_URL.replace(/\/+$/, '')}/recommendations/for-you?${queryParams.toString()}`;
                const res = await fetch(url, { headers });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                if (isMounted && data.success && Array.isArray(data.items) && data.items.length > 0) {
                    setRecommendations(data.items);
                }
            } catch (err) {
                // Gracefully fallback to catalog popularity
                if (isMounted) {
                    setRecommendations([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchRecommendations();

        // Also listen for Firebase Auth state changes in case credentials hydrate asynchronously
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, () => {
            if (isMounted) {
                fetchRecommendations();
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [RECOMMENDATIONS_ENABLED, API_BASE_URL, isLogin?.id, isLogin?.listFavorite?.length]);

    // Merge recommendation items with full catalog movies for rich presentation
    const displayMovies = useMemo(() => {
        if (!movies || movies.length === 0) return [];

        if (recommendations.length > 0) {
            const seen = new Set();
            const mapped = recommendations.map((item) => {
                const catalogMovie = movies.find((m) => m.id === item.movieId || m.slug === item.slug);
                if (catalogMovie) {
                    return {
                        ...catalogMovie,
                        reason: item.reason || 'Dành cho bạn',
                        recScore: item.score,
                        recSource: item.recommendationSource || 'hybrid',
                    };
                }
                if (item.name && (item.imgUrl || item.img_url)) {
                    return {
                        id: item.movieId || item.id,
                        slug: item.slug,
                        name: item.name,
                        otherName: item.otherName || item.name,
                        imgUrl: item.imgUrl || item.img_url,
                        reason: item.reason || 'Dành cho bạn',
                        recScore: item.score,
                        recSource: item.recommendationSource || 'hybrid',
                    };
                }
                return null;
            }).filter((m) => {
                if (!m) return false;
                const id = String(m.id || m.movieId || '');
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            if (mapped.length > 0) return mapped;
        }

        // Fallback to top catalog movies sorted by views
        return [...movies]
            .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
            .slice(0, 15)
            .map((m) => ({
                ...m,
                reason: 'Phim được yêu thích nhất',
                recSource: 'popularity',
            }));
    }, [recommendations, movies]);

    // Emit recommendation_view telemetry for rendered items
    useEffect(() => {
        if (displayMovies && displayMovies.length > 0) {
            displayMovies.forEach((item) => {
                const mId = String(item.id || item.movieId || '').trim();
                if (mId && mId !== 'none' && !viewedMoviesRef.current.has(mId)) {
                    viewedMoviesRef.current.add(mId);
                    trackEvent('recommendation_view', mId, '', {
                        reason: item.reason || 'Dành cho bạn',
                        score: item.recScore || 0,
                        source: item.recSource || 'hybrid',
                    });
                }
            });
        }
    }, [displayMovies]);

    const handleRecommendationClick = (item) => {
        const mId = String(item.id || item.movieId || '').trim();
        if (mId && mId !== 'none') {
            trackEvent('recommendation_click', mId, '', {
                reason: item.reason || 'Dành cho bạn',
                score: item.recScore || 0,
                source: item.recSource || 'hybrid',
            });
        }
    };

    if (!RECOMMENDATIONS_ENABLED && !loading) return null;
    if (!loading && displayMovies.length === 0) return null;

    return (
        <div className="bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3 pt-10 group cursor-pointer">
                    <h2 className="font-bold text-2xl md:text-3xl glow-text-multi group-hover:text-[#facc15] transition-colors duration-300">
                        Dành Cho Bạn
                    </h2>
                    <FaChevronRight className="border w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-transparent text-yellow-400 border-yellow-400/50 p-1 sm:p-1.5 rounded-full group-hover:bg-yellow-400 group-hover:text-black transition-colors duration-300" />
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    AI Đề Xuất
                </span>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button aria-label="Previous" className="movie-nav-btn movie-nav-btn--prev foryou-prev-btn" draggable="false">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{
                        nextEl: '.foryou-next-btn',
                        prevEl: '.foryou-prev-btn',
                    }}
                    breakpoints={{
                        0: { slidesPerView: 2, spaceBetween: 12 },
                        520: { slidesPerView: 3, spaceBetween: 15 },
                        728: { slidesPerView: 4, spaceBetween: 18 },
                        1024: { slidesPerView: 5, spaceBetween: 20 },
                        1280: { slidesPerView: 6, spaceBetween: 24 },
                    }}
                    className="movie-swiper"
                >
                    {displayMovies?.map((e) => (
                        <SwiperSlide key={e.id || e.movieId}>
                            <Link to={`/phim/${e.slug || e.id}`} onClick={() => handleRecommendationClick(e)}>
                                <div className="group cursor-pointer flex flex-col h-full">
                                    <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden bg-slate-800 shadow-lg border-3 border-transparent transition duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                        <img
                                            src={getOptimizedUrl(e.imgUrl, 300, 450, 'poster')}
                                            alt={e.name}
                                            className="w-full h-full object-cover"
                                            draggable="false"
                                            width={300}
                                            height={450}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40"></div>

                                        {/* Plan Badge (VIP / VVIP) */}
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

                                        {/* Bottom Information (Country & Duration) */}
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {(() => {
                                                const cId = (e.countriesID || '').toLowerCase();
                                                let bgCls = "from-indigo-500 to-purple-600";
                                                if (cId.includes('korea') || cId.includes('hàn')) bgCls = "from-cyan-500 to-blue-600";
                                                else if (cId.includes('china') || cId.includes('trung')) bgCls = "from-red-500 to-rose-600";
                                                else if (cId.includes('japan') || cId.includes('nhật')) bgCls = "from-pink-500 to-rose-500";
                                                else if (cId.includes('thai') || cId.includes('thái')) bgCls = "from-emerald-500 to-teal-600";
                                                else if (cId.includes('vietnam') || cId.includes('việt')) bgCls = "from-yellow-400 to-orange-500";
                                                else if (cId.includes('us') || cId.includes('mỹ') || cId.includes('u.s') || cId.includes('america')) bgCls = "from-blue-600 to-indigo-700";

                                                const textCls = cId.includes('vietnam') || cId.includes('việt') ? 'text-black' : 'text-white';

                                                return e.countriesID ? (
                                                    <p className={`bg-linear-to-r ${bgCls} ${textCls} text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap uppercase tracking-wider`}>
                                                        {e.countriesID}
                                                    </p>
                                                ) : null;
                                            })()}
                                            {e.duration && (
                                                <span className="flex items-center gap-1 text-black bg-linear-to-r from-yellow-300 to-yellow-500 px-1.5 py-0.5 rounded shadow-md text-[8px] md:text-[9px] font-bold whitespace-nowrap">
                                                    <FaClock /> {e.duration} phút
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Text Content Below Poster */}
                                    <div className="pt-2 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                        <h3 className="text-white font-bold text-sm md:text-base truncate w-full transition-colors group-hover:text-[#facc15]">
                                            {e.otherName || e.name}
                                        </h3>
                                        <p className="text-slate-400 text-[10px] md:text-[11px] truncate w-full mt-0.5 transition-colors group-hover:text-slate-200">
                                            {e.name}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5 w-full font-bold">
                                            {e.releaseYear && (
                                                <div className="flex items-center gap-1.5 text-white bg-linear-to-r from-blue-500 to-cyan-500 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                    <FaCalendarAlt /> {e.releaseYear}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5 text-white bg-linear-to-r from-purple-500 to-fuchsia-600 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(192,38,211,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                <FaEye /> {(Number(e.views) || 0) + 100}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button aria-label="Next" className="movie-nav-btn movie-nav-btn--next foryou-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}

export default ForYou;
