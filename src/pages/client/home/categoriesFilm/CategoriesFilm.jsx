import React, { useContext } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { CategoryContext } from '../../../../contexts/CategoryProvider';

function CategoriesFilm() {
    const categories = useContext(CategoryContext) || [];
    const movies = useMovies() || [];

    const validCategories = categories.filter(c => 
        movies.some(m => (m.listCategory || []).some(catId => String(catId) === String(c.id)))
    );

    const categoryStyles = [
        "from-blue-600 via-indigo-500 to-purple-600 shadow-[0_8px_15px_rgba(79,70,229,0.25)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.45)]",
        "from-rose-500 via-red-500 to-orange-500 shadow-[0_8px_15px_rgba(239,68,68,0.25)] hover:shadow-[0_12px_25px_rgba(249,115,22,0.45)]",
        "from-emerald-500 via-teal-500 to-cyan-600 shadow-[0_8px_15px_rgba(16,185,129,0.25)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.45)]",
        "from-fuchsia-600 via-pink-500 to-rose-500 shadow-[0_8px_15px_rgba(236,72,153,0.25)] hover:shadow-[0_12px_25px_rgba(236,72,153,0.45)]",
        "from-yellow-400 via-yellow-500 to-amber-600 shadow-[0_8px_15px_rgba(234,179,8,0.25)] hover:shadow-[0_12px_25px_rgba(234,179,8,0.45)]",
        "from-cyan-400 via-sky-500 to-blue-600 shadow-[0_8px_15px_rgba(14,165,233,0.25)] hover:shadow-[0_12px_25px_rgba(14,165,233,0.45)]"
    ];

    return (
        <div className=' w-full overflow-hidden bg-[#111827] py-5 px-6 md:px-10'>
            <h2 className='mb-6 text-2xl md:text-3xl font-bold glow-text-multi'>
                Bạn đang quan tâm gì?
            </h2>

            <div className="grid grid-cols-2 gap-4 pb-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {validCategories.length > 0 ? (
                    validCategories.slice(0, 6).map((e, index) => (
                        <Link
                            key={e.id}
                            to={`/category/${e.id}`}
                            className={`group flex h-20 sm:h-24 md:h-28 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-linear-to-br px-3 sm:px-4 md:px-5 transition duration-300 hover:-translate-y-2 ${categoryStyles[index % categoryStyles.length]}`}
                        >
                            <div className='rounded-full bg-white/25 blur-2xl transition duration-300 group-hover:scale-150'></div>
                            <h3 className='text-lg md:text-xl font-black whitespace-nowrap truncate text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'>{e.name}</h3>
                            <div className='mt-1.5 md:mt-2 flex items-center justify-center gap-1.5 text-xs md:text-sm font-semibold whitespace-nowrap text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'>
                                <p>Xem thể loại</p>
                                <FaChevronRight className='transition duration-300 group-hover:translate-x-1' />
                            </div>
                        </Link>
                    ))
                ) : (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 sm:h-24 md:h-28 rounded-xl bg-white/5 animate-pulse"></div>
                    ))
                )}
            </div>
        </div>
    );
}

export default CategoriesFilm;
