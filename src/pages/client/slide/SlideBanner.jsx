import React, { useContext, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { FaPlay, FaHeart, FaInfoCircle } from 'react-icons/fa';
import './SlideBanner.css';

import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { MovieContext } from '../../../contexts/MovieProvider';
import { CategoryTypeContext } from '../../../contexts/CategoryTypeProvider';
import { getObjectById } from '../../../services/firebaseReponse';
import { CategoriesContext } from '../../../contexts/CategoryProvider';
import { AuthorContext } from '../../../contexts/AuthorProvider';
import { PlanContext } from '../../../contexts/PlanProvider';

export default function SlideBanner() {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const movies = useContext(MovieContext);
    const categoryTypes = useContext(CategoryTypeContext);
    const categories = useContext(CategoriesContext);
    const authors = useContext(AuthorContext);
    const plans = useContext(PlanContext);

    return (
        <div className='slide-banner relative'>
            <Swiper
                style={{
                    '--swiper-navigation-color': '#fff',
                    '--swiper-pagination-color': '#fff',
                }}
                spaceBetween={10}
                navigation={false}
                loop={false}
                thumbs={{
                    swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null
                }}
                modules={[FreeMode, Navigation, Thumbs]}
                className="mySwiper2"
            >
                {movies.map((e) => (
                    <SwiperSlide key={e.id}>
                        <img
                            className="banner-img"
                            src={e.imgUrl}
                            alt=""
                            draggable="false"
                        />

                        <div className='banner-info absolute top-1/2 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-10 -translate-y-1/2 w-[90%] md:w-auto max-w-150 text-white bg-linear-to-r from-black/80 via-black/70 md:via-black/60 to-black/20 md:to-transparent rounded-2xl p-5 md:p-6 flex flex-col items-center md:items-start'>

                            <h1 className='text-center md:text-left text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white [text-shadow:0_3px_12px_rgba(0,0,0,0.9),0_6px_20px_rgba(0,0,0,0.8)]'>
                                {e.name}
                            </h1>

                            <h2 className='mt-2 md:mt-3 text-center md:text-left text-base sm:text-lg font-semibold text-yellow-300 [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]'>
                                {getObjectById(categoryTypes, e.category_Type_Id)?.name}
                            </h2>

                            <div className='mt-4 flex flex-wrap justify-center md:justify-start gap-2'>
                                <button className='rounded-md border border-yellow-400 bg-yellow-400/20 px-2.5 py-1 text-[11px] sm:text-[13px] font-bold text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.25)] transition-all duration-300 hover:bg-yellow-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(250,204,21,0.7)]'>
                                    {getObjectById(plans, e.planID)?.name}
                                </button>

                                <button className='rounded-md border border-cyan-400 bg-cyan-400/20 px-2.5 py-1 text-[11px] sm:text-[13px] font-bold text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.25)] transition-all duration-300 hover:bg-cyan-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(34,211,238,0.7)]'>
                                    {getObjectById(authors, e.author)?.name}
                                </button>

                                <button className='rounded-md border border-green-400 bg-green-400/20 px-2.5 py-1 text-[11px] sm:text-[13px] font-bold text-green-300 shadow-[0_0_8px_rgba(74,222,128,0.25)] transition-all duration-300 hover:bg-green-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(74,222,128,0.7)]'>
                                    {e.endEpisode + " Tập"}
                                </button>

                                <button className='rounded-md border border-pink-400 bg-pink-400/20 px-2.5 py-1 text-[11px] sm:text-[13px] font-bold text-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.25)] transition-all duration-300 hover:bg-pink-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(244,114,182,0.7)]'>
                                    {e.duration + " Phút"}
                                </button>
                            </div>

                            <div className='mt-2 flex flex-wrap justify-center md:justify-start gap-2'>
                                {e.list_Category?.map((categoryId) => {
                                    const categoryName = getObjectById(categories, categoryId)?.name;

                                    if (!categoryName) return null;

                                    return (
                                        <h5
                                            key={categoryId}
                                            className='mt-1 sm:mt-2 w-fit cursor-pointer rounded-md border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] sm:text-[12px] font-bold text-gray-300 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-yellow-300/70 hover:bg-yellow-300 hover:text-black hover:shadow-[0_0_16px_rgba(250,204,21,0.35)]'
                                        >
                                            {categoryName}
                                        </h5>
                                    );
                                })}
                            </div>

                            <p className='hidden lg:block mt-5 max-w-130 text-left text-sm lg:text-base leading-6 lg:leading-7 text-gray-200 text-shadow:0_2px_8px_rgba(0,0,0,0.8)'>
                                {e.description}
                            </p>

                            <div className='mt-6 lg:mt-7 flex items-center justify-center md:justify-start gap-4 lg:gap-5'>
                                <button className='group flex h-12 w-12 lg:h-15 lg:w-15 items-center justify-center rounded-full bg-[#f6d878] text-xl lg:text-2xl text-black shadow-[0_0_24px_rgba(246,216,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#ffe28a] hover:shadow-[0_0_32px_rgba(246,216,120,0.55)] active:scale-95'>
                                    <FaPlay className='ml-1 transition-transform duration-300 group-hover:scale-110' />
                                </button>

                                <div className='flex h-11 lg:h-13 overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]'>
                                    <button className='group flex h-full w-14 lg:w-16 items-center justify-center text-lg lg:text-xl text-white transition-all duration-300 hover:bg-white/12 active:scale-95'>
                                        <FaHeart className='transition-all duration-300 group-hover:scale-110 group-hover:text-pink-300' />
                                    </button>

                                    <div className='h-full w-px bg-white/10'></div>

                                    <button className='group flex h-full w-14 lg:w-16 items-center justify-center text-lg lg:text-xl text-white transition-all duration-300 hover:bg-white/12 active:scale-95'>
                                        <FaInfoCircle className='transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-200' />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <div className='absolute z-10 w-[90%] sm:w-110 lg:w-130 bottom-6 md:bottom-10 left-1/2 md:left-auto md:right-8 lg:right-10 -translate-x-1/2 md:translate-x-0'>
                <Swiper
                    onSwiper={setThumbsSwiper}
                    spaceBetween={10}
                    slidesPerView={6}
                    freeMode={true}
                    watchSlidesProgress={true}
                    grabCursor={true}
                    allowTouchMove={true}
                    loop={false}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="mySwiper thumb-swiper"
                >
                    {movies.map((e) => (
                        <SwiperSlide key={e.id}>
                            <img src={e.imgUrl} alt="" draggable="false" />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}