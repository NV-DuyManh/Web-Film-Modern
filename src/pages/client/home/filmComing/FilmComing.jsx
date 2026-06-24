import React, { useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
import { getObjectById } from '../../../../services/firebaseReponse';

export default function FilmComing() {
    const movies = useContext(MovieContext);
    const authors = useContext(AuthorContext);

    return (
        <div className='bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden'>
            <div className='flex justify-between items-center'>
                <div className='flex items-center gap-3'>
                    <h1 className='font-bold text-2xl md:text-3xl '>
                        Phim Sắp Tới
                    </h1>
                    <FaChevronRight className='border w-6 h-6 md:w-8 md:h-8 bg-transparent text-white border-white/30 p-1.5 rounded-full ' />
                </div>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button className="movie-nav-btn movie-nav-btn--prev filmcoming-prev-btn top-[40%]! max-md:top-[35%]!" draggable="false">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{ nextEl: '.filmcoming-next-btn', prevEl: '.filmcoming-prev-btn' }}
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
                                        <img src={e.imgUrl} className="w-full h-full object-cover" draggable="false" alt={e.name} />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40"></div>

                                        <div className="absolute bottom-2 left-2 flex gap-1.5 z-20">
                                            <p className="bg-yellow-300 text-black text-[12px] md:text-[15px] font-extrabold px-2 py-0.5 rounded-sm drop-shadow-md">
                                                Sắp chiếu
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 px-1 flex flex-col transition-transform duration-300 group-hover:-translate-y-1">
                                    <h3 className="text-white font-bold text-base md:text-lg truncate transition-colors group-hover:text-[#facc15]">
                                        {e.name}
                                    </h3>
                                    <p className="text-slate-400 text-xs md:text-sm truncate mt-0.5">
                                        {getObjectById(authors, e.author)?.name}
                                    </p>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button className="movie-nav-btn movie-nav-btn--next filmcoming-next-btn top-[40%]! max-md:top-[35%]!" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}