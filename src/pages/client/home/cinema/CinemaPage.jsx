import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { Link , useSearchParams } from 'react-router-dom';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { getAgeRatingColorClass } from '../../../../utils/appUtils';
import { getOptimizedUrl } from '../../../../utils/cloudinary';
import { FaPlay, FaFilter, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaEye, FaShieldAlt } from 'react-icons/fa';
import { BsSearch } from 'react-icons/bs';
import ParticleBackground from '../../../../components/client/background/ParticleBackground';
import SEO from '../../../../components/SEO';
import { searchTV } from '../../../../components/admin/search/SearchTV';

function CinemaPage() {
    const movies = useMovies() || [];
    const plans = useContext(PlanContext) || [];
    const categoryTypes = useContext(CategoryTypeContext) || [];

    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page')) || 1;
    const [searchTerm, setSearchTerm] = useState('');
    const setPage = (updater) => {
        setSearchParams(prev => {
            const currentPage = parseInt(prev.get('page')) || 1;
            const newPage = typeof updater === 'function' ? updater(currentPage) : updater;
            prev.set('page', newPage);
            return prev;
        });
    };
    const moviesPerPage = 28;


    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const cinemaMovies = useMemo(() => {
        if (!movies || movies.length === 0) return [];
        let filtered = movies;
        const cinemaType = categoryTypes?.find(ct => ct.name.toLowerCase().includes('chiếu rạp'));
        if (cinemaType) {
            filtered = movies.filter(m => m.categoryTypeID === cinemaType.id);
            if (filtered.length < 15) {
                const others = movies.filter(m => m.categoryTypeID !== cinemaType.id);
                filtered = [...filtered, ...others];
            }
        }
        if (searchTerm) {
            filtered = filtered.filter(m => 
                searchTV(m.name || '').includes(searchTV(searchTerm)) || 
                searchTV(m.otherName || '').includes(searchTV(searchTerm))
            );
        }
        return filtered;
    }, [movies, categoryTypes, searchTerm]);

    const totalPages = Math.ceil(cinemaMovies.length / moviesPerPage) || 1;
    const safePage = Math.min(page, totalPages);
    const currentMovies = cinemaMovies.slice((safePage - 1) * moviesPerPage, safePage * moviesPerPage);

    const handlePrev = () => {
        setPage(p => (p > 1 ? p - 1 : p));
    };

    const handleNext = () => {
        setPage(p => (p < totalPages ? p + 1 : p));
    };

    return (
        <div className="w-full min-h-screen bg-[#0a0a0f] px-4 sm:px-6 md:px-8 relative overflow-hidden" style={{ paddingTop: '110px', paddingBottom: '40px' }}>
            <SEO 
                title="Mãn Nhãn với Phim Chiếu Rạp - MFILM"
                description="Tổng hợp phim chiếu rạp hay nhất, mới nhất tại MFILM."
                url="/cinema-movies"
            />
            <ParticleBackground />
            <div className="max-w-350 mx-auto relative z-10">
                <div className="mb-8 grid lg:grid-cols-8 gap-3 p-4 bg-black/20 text-white items-center rounded-xl border border-white/5">
                    <h1 className="font-bold text-3xl md:text-4xl glow-text lg:col-span-3 m-0 flex items-center cursor-default">
                        Phim Chiếu Rạp
                    </h1>

                    <div className="search lg:col-span-5">
                        <input
                            type="text"
                            placeholder="Tìm kiếm phim chiếu rạp..."
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

                {movies.length === 0 ? (
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
                ) : cinemaMovies.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-4 gap-y-8 mb-10">
                            {currentMovies.map(movie => (
                                <Link to={`/phim/${movie.slug || movie.id}`} key={movie.id} className="group flex flex-col">
                                    <div className="relative rounded-xl overflow-hidden aspect-2/3 border-3 border-transparent group-hover:border-[#facc15] transition duration-300 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)] group-hover:-translate-y-2">
                                        <img src={getOptimizedUrl(movie.imgUrl, 300, 450, 'poster')} alt={movie.name} className="w-full h-full object-cover transition-transform duration-500" width={300} height={450} loading="lazy" decoding="async" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                        
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

                                                return (
                                                    <p className={`bg-linear-to-r ${bgCls} ${textCls} text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap uppercase tracking-wider`}>
                                                        {movie.countriesID}
                                                    </p>
                                                );
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
                            ))}
                        </div>

                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button 
                                onClick={handlePrev} 
                                disabled={safePage === 1}
                                className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] disabled:opacity-50 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition"
                            >
                                <FaChevronLeft size={14} />
                            </button>
                            <div className="px-6 py-2 rounded-full bg-slate-800/80 text-slate-300 font-semibold text-sm shadow-inner">
                                Trang <span className="text-white mx-1">{safePage}</span> / {totalPages}
                            </div>
                            <button 
                                onClick={handleNext} 
                                disabled={safePage === totalPages}
                                className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] disabled:opacity-50 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition"
                            >
                                <FaChevronRight size={14} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="text-6xl mb-4">🎬</div>
                        <h2 className="text-xl text-slate-400 font-semibold">
                            {searchTerm ? "Không tìm thấy phim phù hợp" : "Chưa có phim nào"}
                        </h2>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CinemaPage;
