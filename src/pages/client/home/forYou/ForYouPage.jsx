import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { Link, useSearchParams } from 'react-router-dom';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { getOptimizedUrl } from '../../../../utils/cloudinary';
import { FaCalendarAlt, FaEye, FaShieldAlt } from 'react-icons/fa';
import { BsSearch } from 'react-icons/bs';
import { getAuth } from 'firebase/auth';
import ParticleBackground from '../../../../components/client/background/ParticleBackground';
import SEO from '../../../../components/SEO';
import { getAgeRatingColorClass } from '../../../../utils/appUtils';
import Pagination from '../../../../components/common/Pagination';
import { searchTV } from '../../../../components/admin/search/SearchTV';
import { trackEvent, getSessionId } from '../../../../services/eventTracker';

const MovieCard = React.memo(({ movie, plans, onMovieClick }) => {
    return (
        <Link 
            to={`/phim/${movie.slug || movie.id}`} 
            className="group flex flex-col"
            onClick={() => onMovieClick?.(movie)}
        >
            <div className="relative rounded-xl overflow-hidden aspect-2/3 border-3 border-transparent group-hover:border-[#facc15] transition duration-300 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)] group-hover:-translate-y-2">
                <img 
                    src={getOptimizedUrl(movie.imgUrl, 300, 450, 'poster')} 
                    alt={movie.name} 
                    className="w-full h-full object-cover transition-transform duration-500" 
                    width={300} 
                    height={450} 
                    loading="lazy" 
                    decoding="async" 
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Plan Badge (VIP / VVIP / PLUS / PREMIUM) */}
                {movie.planID && (() => {
                    const plan = getObjectById(plans, movie.planID);
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

                {/* Recommendation Reason Tag */}
                {movie.reason && (
                    <div className="absolute top-2 left-2 z-10 max-w-[80%]">
                        <span className="inline-block text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded bg-black/75 text-amber-300 border border-amber-500/40 backdrop-blur-xs truncate shadow-sm">
                            {movie.reason}
                        </span>
                    </div>
                )}

                {/* Country & Age Badges */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 w-max">
                    {(() => {
                        const cId = (movie.countriesID || '').toLowerCase();
                        let bgCls = "from-indigo-500 to-purple-600";
                        if (cId.includes('korea') || cId.includes('hàn')) bgCls = "from-cyan-500 to-blue-600";
                        else if (cId.includes('china') || cId.includes('trung')) bgCls = "from-red-500 to-rose-600";
                        else if (cId.includes('japan') || cId.includes('nhật')) bgCls = "from-pink-500 to-rose-500";
                        else if (cId.includes('thai') || cId.includes('thái')) bgCls = "from-emerald-500 to-teal-600";
                        else if (cId.includes('vietnam') || cId.includes('việt')) bgCls = "from-yellow-400 to-orange-500";
                        else if (cId.includes('us') || cId.includes('mỹ') || cId.includes('u.s') || cId.includes('america')) bgCls = "from-blue-600 to-indigo-700";

                        const textCls = cId.includes('vietnam') || cId.includes('việt') ? 'text-black' : 'text-white';

                        return movie.countriesID ? (
                            <p className={`bg-linear-to-r ${bgCls} ${textCls} text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap uppercase tracking-wider`}>
                                {movie.countriesID}
                            </p>
                        ) : null;
                    })()}
                    {(() => {
                        const rating = movie.ageRating || 'T13';
                        const colorClass = getAgeRatingColorClass(rating);

                        return (
                            <p className={`flex items-center gap-1 text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap ${colorClass}`}>
                                <FaShieldAlt /> {rating}
                            </p>
                        );
                    })()}
                </div>
            </div>
            
            <div className="pt-1 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                <h3 className="text-white font-bold text-sm md:text-base truncate w-full transition-colors group-hover:text-[#facc15]">
                    {movie.otherName || movie.name}
                </h3>
                <p className="text-slate-400 text-[10px] md:text-[11px] truncate w-full mt-0.5 transition-colors group-hover:text-slate-200">
                    {movie.name}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5 w-full font-bold">
                    {movie.releaseYear && (
                        <div className="flex items-center gap-1.5 text-white bg-linear-to-r from-blue-500 to-cyan-500 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                            <FaCalendarAlt /> {movie.releaseYear}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-white bg-linear-to-r from-purple-500 to-fuchsia-600 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(192,38,211,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                        <FaEye /> {(Number(movie.views) || 0) + 100}
                    </div>
                </div>
            </div>
        </Link>
    );
});

function ForYouPage() {
    const movies = useMovies() || [];
    const plans = useContext(PlanContext) || [];
    const authContext = useContext(AuthContext);
    const isLogin = authContext?.isLogin;
    const firebaseUser = authContext?.firebaseUser;
    const firebaseAuthReady = authContext?.firebaseAuthReady ?? false;
    const authEpoch = authContext?.authEpoch ?? 0;

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page')) || 1;

    const abortControllerRef = useRef(null);
    const activeRequestRef = useRef({ epoch: -1, uid: null });

    const RECOMMENDATIONS_ENABLED = import.meta.env?.VITE_RECOMMENDATIONS_ENABLED === 'true';
    const API_BASE_URL =
        import.meta.env?.VITE_API_BASE_URL ||
        import.meta.env?.VITE_EVENT_API_BASE_URL ||
        'https://mfilm-backend.onrender.com/api/v1';

    const moviesPerPage = 28;

    const setPage = (updater) => {
        setSearchParams(prev => {
            const currentPage = parseInt(prev.get('page')) || 1;
            const newPage = typeof updater === 'function' ? updater(currentPage) : updater;
            prev.set('page', newPage);
            return prev;
        });
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    // Clear recommendations on account switch to guarantee isolation
    useEffect(() => {
        setRecommendations([]);
        setLoading(true);
    }, [authEpoch, firebaseUser?.uid]);

    useEffect(() => {
        if (!RECOMMENDATIONS_ENABLED) {
            setLoading(false);
            return;
        }

        if (!firebaseAuthReady) {
            setLoading(true);
            return;
        }

        let isMounted = true;
        const currentEpoch = authEpoch;
        const currentUid = firebaseUser?.uid || (isLogin ? String(isLogin.id) : 'anon');

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        activeRequestRef.current = { epoch: currentEpoch, uid: currentUid };

        async function fetchRecommendations() {
            setLoading(true);
            try {
                const auth = getAuth();
                const user = firebaseUser || auth.currentUser;
                const headers = { 'Content-Type': 'application/json' };

                if (user) {
                    try {
                        const token = await user.getIdToken();
                        if (!isMounted || activeRequestRef.current.epoch !== currentEpoch || activeRequestRef.current.uid !== currentUid) {
                            return;
                        }
                        headers['Authorization'] = `Bearer ${token}`;
                    } catch {
                        // proceed without token
                    }
                }

                const sessionId = getSessionId();
                if (sessionId) {
                    headers['x-session-id'] = sessionId;
                }

                // Request up to safe maximum limit of 30 for the dedicated view-more page
                const queryParams = new URLSearchParams({ limit: '30' });
                if (sessionId) {
                    queryParams.set('sessionId', sessionId);
                }

                const url = `${API_BASE_URL.replace(/\/+$/, '')}/recommendations/for-you?${queryParams.toString()}`;
                const res = await fetch(url, { headers, signal: controller.signal });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();

                if (!isMounted) return;
                if (activeRequestRef.current.epoch !== currentEpoch || activeRequestRef.current.uid !== currentUid) {
                    return;
                }

                if (data.success && Array.isArray(data.items) && data.items.length > 0) {
                    setRecommendations(data.items);
                }
            } catch (err) {
                if (err?.name === 'AbortError') return;
            } finally {
                if (isMounted && activeRequestRef.current.epoch === currentEpoch && activeRequestRef.current.uid === currentUid) {
                    setLoading(false);
                }
            }
        }

        fetchRecommendations();

        return () => {
            isMounted = false;
            controller.abort();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        RECOMMENDATIONS_ENABLED,
        API_BASE_URL,
        firebaseAuthReady,
        firebaseUser?.uid,
        authEpoch,
        isLogin?.id,
        isLogin?.listFavorite?.length
    ]);

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
                const itemSlug = item.slug ? String(item.slug).trim() : '';

                const catalogMovie = Array.isArray(movies)
                    ? movies.find((cm) => {
                        if (!cm) return false;
                        const cmId = String(cm.id || '').trim();
                        const cmSlug = String(cm.slug || '').trim();
                        return (stableId && cmId === stableId) || (itemSlug && cmSlug === itemSlug);
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
            return [];
        }
    }, [recommendations, movies]);

    // Active recommendation pool with fallback to top catalog movies when empty
    const allRecommendationMovies = useMemo(() => {
        if (displayMovies && displayMovies.length > 0) return displayMovies;
        if (Array.isArray(movies) && movies.length > 0) {
            return movies.slice(0, 30).map((m) => ({
                ...m,
                reason: 'Gợi ý để bạn khám phá',
                recScore: 0.5,
                recSource: 'cold_start',
            }));
        }
        return [];
    }, [displayMovies, movies]);

    // Filter within current recommendation set by search term
    const filteredMovies = useMemo(() => {
        if (!allRecommendationMovies) return [];
        if (!searchTerm.trim()) return allRecommendationMovies;

        const normalizedTerm = searchTV(searchTerm.trim());
        return allRecommendationMovies.filter((m) =>
            searchTV(m.name || '').includes(normalizedTerm) ||
            searchTV(m.otherName || '').includes(normalizedTerm)
        );
    }, [allRecommendationMovies, searchTerm]);

    const totalPages = Math.ceil(filteredMovies.length / moviesPerPage) || 1;
    const safePage = Math.min(page, totalPages);
    const currentMovies = filteredMovies.slice((safePage - 1) * moviesPerPage, safePage * moviesPerPage);

    const handleMovieClick = useCallback((item) => {
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

    const isInitialLoading = (loading || !firebaseAuthReady) && allRecommendationMovies.length === 0;

    return (
        <div className="w-full min-h-screen bg-[#0a0a0f] px-4 sm:px-6 md:px-8 relative overflow-hidden" style={{ paddingTop: '110px', paddingBottom: '40px' }}>
            <SEO 
                title="Dành Cho Bạn - Phim Đề Xuất Cho Bạn - MFILM"
                description="Tổng hợp các bộ phim được đề xuất dành riêng cho bạn trên MFILM, cá nhân hoá theo sở thích và xu hướng xem phim."
                url="/for-you"
            />
            <ParticleBackground />
            
            <div className="max-w-350 mx-auto relative z-10">
                <div className="mb-8 grid lg:grid-cols-8 gap-3 p-4 bg-black/20 text-white items-center rounded-xl border border-white/5">
                    <div className="lg:col-span-4 flex items-center gap-3">
                        <h1 className="font-bold text-3xl md:text-4xl glow-text m-0 cursor-default">
                            Dành Cho Bạn
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            AI Đề Xuất
                        </span>
                    </div>

                    <div className="search lg:col-span-4">
                        <input
                            type="text"
                            placeholder="Tìm kiếm trong danh sách đề xuất..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                        <BsSearch className="search-icon" />
                    </div>
                </div>

                {isInitialLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-4 gap-y-8 mb-10">
                        {Array.from({ length: 28 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2 animate-pulse">
                                <div className="rounded-xl aspect-2/3 bg-slate-700/50"></div>
                                <div className="px-1 space-y-1.5">
                                    <div className="h-3.5 bg-slate-700/50 rounded w-3/4 mx-auto"></div>
                                    <div className="h-2.5 bg-slate-700/30 rounded w-1/2 mx-auto"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredMovies.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-4 gap-y-8 mb-10">
                            {currentMovies.map((movie) => (
                                <MovieCard 
                                    key={movie.id || movie.slug} 
                                    movie={movie} 
                                    plans={plans} 
                                    onMovieClick={handleMovieClick}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <Pagination
                                currentPage={safePage}
                                totalPages={totalPages}
                                totalItems={filteredMovies.length}
                                itemsPerPage={moviesPerPage}
                                onPageChange={(p) => setPage(p)}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="text-6xl mb-4">🎬</div>
                        <h2 className="text-xl text-slate-400 font-semibold">
                            {searchTerm ? "Không tìm thấy phim phù hợp trong danh sách đề xuất" : "Chưa có phim đề xuất nào"}
                        </h2>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForYouPage;
