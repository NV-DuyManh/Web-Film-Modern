import React, { useContext } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { CategoriesContext } from '../../../../contexts/CategoryProvider';

function CategoriesFilm() {
    const categories = useContext(CategoriesContext); 


    const categoryStyles = [
        "from-emerald-300 via-blue-500 to-purple-600 shadow-[0_14px_35px_rgba(59,130,246,0.25)] hover:shadow-[0_18px_45px_rgba(168,85,247,0.45)]",
        "from-pink-500 via-red-500 to-yellow-500 shadow-[0_14px_35px_rgba(239,68,68,0.25)] hover:shadow-[0_18px_45px_rgba(249,115,22,0.45)]",
        "from-yellow-200 via-green-200 to-green-500 shadow-[0_14px_35px_rgba(34,197,94,0.25)] hover:shadow-[0_18px_45px_rgba(34,197,94,0.45)]",
        "from-purple-200 via-purple-400 to-purple-800 shadow-[0_14px_35px_rgba(147,51,234,0.25)] hover:shadow-[0_18px_45px_rgba(147,51,234,0.45)]",
        "from-red-400 via-gray-300 to-blue-500 shadow-[0_14px_35px_rgba(96,165,250,0.25)] hover:shadow-[0_18px_45px_rgba(96,165,250,0.45)]",
        "from-yellow-200 via-pink-200 to-pink-400 shadow-[0_14px_35px_rgba(244,114,182,0.25)] hover:shadow-[0_18px_45px_rgba(244,114,182,0.45)]"
    ];

    return (
        <div className=' w-full overflow-hidden bg-[#111827] py-5 px-6 md:px-10'>
            <h1 className='mb-6 text-2xl md:text-3xl font-bold glow-text-multi'>
                Bạn đang quan tâm gì?
            </h1>

            <div className="grid grid-cols-2 gap-6  pb-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {categories.slice(0, 6).map((e, index) => (
                    <Link
                        key={e.id}
                        to={`/topic/${e.id}`}
                        className={`group flex h-34 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br px-7 transition-all duration-300 hover:-translate-y-2 ${categoryStyles[index % categoryStyles.length]}`}
                    >
                        <div className='rounded-full bg-white/25 blur-2xl transition-all duration-300 group-hover:scale-150'></div>
                        <h2 className='text-2xl font-black whitespace-nowrap tuncate'>{e.name}</h2>
                        <div className='mt-4 flex items-center justify-center gap-2 text-lg font-semibold whitespace-nowrap'>
                            <p>Xem chủ đề</p>
                            <FaChevronRight className='transition-all duration-300 group-hover:translate-x-1' />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default CategoriesFilm;
