import React, { useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { getObjectById } from '../../../../services/firebaseReponse';
import { AuthorContext } from '../../../../contexts/AuthorProvider';

export default function FilmHongKong() {
    const movies = useContext(MovieContext);
    const authors = useContext(AuthorContext);

    return (
        <div className='bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden'>
            <div className='flex justify-between items-center '>
                <div className='flex items-center gap-3 pt-10 '>
                    <h1 className='font-bold text-2xl md:text-3xl  '>
                        Điện Ảnh Hồng Kông ở Chỗ Này Này
                    </h1>
                    <FaChevronRight className='border w-6 h-6 md:w-8 md:h-8 bg-transparent text-white border-white/30 p-1.5 rounded-full' />
                </div>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button className="movie-nav-btn movie-nav-btn--prev hk-prev-btn" draggable="false">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{
                        nextEl: '.hk-next-btn',
                        prevEl: '.hk-prev-btn',
                    }}
                    breakpoints={{
                        0: { slidesPerView: 2, spaceBetween: 12 },
                        640: { slidesPerView: 3, spaceBetween: 15 },
                        1024: { slidesPerView: 5, spaceBetween: 20 },
                        1280: { slidesPerView: 6, spaceBetween: 20 },
                    }}
                    className="movie-swiper"
                >
                    {movies?.map((e) => (
                        <SwiperSlide key={e.id}>
                            <div className="group cursor-pointer flex flex-col h-full">

                                <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                    <img
                                        src={e.imgUrl}
                                        alt={e.name}
                                        className="w-full h-full object-cover"
                                        draggable="false"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40"></div>

                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                                        <span className="bg-slate-700/80 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-l border-r border-white/20">
                                            {e.countriesID}
                                        </span>
                                        <span className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-r">
                                            LT. {e.endEpisode}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                    <h3 className="text-white font-bold text-sm md:text-base truncate w-full transition-colors group-hover:text-[#facc15]">
                                        {e.name}
                                    </h3>
                                    <p className="text-slate-400 text-[10px] md:text-xs truncate w-full mt-0.5">
                                        {getObjectById(authors, e.author)?.name}
                                    </p>
                                </div>

                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button className="movie-nav-btn movie-nav-btn--next hk-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}
