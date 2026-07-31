import React, { useContext, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MovieContext } from '../../../contexts/MovieProvider';
import { CategoriesContext } from '../../../contexts/CategoryProvider';
import { FaPlay, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function CategoryPage() {
    const { id } = useParams();
    const movies = useContext(MovieContext) || [];
    const categories = useContext(CategoriesContext) || [];

    const [page, setPage] = useState(1);
    const moviesPerPage = 14;

    const currentCategory = useMemo(() => {
        return categories.find(c => c.id === id) || { name: 'Đang cập nhật...' };
    }, [id, categories]);

    const categoryMovies = useMemo(() => {
        return movies.filter(m => {
            const list = m.list_Category || [];
            return list.includes(id);
        });
    }, [id, movies]);

    const totalPages = Math.ceil(categoryMovies.length / moviesPerPage) || 1;
    const currentMovies = categoryMovies.slice((page - 1) * moviesPerPage, page * moviesPerPage);

    const handlePrev = () => {
        if (page > 1) setPage(p => p - 1);
    };

    const handleNext = () => {
        if (page < totalPages) setPage(p => p + 1);
    };

    return (
        <div className="w-full min-h-screen bg-[#0f172a] px-4 sm:px-6 md:px-8" style={{ paddingTop: '110px', paddingBottom: '40px' }}>
            <div className="max-w-350 mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-black bg-linear-to-r from-pink-400 via-rose-400 to-red-400 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                        {currentCategory.name}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer transition-colors w-max">
                        <FaFilter size={14} />
                        <span className="font-semibold text-sm">Bộ lọc</span>
                    </div>
                </div>

                {categoryMovies.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 mb-10">
                            {currentMovies.map(movie => (
                                <Link to={`/detailFilm/${movie.id}`} key={movie.id} className="group flex flex-col gap-2">
                                    <div className="relative rounded-xl overflow-hidden aspect-2/3 border-[3px] border-transparent group-hover:border-[#facc15] transition-all duration-300 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)] group-hover:-translate-y-2">
                                        <img src={movie.imgUrl} alt={movie.name} className="w-full h-full object-cover transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                        
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <div className="w-12 h-12 rounded-full bg-pink-500/80 backdrop-blur-sm flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.8)] border border-pink-400">
                                                <FaPlay className="text-white ml-1" />
                                            </div>
                                        </div>

                                        <div className="absolute bottom-2 left-2 flex gap-1 z-10">
                                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(37,99,235,0.8)]">PD. {movie.totalEpisodes || 1}</span>
                                        </div>
                                        <div className="absolute bottom-2 right-2 flex gap-1 z-10">
                                            <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(34,197,94,0.8)]">TM. 1</span>
                                        </div>
                                    </div>
                                    
                                    <div className="px-1 text-center">
                                        <h3 className="text-white font-bold text-[13px] md:text-sm line-clamp-1 group-hover:text-pink-400 transition-colors">
                                            {movie.name}
                                        </h3>
                                        <p className="text-slate-400 text-[10px] md:text-xs line-clamp-1 mt-0.5">
                                            {movie.otherName || movie.name}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button 
                                onClick={handlePrev} 
                                disabled={page === 1}
                                className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] disabled:opacity-50 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-all"
                            >
                                <FaChevronLeft size={14} />
                            </button>
                            <div className="px-6 py-2 rounded-full bg-slate-800/80 text-slate-300 font-semibold text-sm shadow-inner">
                                Trang <span className="text-white mx-1">{page}</span> / {totalPages}
                            </div>
                            <button 
                                onClick={handleNext} 
                                disabled={page === totalPages}
                                className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] disabled:opacity-50 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-all"
                            >
                                <FaChevronRight size={14} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="text-6xl mb-4">🎬</div>
                        <h2 className="text-xl text-slate-400 font-semibold">Chưa có phim nào trong thể loại này</h2>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CategoryPage;
