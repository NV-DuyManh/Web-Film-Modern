import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
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
import { trackEvent, getSessionId } from '../../../../services/eventTracker';

// ─── Minimal Error Boundary ────────────────────────────────────────────────────
// Prevents any ForYou render/mapping error from crashing the entire homepage.
class ForYouErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) return null; // fail silently
        return this.props.children;
    }
}

function ForYouInner() {
    const movies = useMovies();
    const plans = useContext(PlanContext);
    const authContext = useContext(AuthContext);
    const isLogin = authContext?.isLogin;
    // authEpoch increments on every login/logout/account-switch (provided by AuthProvider).
    // Capturing it at fetch-start lets us discard stale responses from previous accounts.
    const authEpoch = authContext?.authEpoch ?? 0;

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const viewedMoviesRef = useRef(new Set());
    // Track the abort controller for the current in-flight request
    const abortControllerRef = useRef(null);
    const swiperRef = useRef(null);

    const RECOMMENDATIONS_ENABLED = import.meta.env?.VITE_RECOMMENDATIONS_ENABLED === 'true';
    const API_BASE_URL =
        import.meta.env?.VITE_API_BASE_URL ||
        import.meta.env?.VITE_EVENT_API_BASE_URL ||
        'https://mfilm-backend.onrender.com/api/v1';

    // Clear recommendations and reset viewed set whenever the account changes.
    // This ensures Account A's cards are never shown briefly under Account B.
    useEffect(() => {
        setRecommendations([]);
        setLoading(true);
        viewedMoviesRef.current = new Set();
    }, [authEpoch]);

    useEffect(() => {
        if (!RECOMMENDATIONS_ENABLED) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        // Capture epoch at effect-start: any response that arrives after epoch changes is stale
        const epochAtFetchStart = authEpoch;

        // Cancel any previous in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        async function fetchRecommendations() {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                const headers = { 'Content-Type': 'application/json' };

                // 1. Authenticated identity: STRICTLY via cryptographically verified Bearer token
                if (user) {
                    try {
                        const token = await user.getIdToken();
                        // Guard: if epoch changed during async getIdToken(), discard
                        if (authContext?.authEpoch !== epochAtFetchStart) return;
                        headers['Authorization'] = `Bearer ${token}`;
                    } catch {
                        // proceed without token
                    }
                }

                // 2. Anonymous session correlation key (never treated as user ID)
                const sessionId = getSessionId();
                if (sessionId) {
                    headers['x-session-id'] = sessionId;
                }

                const queryParams = new URLSearchParams({ limit: '15' });
                if (sessionId) {
                    queryParams.set('sessionId', sessionId);
                }

                const url = `${API_BASE_URL.replace(/\/+$/, '')}/recommendations/for-you?${queryParams.toString()}`;
                const res = await fetch(url, { headers, signal: controller.signal });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();

                // Stale-response guard: discard if epoch changed since fetch started
                // (e.g., user logged out or switched accounts while request was in-flight)
                if (!isMounted) return;
                if (authContext?.authEpoch !== epochAtFetchStart) return;

                // Zero-Signal Gating: If eligible is false or no items, clear recommendations
                if (data.success && data.eligible && Array.isArray(data.items) && data.items.length > 0) {
                    setRecommendations(data.items);
                } else {
                    setRecommendations([]);
                }
            } catch (err) {
                if (err?.name === 'AbortError') return; // expected: request was cancelled
                // On any other error, clear recommendations (never fallback to generic popularity)
                if (isMounted && authContext?.authEpoch === epochAtFetchStart) {
                    setRecommendations([]);
                }
            } finally {
                if (isMounted && authContext?.authEpoch === epochAtFetchStart) {
                    setLoading(false);
                }
            }
        }

        fetchRecommendations();

        // Also listen for Firebase Auth state changes in case credentials hydrate asynchronously.
        // This handles the case where getAuth().currentUser is null when effect first runs
        // but Firebase resolves the session shortly after (Google SSO restore on page load).
        const firebaseAuth = getAuth();
        const unsubscribe = onAuthStateChanged(firebaseAuth, () => {
            if (isMounted && authContext?.authEpoch === epochAtFetchStart) {
                fetchRecommendations();
            }
        });

        return () => {
            isMounted = false;
            controller.abort();
            unsubscribe();
        };
    // Re-run whenever: feature flag, API URL, auth epoch, user id, or favorite count changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RECOMMENDATIONS_ENABLED, API_BASE_URL, authEpoch, isLogin?.id, isLogin?.listFavorite?.length]);

    // Merge recommendation items with full catalog movies for rich presentation
    const displayMovies = useMemo(() => {
        if (!recommendations || recommendations.length === 0) {
            return [];
        }

        try {
            const seen = new Set();
            return recommendations.map((item) => {
                if (!item) return null;
                const rawId = item.movieId || item.id;
                const stableId = (typeof rawId === 'string' || typeof rawId === 'number')
                    ? String(rawId).trim()
                    : '';
                if (!stableId || stableId === '[object Object]' || stableId === 'none') {
                    return null;
                }

                const itemSlug = typeof item.slug === 'string' ? item.slug.trim() : '';

                // Enrich from catalog if movies from useMovies() are already loaded
                const catalogMovie = Array.isArray(movies) && movies.length > 0
                    ? movies.find((m) => {
                        const mId = String(m?.id || '').trim();
                        const mSlug = String(m?.slug || '').trim();
                        return (mId && mId === stableId) || (itemSlug && mSlug && mSlug === itemSlug);
                    })
                    : null;

                if (catalogMovie) {
                    return {
                        ...catalogMovie,
                        id: stableId,
                        slug: itemSlug || catalogMovie.slug,
                        name: catalogMovie.name || item.name,
                        otherName: catalogMovie.otherName || item.otherName || item.name,
                        imgUrl: catalogMovie.imgUrl || item.imgUrl || item.img_url,
                        bannerUrl: catalogMovie.bannerUrl || item.bannerUrl || item.banner_url || catalogMovie.imgUrl || item.imgUrl,
                        reason: item.reason || 'Dành cho bạn',
                        recScore: item.score,
                        recSource: item.recommendationSource || 'hybrid',
                    };
                }

                // Self-sufficient fallback directly from API payload
                if (item.name && (item.imgUrl || item.img_url)) {
                    return {
                        id: stableId,
                        slug: itemSlug || stableId,
                        name: item.name,
                        otherName: item.otherName || item.name,
                        imgUrl: item.imgUrl || item.img_url,
                        bannerUrl: item.bannerUrl || item.banner_url || item.imgUrl || item.img_url,
                        reason: item.reason || 'Dành cho bạn',
                        recScore: item.score,
                        recSource: item.recommendationSource || 'hybrid',
                    };
                }

                return null;
            }).filter((m) => {
                if (!m) return false;
                const id = String(m.id || '').trim();
                if (!id || id === 'none' || seen.has(id)) return false;
                seen.add(id);
                return true;
            });
        } catch {
            // Defensive: if any mapping error occurs, hide section rather than crash homepage
            return [];
        }
    }, [recommendations, movies]);

    // Emit recommendation_view telemetry for rendered items
    useEffect(() => {
        if (displayMovies && displayMovies.length > 0) {
            displayMovies.forEach((item) => {
                try {
                    const mId = String(item.id || item.movieId || '').trim();
                    if (mId && mId !== 'none' && !viewedMoviesRef.current.has(mId)) {
                        viewedMoviesRef.current.add(mId);
                        trackEvent('recommendation_view', mId, '', {
                            reason: item.reason || 'Dành cho bạn',
                            score: item.recScore || 0,
                            source: item.recSource || 'hybrid',
                        });
                    }
                } catch {
                    // non-fatal telemetry error
                }
            });
        }
    }, [displayMovies]);

    const handleRecommendationClick = useCallback((item) => {
        try {
            const mId = String(item.id || item.movieId || '').trim();
            if (mId && mId !== 'none') {
                trackEvent('recommendation_click', mId, '', {
                    reason: item.reason || 'Dành cho bạn',
                    score: item.recScore || 0,
                    source: item.recSource || 'hybrid',
                });
            }
        } catch {
            // non-fatal
        }
    }, []);

    // Strictly hide the entire section if disabled, still loading, or no items to display
    // Invariant: Heading "Dành Cho Bạn" is NEVER rendered unless displayMovies has items
    if (!RECOMMENDATIONS_ENABLED) return null;
    if (loading) return null;
    if (!displayMovies || displayMovies.length === 0) return null;

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
                <button 
                    aria-label="Previous" 
                    className="movie-nav-btn movie-nav-btn--prev foryou-prev-btn" 
                    draggable="false"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        swiperRef.current?.slidePrev();
                    }}
                >
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    onSwiper={(swiper) => (swiperRef.current = swiper)}
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
                        <SwiperSlide key={e.id || e.slug}>
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

                <button 
                    aria-label="Next" 
                    className="movie-nav-btn movie-nav-btn--next foryou-next-btn" 
                    draggable="false"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        swiperRef.current?.slideNext();
                    }}
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}

// Wrap in error boundary so any unexpected render error never crashes the homepage
function ForYou() {
    return (
        <ForYouErrorBoundary>
            <ForYouInner />
        </ForYouErrorBoundary>
    );
}

export default ForYou;
