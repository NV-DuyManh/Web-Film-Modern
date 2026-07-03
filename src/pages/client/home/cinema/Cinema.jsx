import React, { useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
import { getObjectById } from '../../../../services/firebaseReponse';

export default function Cinema() {
    const movies = useContext(MovieContext);
    const authors = useContext(AuthorContext);

    return (
        <div className='bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden'>
            <div className='flex justify-between items-center '>
                <div className='flex items-center gap-3'>
                    <h1 className='font-bold text-2xl md:text-3xl '>Mãn Nhãn với Phim Chiếu Rạp</h1>
                    <FaChevronRight className='border w-6 h-6 md:w-8 md:h-8 bg-transparent text-white border-white/30 p-1.5 rounded-full ' />
                </div>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button className="movie-nav-btn movie-nav-btn--prev cinema-prev-btn" draggable="false">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{ nextEl: '.cinema-next-btn', prevEl: '.cinema-prev-btn' }}
                    breakpoints={{
                        0: { slidesPerView: 1, spaceBetween: 10 },
                        500: { slidesPerView: 2, spaceBetween: 12 },
                        768: { slidesPerView: 3, spaceBetween: 15 },
                        1024: { slidesPerView: 4, spaceBetween: 20 },
                    }}
                    className="movie-swiper"
                >
                    {movies?.map((e) => (
                        <SwiperSlide key={e.id}>
                            <div className="group cursor-pointer flex flex-col">
                                <div className="relative mb-2 w-full">
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                        <img src={e.imgUrl} className="w-full h-full object-cover" draggable="false" alt="" />
                                        <div className="absolute bottom-2 right-2 flex gap-1.5 z-20">
                                            <p className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">{e.countriesID}</p>
                                        </div>
                                    </div>

                                    <div className="absolute -bottom-6 left-4 w-16 md:w-20 aspect-2/3 rounded-lg overflow-hidden border-2 border-[#111827] shadow-[0_4px_15px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:-translate-y-4 group-hover:scale-105 group-hover:rotate-[-4deg] group-hover:border-[#22d3ee] group-hover:shadow-[0_8px_20px_rgba(34,211,238,0.5)]">
                                        <img src={e.imgUrl} alt="" className="w-full h-full object-cover" draggable="false" />
                                    </div>
                                </div>

                                <div className="pt-6 px-1 flex flex-col transition-transform duration-300 group-hover:-translate-y-1">
                                    <h3 className="text-white font-bold text-base md:text-lg truncate transition-colors group-hover:text-[#facc15]">{e.name}</h3>
                                    <p className="text-slate-400 text-xs md:text-sm truncate mt-0.5">{getObjectById(authors, e.author)?.name}</p>
                                    <div className="flex items-center gap-2 mt-2 text-[11px] md:text-xs text-slate-500 font-medium">
                                        <p className="font-semibold text-yellow-300">{e.rent} VNĐ</p>
                                        <p>•</p>
                                        <p>{e.endEpisode} Tập</p>
                                        <p>•</p>
                                        <p>{e.duration} Phút</p>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button className="movie-nav-btn movie-nav-btn--next cinema-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}