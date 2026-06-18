import React, { useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './TopFilm.css';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';

export default function TopFilm() {
    const movies = useContext(MovieContext);
    const topMovies = movies?.slice(0, 10) || [];

    return (
        <div className='bg-[#111827] w-full text-white py-10 px-6 md:px-10 overflow-hidden'>
            <div className='mb-2'>
                <h1 className='font-bold text-2xl md:text-3xl'>
                    Top 10 phim bộ hôm nay
                </h1>
            </div>

            <div className="top-slider-wrapper relative group/slider">
                <button className="top-nav-btn top-nav-btn--prev">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{
                        nextEl: '.top-nav-btn--next',
                        prevEl: '.top-nav-btn--prev',
                    }}
                    breakpoints={{
                        0: { slidesPerView: 2, spaceBetween: 12 },
                        640: { slidesPerView: 3, spaceBetween: 15 },
                        1024: { slidesPerView: 5, spaceBetween: 20 },
                        1280: { slidesPerView: 6, spaceBetween: 20 },
                    }}
                    className="top-swiper"
                >
                    {topMovies.map((e, index) => (
                        <SwiperSlide key={e.id}>
                            <div className="group cursor-pointer flex flex-col h-full">
                                
                                <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                    <img 
                                        src={e.imgUrl} 
                                        alt={e.name} 
                                        className="w-full h-full object-cover" 
                                        draggable="false"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-30"></div>
                                    
                                    <div className="absolute bottom-2 right-2 flex gap-1 z-20">
                                        <span className="bg-slate-700/80 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                            P.Đ
                                        </span>
                                        <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                            T16
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 flex items-start gap-2 md:gap-3 transition-transform duration-300 group-hover:-translate-y-1">
                                    <span className="text-4xl md:text-5xl font-black italic text-[#facc15] leading-none shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                        {index + 1}
                                    </span>
                                    
                                    <div className="flex flex-col min-w-0 mt-1">
                                        <h3 className="text-white font-bold text-sm md:text-base truncate transition-colors group-hover:text-[#facc15]">
                                            {e.name}
                                        </h3>
                                        <p className="text-slate-400 text-[10px] md:text-xs truncate mt-0.5">
                                            {e.name} (Sub)
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1 text-[9px] md:text-[11px] text-slate-500 font-medium">
                                            <span className="text-slate-300 font-semibold">T16</span>
                                            <span>•</span>
                                            <span className="truncate">Tập {e.endEpisode}</span>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button className="top-nav-btn top-nav-btn--next">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}