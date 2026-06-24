import React, { useContext, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';
import { FaPlay, FaHeart, FaInfoCircle, FaChevronRight } from 'react-icons/fa';
import './Anime.css';

import { MovieContext } from '../../../../contexts/MovieProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { getObjectById } from '../../../../services/firebaseReponse';
import { CategoriesContext } from '../../../../contexts/CategoryProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';

export default function Anime() {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const movies = useContext(MovieContext);
    const categoryTypes = useContext(CategoryTypeContext);
    const categories = useContext(CategoriesContext);
    const authors = useContext(AuthorContext);
    const plans = useContext(PlanContext);

    return (
        <div className='anime-container'>
            <div className='flex justify-between items-center mb-4 sm:mb-6'>
                <div className='flex items-center gap-2 sm:gap-3'>
                    <h1 className='font-bold text-xl sm:text-2xl md:text-3xl text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]'>
                        Kho Tàng Anime Mới Nhất
                    </h1>
                    <FaChevronRight className='border w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-transparent text-yellow-400 border-yellow-400/50 p-1 sm:p-1.5 rounded-full' />
                </div>
            </div>

            <div className='anime-slide-wrapper'>
                <Swiper
                    style={{
                        '--swiper-navigation-color': '#fff',
                        '--swiper-pagination-color': '#fff',
                    }}
                    spaceBetween={0}
                    navigation={false}
                    loop={false}
                    effect={'fade'}
                    fadeEffect={{ crossFade: true }}
                    thumbs={{
                        swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null
                    }}
                    modules={[FreeMode, Navigation, Thumbs, EffectFade]}
                    className="anime-main-swiper"
                >
                    {movies?.map((e) => (
                        <SwiperSlide key={e.id}>
                            <img
                                className="anime-main-img"
                                src={e.imgUrl}
                                alt={e.name}
                                draggable="false"
                            />

                            <div className="anime-overlay"></div>

                            <div className='anime-info-box'>
                                <h1 className='text-center lg:text-left text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]'>
                                    {e.name}
                                </h1>

                                <h2 className='mt-1.5 lg:mt-2 text-center lg:text-left text-sm sm:text-base font-semibold text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]'>
                                    {getObjectById(categoryTypes, e.category_Type_Id)?.name || "Series Movie"}
                                </h2>

                                <div className='mt-3  sm:mt-4 flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2'>
                                    <button className='rounded-md cursor-pointer border border-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-[12px] font-bold text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.25)] transition-all duration-300 hover:bg-yellow-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(250,204,21,0.7)]'>
                                        {getObjectById(plans, e.planID)?.name || "Premium"}
                                    </button>

                                    <button className='rounded-md border cursor-pointer border-cyan-400 bg-cyan-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-[12px] font-bold text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.25)] transition-all duration-300 hover:bg-cyan-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(34,211,238,0.7)]'>
                                        {getObjectById(authors, e.author)?.name || "Đang cập nhật"}
                                    </button>

                                    <button className='rounded-md border cursor-pointer border-green-400 bg-green-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-[12px] font-bold text-green-300 shadow-[0_0_8px_rgba(74,222,128,0.25)] transition-all duration-300 hover:bg-green-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(74,222,128,0.7)]'>
                                        {e.endEpisode} Tập
                                    </button>

                                    <button className='rounded-md border cursor-pointer border-pink-400 bg-pink-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-[12px] font-bold text-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.25)] transition-all duration-300 hover:bg-pink-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(244,114,182,0.7)]'>
                                        {e.duration} Phút
                                    </button>
                                </div>

                                <div className='flex mt-1.5 lg:mt-2 flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2'>
                                    {e.list_Category?.map((categoryId) => {
                                        const categoryName = getObjectById(categories, categoryId)?.name;
                                        if (!categoryName) return null;
                                        return (
                                            <h5
                                                key={categoryId}
                                                className='mt-1 lg:mt-2 w-fit cursor-pointer rounded-md border border-purple-500/60 bg-purple-600/50 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-purple-400 hover:bg-purple-500 hover:text-white hover:shadow-[0_0_16px_rgba(168,85,247,0.8)]'
                                            >
                                                {categoryName}
                                            </h5>
                                        );
                                    })}
                                </div>

                                <p className='hidden lg:block mt-3 lg:mt-4 max-w-130 text-left text-sm leading-6 text-gray-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-3'>
                                    {e.description || "Nội dung phim đang được cập nhật. Cùng đón chờ những tập phim mới nhất trên hệ thống của chúng tôi."}
                                </p>

                                <div className='mt-4 sm:mt-6 lg:-translate-y-2 flex items-center justify-center lg:justify-start gap-3 sm:gap-4'>
                                    <button className='group flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-[#f6d878] text-lg sm:text-xl text-black shadow-[0_0_24px_rgba(246,216,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#ffe28a] hover:shadow-[0_0_32px_rgba(246,216,120,0.55)] active:scale-95'>
                                        <FaPlay className='ml-1 transition-transform duration-300 group-hover:scale-110' />
                                    </button>

                                    <div className='flex h-9 sm:h-11 lg:h-12 overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]'>
                                        <button className='group flex h-full w-10 sm:w-14 items-center justify-center text-base sm:text-lg text-white transition-all duration-300 hover:bg-white/12 active:scale-95'>
                                            <FaHeart className='transition-all duration-300 group-hover:scale-110 group-hover:text-pink-300' />
                                        </button>

                                        <div className='h-full w-px bg-white/10'></div>

                                        <button className='group flex h-full w-10 sm:w-14 items-center justify-center text-base sm:text-lg text-white transition-all duration-300 hover:bg-white/12 active:scale-95'>
                                            <FaInfoCircle className='transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-200' />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <div className='anime-thumb-wrapper'>
                    <Swiper
                        onSwiper={setThumbsSwiper}
                        breakpoints={{
                            0: { slidesPerView: 5, spaceBetween: 8 },
                            480: { slidesPerView: 5, spaceBetween: 10 },
                            768: { slidesPerView: 5, spaceBetween: 12 },
                            1024: { slidesPerView: 6, spaceBetween: 12 },
                            1280: { slidesPerView: 6, spaceBetween: 14 }
                        }}
                        freeMode={true}
                        watchSlidesProgress={true}
                        grabCursor={true}
                        allowTouchMove={true}
                        centerInsufficientSlides={true}
                        loop={false}
                        modules={[FreeMode, Navigation, Thumbs]}
                        className="anime-thumb-swiper"
                    >
                        {movies?.map((e) => (
                            <SwiperSlide key={e.id}>
                                <img src={e.imgUrl} alt={e.name} draggable="false" />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </div>
    );
}