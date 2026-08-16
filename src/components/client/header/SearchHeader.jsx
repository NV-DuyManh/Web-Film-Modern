import { getOptimizedUrl } from '../../../utils/cloudinary';
import React, { useMemo, useRef } from 'react';
import { useMovies } from '../../../hooks/useCollections';
import { useNavigate } from 'react-router-dom';
import { PlanContext } from '../../../contexts/PlanProvider';
import { searchTV } from '../../../components/admin/search/SearchTV';
import { getObjectById } from '../../../services/firebaseResponse';
import { FaFilm } from 'react-icons/fa';

function SearchHeader({ searchQuery, isOpen, onClose }) {
    const navigate = useNavigate();
    const movies = useMovies();
    const plans = React.useContext(PlanContext);
    const searchRef = useRef(null);

    const dataSearch = useMemo(() => 
        (!searchQuery || searchQuery.trim() === "") ? [] : movies.filter(e => searchTV(e.name || '').includes(searchTV(searchQuery)) || searchTV(e.otherName || '').includes(searchTV(searchQuery))), 
    [searchQuery, movies]);

    const handleSelect = (movieId) => {
        onClose();
        navigate(`/phim/${movieId}`);
    };

    if (!isOpen || !searchQuery || searchQuery.trim() === "") return null;

    return (
        <div ref={searchRef} className="absolute top-full left-0 right-0 mt-2 z-9999 rounded-2xl overflow-hidden border border-white/10 bg-[#111827]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(0,242,254,0.1)]">
            {dataSearch.length > 0 ? (
                <>
                    <div className="px-4 pt-3 pb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Danh sách phim</p>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {dataSearch.map((movie) => (
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleSelect(movie.slug || movie.id); }}
                                className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-white/5 transition duration-200 cursor-pointer group/movie text-left"
                            >
                                <div className="w-13 h-18 rounded-lg overflow-hidden shrink-0 border border-white/10 group-hover/movie:border-cyan-500/50 transition-colors duration-300 bg-slate-800">
                                    <img src={getOptimizedUrl(movie.imgUrl, 100, 150, 'thumb')} alt={movie.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold text-[15px] leading-snug line-clamp-2 group-hover/movie:text-cyan-400 transition-colors duration-200">
                                        {movie.otherName || movie.name}
                                    </h4>
                                    {movie.otherName && movie.otherName !== movie.name && (
                                        <p className="text-slate-400 text-[13px] mt-0.5 line-clamp-1">{movie.name}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        {getObjectById(plans, movie.planID) && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border border-yellow-500/50 text-yellow-400 bg-yellow-500/10">
                                                {getObjectById(plans, movie.planID).name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 px-6">
                    <FaFilm className="text-slate-600 text-3xl mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Không tìm thấy phim nào cho "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
}

export default SearchHeader;
