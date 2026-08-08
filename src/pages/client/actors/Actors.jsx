import React, { useEffect, useState } from 'react';
import ParticleBackground from '../../../components/client/background/ParticleBackground';
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { fetchDocumentsRealtime } from '../../../services/firebaseService';
import { getDefaultAvatar } from '../../../utils/defaultAvatar';

function Actors() {
    const [searchTerm, setSearchTerm] = useState('');
    const [actors, setActors] = useState([]);
    
    const [page, setPage] = useState(1);
    const itemsPerPage = 18;

    useEffect(() => {
        window.scrollTo(0, 0);
        const unsub = fetchDocumentsRealtime("Actors", setActors);
        return () => unsub();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const filteredActors = actors.filter(actor => 
        actor.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredActors.length / itemsPerPage) || 1;
    const safePage = Math.min(page, totalPages);
    const currentActors = filteredActors.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

    const handlePrev = () => {
        setPage(p => (p > 1 ? p - 1 : p));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNext = () => {
        setPage(p => (p < totalPages ? p + 1 : p));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="w-full min-h-screen bg-[#0a0a0f] px-4 sm:px-6 md:px-8 relative overflow-hidden" style={{ paddingTop: '110px', paddingBottom: '40px' }}>
            <ParticleBackground />
            <div className="max-w-350 mx-auto relative z-10">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl md:text-4xl font-black bg-linear-to-r from-purple-400 via-pink-400 to-amber-300 text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(236,72,153,0.3)] tracking-tight mb-2 cursor-default pb-2">
                        Diễn viên
                    </h1>

                    <div className="relative w-full md:w-80">
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm diễn viên..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-full px-5 py-2.5 pl-12 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all placeholder:text-slate-500"
                        />
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {filteredActors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="text-6xl mb-4">🎭</div>
                        <h2 className="text-xl text-slate-400 font-semibold">
                            {actors.length === 0 ? "Đang tải dữ liệu..." : "Không tìm thấy diễn viên nào"}
                        </h2>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-8 mb-10 min-h-[50vh]">
                            {currentActors.map((actor) => (
                                <div key={actor.id} className="group flex flex-col cursor-pointer">
                                    <div className="relative rounded-2xl overflow-hidden aspect-4/5 md:aspect-3/4 border-[2px] border-transparent group-hover:border-pink-500/80 transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(236,72,153,0.25)] group-hover:-translate-y-2">
                                        <img 
                                            src={(!actor.imgUrl || actor.imgUrl.includes('Logo')) ? getDefaultAvatar(actor.sexID) : actor.imgUrl} 
                                            alt={actor.name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            loading="lazy"
                                            onError={(e) => { e.target.onerror = null; e.target.src = getDefaultAvatar(actor.sexID); }}
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        
                                        <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col items-center justify-end z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <h3 className="text-white font-bold text-sm md:text-lg text-center line-clamp-1 group-hover:text-pink-400 transition-colors drop-shadow-md">
                                                {actor.name}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button 
                                    onClick={handlePrev} 
                                    disabled={safePage === 1}
                                    className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] disabled:opacity-50 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-all"
                                >
                                    <FaChevronLeft size={14} />
                                </button>
                                <div className="px-6 py-2 rounded-full bg-slate-800/80 text-slate-300 font-semibold text-sm shadow-inner">
                                    Trang <span className="text-white mx-1">{safePage}</span> / {totalPages}
                                </div>
                                <button 
                                    onClick={handleNext} 
                                    disabled={safePage === totalPages}
                                    className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] disabled:opacity-50 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-all"
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

