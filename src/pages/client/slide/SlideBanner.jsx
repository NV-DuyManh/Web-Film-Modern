import React, { useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

import './SlideBanner.css';

import { FreeMode, Navigation } from 'swiper/modules';

export default function SlideBanner() {
    const [mainSwiper, setMainSwiper] = useState(null);
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const slides = [
        "https://swiperjs.com/demos/images/abstract-1.jpg",
        "https://swiperjs.com/demos/images/abstract-2.jpg",
        "https://swiperjs.com/demos/images/abstract-3.jpg",
        "https://swiperjs.com/demos/images/abstract-4.jpg",
        "https://swiperjs.com/demos/images/abstract-5.jpg",
        "https://swiperjs.com/demos/images/abstract-6.jpg",
        "https://swiperjs.com/demos/images/abstract-7.jpg",
        "https://swiperjs.com/demos/images/abstract-8.jpg",
        "https://swiperjs.com/demos/images/abstract-9.jpg",
        "https://swiperjs.com/demos/images/abstract-10.jpg",
    ];

    const loopSlides = useMemo(() => {
        return [...slides, ...slides, ...slides];
    }, []);

    const getRealIndex = (index) => {
        return ((index % slides.length) + slides.length) % slides.length;
    };

    const resetToMiddleIfNeeded = (swiper) => {
        if (!swiper || swiper.destroyed) return;

        const length = slides.length;
        const currentIndex = swiper.activeIndex;

        if (currentIndex < length) {
            swiper.slideTo(currentIndex + length, 0, false);
        }

        if (currentIndex >= length * 2) {
            swiper.slideTo(currentIndex - length, 0, false);
        }
    };

    const getNearestLoopIndex = (realIndex, swiper) => {
        if (!swiper || swiper.destroyed) return realIndex + slides.length;

        const length = slides.length;
        const currentIndex = swiper.activeIndex;

        const positions = [
            realIndex,
            realIndex + length,
            realIndex + length * 2
        ];

        return positions.reduce((nearest, item) => {
            return Math.abs(item - currentIndex) < Math.abs(nearest - currentIndex)
                ? item
                : nearest;
        }, positions[0]);
    };

    const handleMainSlideChange = (swiper) => {
        const realIndex = getRealIndex(swiper.activeIndex);
        setActiveIndex(realIndex);

        if (thumbsSwiper && !thumbsSwiper.destroyed) {
            const thumbIndex = getNearestLoopIndex(realIndex, thumbsSwiper);
            thumbsSwiper.slideTo(thumbIndex, 450);
        }
    };

    const handleMainTransitionEnd = (swiper) => {
        resetToMiddleIfNeeded(swiper);
    };

    const handleThumbTransitionEnd = (swiper) => {
        resetToMiddleIfNeeded(swiper);
    };

    const handleThumbClick = (realIndex) => {
        setActiveIndex(realIndex);

        if (mainSwiper && !mainSwiper.destroyed) {
            const mainIndex = getNearestLoopIndex(realIndex, mainSwiper);
            mainSwiper.slideTo(mainIndex, 550);
        }

        if (thumbsSwiper && !thumbsSwiper.destroyed) {
            const thumbIndex = getNearestLoopIndex(realIndex, thumbsSwiper);
            thumbsSwiper.slideTo(thumbIndex, 500);
        }
    };

    return (
        <div className='slide-banner relative'>
            <Swiper
                onSwiper={setMainSwiper}
                onSlideChange={handleMainSlideChange}
                onTransitionEnd={handleMainTransitionEnd}
                initialSlide={slides.length}
                style={{
                    '--swiper-navigation-color': '#fff',
                    '--swiper-pagination-color': '#fff',
                }}
                spaceBetween={10}
                navigation={false}
                speed={650}
                modules={[FreeMode, Navigation]}
                className="mySwiper2"
            >
                {loopSlides.map((item, index) => {
                    const realIndex = getRealIndex(index);

                    return (
                        <SwiperSlide key={index}>
                            <img className="banner-img" src={item} alt="" />

                            {realIndex === 0 && (
                                <div className='banner-info absolute left-10 top-1/2 -translate-y-1/2 bg-amber-300'>
                                    <h1 className='text-left'>Địa Ngục Độc Thân</h1>
                                    <h2 className='text-left'>Single in</h2>

                                    <div className='flex gap-2'>
                                        <button className='border py-1 px-2 rounded-md'> ferfer</button>
                                        <button className='border py-1 px-2 rounded-md'> ferfer</button>
                                        <button className='border py-1 px-2 rounded-md'> ferfer</button>
                                        <button className='border py-1 px-2 rounded-md'> ferfer</button>
                                    </div>

                                    <h5 className='bg-gray-400 p-1 w-30 mt-2 '>Hài Hước</h5>

                                    <p className='w-200 text-left text-wrap'>
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque dolorem mollitia sunt blanditiis ea a aliquid optio neque corporis quo.
                                    </p>
                                </div>
                            )}
                        </SwiperSlide>
                    );
                })}
            </Swiper>

            <div className='absolute z-10 w-130 right-10 bottom-10'>
                <Swiper
                    onSwiper={setThumbsSwiper}
                    onTransitionEnd={handleThumbTransitionEnd}
                    initialSlide={slides.length}
                    spaceBetween={10}
                    slidesPerView={6}
                    centeredSlides={true}
                    freeMode={false}
                    watchSlidesProgress={true}
                    grabCursor={true}
                    allowTouchMove={true}
                    speed={500}
                    modules={[FreeMode, Navigation]}
                    className="mySwiper thumb-swiper"
                >
                    {loopSlides.map((item, index) => {
                        const realIndex = getRealIndex(index);

                        return (
                            <SwiperSlide
                                key={index}
                                className={activeIndex === realIndex ? "thumb-active" : ""}
                                onClick={() => handleThumbClick(realIndex)}
                            >
                                <img src={item} alt="" />
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>
        </div>
    );
}