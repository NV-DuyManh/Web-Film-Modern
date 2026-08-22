import { useSearchParams } from 'react-router-dom';
import React, { useEffect, useState, useMemo } from 'react';
import ParticleBackground from '../../../components/client/background/ParticleBackground';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { BsSearch } from 'react-icons/bs';
import { fetchDocumentsRealtime } from '../../../services/firebaseService';
import { getDefaultAvatar, getSafeEntityAvatar } from '../../../utils/appUtils';
import { searchTV } from '../../../components/admin/search/SearchTV';
import SEO from '../../../components/SEO';

function Actors() {
    const [searchTerm, setSearchTerm] = useState('');
    const [actors, setActors] = useState([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page')) || 1;
    const setPage = (updater) => {
        setSearchParams(prev => {
            const currentPage = parseInt(prev.get('page')) || 1;
            const newPage = typeof updater === 'function' ? updater(currentPage) : updater;
            prev.set('page', newPage);
            return prev;
        });
    };
    const itemsPerPage = 24;

    useEffect(() => {
        window.scrollTo(0, 0);
        const unsub = fetchDocumentsRealtime("Actors", setActors);
        return () => unsub();
    }, []);


    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const filteredActors = useMemo(() => {
        if (!actors) return [];
        if (!searchTerm) return actors;
        return actors.filter(actor =>
            searchTV(actor.name || '').includes(searchTV(searchTerm))
        );
    }, [actors, searchTerm]);

    const totalPages = Math.ceil(filteredActors.length / itemsPerPage) || 1;
    const safePage = Math.min(page, totalPages);
    const currentActors = filteredActors.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

    const handlePrev = () => {
        setPage(p => (p > 1 ? p - 1 : p));
    };

    const handleNext = () => {
        setPage(p => (p < totalPages ? p + 1 : p));
    };

    return (
        <div className="w-full min-h-screen bg-[#0a0a0f] px-4 sm:px-6 md:px-8 relative overflow-hidden" style={{ paddingTop: '110px', paddingBottom: '40px' }}>
            <SEO 
                title="Diễn Viên - Danh Sách Diễn Viên"
                description="Tổng hợp danh sách diễn viên nổi tiếng, thông tin tiểu sử và phim đã tham gia tại MFILM."
                url="/actors"
            />
            <ParticleBackground />
            <div className="max-w-350 mx-auto relative z-10">
                <div className="mb-8 grid lg:grid-cols-8 gap-3 p-4 bg-black/20 text-white items-center rounded-xl border border-white/5">
                    <h1 className="font-bold text-3xl md:text-4xl glow-text lg:col-span-3 m-0 flex items-center cursor-default">
                        Diễn viên
                    </h1>

                    <div className="search lg:col-span-5">
                        <input
                            type="text"
                            placeholder="Tìm kiếm diễn viên..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="search-input"
                        />
                        <BsSearch className="search-icon" />
                    </div>
                </div>

                {actors.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 md:gap-x-5 md:gap-y-6 mb-10">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2.5 animate-pulse">
                                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-38 lg:h-38 xl:w-40 xl:h-40 rounded-full bg-slate-700/50"></div>
                                <div className="h-3.5 bg-slate-700/40 rounded w-20"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredActors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="text-6xl mb-4">🎭</div>
                        <h2 className="text-xl text-slate-400 font-semibold">
                            {searchTerm ? "Không tìm thấy diễn viên phù hợp" : "Chưa có diễn viên nào"}
                        </h2>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 md:gap-x-5 md:gap-y-6 mb-10 min-h-[50vh]">
                            {currentActors.map((actor) => (
                                <div key={actor.id} className="group cursor-pointer flex flex-col items-center">
                                    <div className="relative mb-2 w-full flex justify-center">
                                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-38 lg:h-38 xl:w-40 xl:h-40 rounded-full overflow-hidden bg-slate-800 shadow-lg border-3 border-transparent group-hover:border-[#facc15] transition duration-300 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)] group-hover:-translate-y-2">
                                            <img
                                                src={getSafeEntityAvatar(actor.imgUrl, actor.sexID)}
                                                alt={actor.name}
                                                className="w-full h-full object-cover rounded-full"
                                                loading="lazy"
                                                onError={(e) => { e.target.onerror = null; e.target.src = getDefaultAvatar(actor.sexID); }}
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="pt-1 px-1 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1 w-full">
                                        <h3 className="text-white font-bold text-sm md:text-base truncate w-full transition-colors group-hover:text-[#facc15]">
                                            {actor.name}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
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
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Actors;

