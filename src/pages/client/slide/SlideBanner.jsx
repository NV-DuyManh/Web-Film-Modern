import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { FaPlay, FaHeart, FaInfoCircle } from 'react-icons/fa';
import './SlideBanner.css';

import { FreeMode, Navigation, Thumbs } from 'swiper/modules';

export default function SlideBanner() {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);

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
                <SwiperSlide>
                    <img
                        className="banner-img"
                        src="https://www.elleman.vn/app/uploads/2026/01/11/255832/Dai-ca-Hahaha-1.jpeg"
                        alt=""
                        draggable="false"
                    />

                    <div className='banner-info absolute left-10 top-1/2 -translate-y-1/2 max-w-150 text-white'>
                        <h1 className='text-left text-4xl font-black leading-tight tracking-tight text-white'>
                            Đại Ca Ha Ha Ha
                        </h1>

                        <h2 className='mt-3 text-left text-lg font-semibold text-yellow-300'>
                            Boss
                        </h2>

                        <div className='mt-2 flex flex-wrap gap-2'>
                            <button className='rounded-md border border-yellow-300/70 bg-black/35 px-3 py-1.5 text-sm font-bold text-yellow-200 backdrop-blur-md transition-all duration-300 hover:bg-yellow-300 hover:text-black'>
                                ferfer
                            </button>

                            <button className='rounded-md border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-black'>
                                ferfer
                            </button>

                            <button className='rounded-md border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-black'>
                                ferfer
                            </button>

                            <button className='rounded-md border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-black'>
                                ferfer
                            </button>
                        </div>

                        <div className='flex flex-wrap gap-2'>
                            <h5 className='mt-4 w-fit cursor-pointer rounded-md border border-white/15 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-yellow-300/70 hover:bg-yellow-300 hover:text-black hover:shadow-[0_0_16px_rgba(250,204,21,0.35)]'>
                                Hài Hước
                            </h5>

                            <h5 className='mt-4 w-fit cursor-pointer rounded-md border border-white/15 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-yellow-300/70 hover:bg-yellow-300 hover:text-black hover:shadow-[0_0_16px_rgba(250,204,21,0.35)]'>
                                Hài Hước
                            </h5>
                        </div>

                        <p className='mt-5 max-w-130 text-left text-base leading-7 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]'>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque dolorem mollitia sunt blanditiis ea a aliquid optio neque corporis quo.
                        </p>

                        <div className='mt-7 flex items-center gap-5'>
                            <button className='group flex h-15 w-15 items-center justify-center rounded-full bg-[#f6d878] text-2xl text-black shadow-[0_0_24px_rgba(246,216,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#ffe28a] hover:shadow-[0_0_32px_rgba(246,216,120,0.55)] active:scale-95'>
                                <FaPlay className='ml-1 transition-transform duration-300 group-hover:scale-110' />
                            </button>

                            <div className='flex h-13 overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]'>
                                <button className='group flex h-full w-16 items-center justify-center text-xl text-white transition-all duration-300 hover:bg-white/12 active:scale-95'>
                                    <FaHeart className='transition-all duration-300 group-hover:scale-110 group-hover:text-pink-300' />
                                </button>

                                <div className='h-full w-px bg-white/10'></div>

                                <button className='group flex h-full w-16 items-center justify-center text-xl text-white transition-all duration-300 hover:bg-white/12 active:scale-95'>
                                    <FaInfoCircle className='transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-200' />
                                </button>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                <SwiperSlide>
                    <img className="banner-img" src="https://swiperjs.com/demos/images/abstract-2.jpg" alt="" draggable="false" />

                    <div className='banner-info absolute max-w-150 text-white'>
                        <h1 className='text-left text-4xl font-black leading-tight tracking-tight text-white'>
                            Đại Ca Ha Ha Ha
                        </h1>

                        <h2 className='mt-3 text-left text-lg font-semibold text-yellow-300'>
                            Boss
                        </h2>

                        <div className='mt-2 flex flex-wrap gap-2'>
                            <button className='rounded-md border border-yellow-300/70 bg-black/35 px-3 py-1.5 text-sm font-bold text-yellow-200 backdrop-blur-md transition-all duration-300 hover:bg-yellow-300 hover:text-black'>
                                ferfer
                            </button>

                            <button className='rounded-md border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-black'>
                                ferfer
                            </button>

                            <button className='rounded-md border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-black'>
                                ferfer
                            </button>

                            <button className='rounded-md border border-white/35 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-black'>
                                ferfer
                            </button>
                        </div>

                        <div className='flex flex-wrap gap-2'>
                            <h5 className='mt-4 w-fit cursor-pointer rounded-md border border-white/15 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-yellow-300/70 hover:bg-yellow-300 hover:text-black hover:shadow-[0_0_16px_rgba(250,204,21,0.35)]'>
                                Hài Hước
                            </h5>

                            <h5 className='mt-4 w-fit cursor-pointer rounded-md border border-white/15 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-yellow-300/70 hover:bg-yellow-300 hover:text-black hover:shadow-[0_0_16px_rgba(250,204,21,0.35)]'>
                                Hài Hước
                            </h5>
                        </div>

                        <p className='mt-5 max-w-130 text-left text-base leading-7 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]'>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque dolorem mollitia sunt blanditiis ea a aliquid optio neque corporis quo.
                        </p>

                        <div className='mt-7 flex items-center gap-5'>
                            <button className='group flex h-15 w-15 items-center justify-center rounded-full bg-[#f6d878] text-2xl text-black shadow-[0_0_24px_rgba(246,216,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#ffe28a] hover:shadow-[0_0_32px_rgba(246,216,120,0.55)] active:scale-95'>
                                <FaPlay className='ml-1 transition-transform duration-300 group-hover:scale-110' />
                            </button>

                            <div className='flex h-13 overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]'>
                                <button className='group flex h-full w-16 items-center justify-center text-xl text-white transition-all duration-300 hover:bg-white/12 active:scale-95'>
                                    <FaHeart className='transition-all duration-300 group-hover:scale-110 group-hover:text-pink-300' />
                                </button>

                                <div className='h-full w-px bg-white/10'></div>

                                <button className='group flex h-full w-16 items-center justify-center text-xl text-white transition-all duration-300 hover:bg-white/12 active:scale-95'>
                                    <FaInfoCircle className='transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-200' />
                                </button>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                <SwiperSlide>
                    <img className="banner-img" src="https://swiperjs.com/demos/images/abstract-3.jpg" alt="" draggable="false" />
                </SwiperSlide>

                <SwiperSlide>
                    <img className="banner-img" src="https://swiperjs.com/demos/images/abstract-4.jpg" alt="" draggable="false" />
                </SwiperSlide>

                <SwiperSlide>
                    <img className="banner-img" src="https://swiperjs.com/demos/images/abstract-5.jpg" alt="" draggable="false" />
                </SwiperSlide>

                <SwiperSlide>
                    <img className="banner-img" src="https://swiperjs.com/demos/images/abstract-6.jpg" alt="" draggable="false" />
                </SwiperSlide>

                <SwiperSlide>
                    <img className="banner-img" src="https://swiperjs.com/demos/images/abstract-7.jpg" alt="" draggable="false" />
                </SwiperSlide>

                <SwiperSlide>
                    <img className="banner-img" src="https://swiperjs.com/demos/images/abstract-8.jpg" alt="" draggable="false" />
                </SwiperSlide>

                <SwiperSlide>
                    <img className="banner-img" src="https://swiperjs.com/demos/images/abstract-9.jpg" alt="" draggable="false" />
                </SwiperSlide>

                <SwiperSlide>
                    <img className="banner-img" src="https://swiperjs.com/demos/images/abstract-10.jpg" alt="" draggable="false" />
                </SwiperSlide>
            </Swiper>

            <div className='absolute z-10 w-130 right-10 bottom-10'>
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
                    <SwiperSlide>
                        <img src="https://www.elleman.vn/app/uploads/2026/01/11/255832/Dai-ca-Hahaha-1.jpeg" alt="" draggable="false" />
                    </SwiperSlide>

                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-2.jpg" alt="" draggable="false" />
                    </SwiperSlide>

                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-3.jpg" alt="" draggable="false" />
                    </SwiperSlide>

                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-4.jpg" alt="" draggable="false" />
                    </SwiperSlide>

                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-5.jpg" alt="" draggable="false" />
                    </SwiperSlide>

                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-6.jpg" alt="" draggable="false" />
                    </SwiperSlide>

                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-7.jpg" alt="" draggable="false" />
                    </SwiperSlide>

                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-8.jpg" alt="" draggable="false" />
                    </SwiperSlide>

                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-9.jpg" alt="" draggable="false" />
                    </SwiperSlide>

                    <SwiperSlide>
                        <img src="https://swiperjs.com/demos/images/abstract-10.jpg" alt="" draggable="false" />
                    </SwiperSlide>
                </Swiper>
            </div>
        </div>
    );
}