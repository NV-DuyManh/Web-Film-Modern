import React, { useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { Navigation, Thumbs } from 'swiper/modules';

import './SlideFilmCountry.css';

export default function SlideFilmCountry() {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);

    const movies = [
        {
            image: 'https://swiperjs.com/demos/images/abstract-1.jpg',
            title: 'Phim Hàn Quốc',
            subtitle: 'Những bộ phim Hàn Quốc nổi bật nhất',
        },
        {
            image: 'https://swiperjs.com/demos/images/abstract-2.jpg',
            title: 'Phim Trung Quốc',
            subtitle: 'Kho phim cổ trang và hiện đại',
        },
        {
            image: 'https://swiperjs.com/demos/images/abstract-3.jpg',
            title: 'Phim Nhật Bản',
            subtitle: 'Anime và live-action đặc sắc',
        },
        {
            image: 'https://swiperjs.com/demos/images/abstract-4.jpg',
            title: 'Phim Âu Mỹ',
            subtitle: 'Bom tấn Hollywood hấp dẫn',
        },
        {
            image: 'https://swiperjs.com/demos/images/abstract-5.jpg',
            title: 'Phim Thái Lan',
            subtitle: 'Tình cảm và kinh dị nổi tiếng',
        },
    ];

    return (
        <section className="slide-country-section">
            <Swiper
                loop
                navigation
                thumbs={{ swiper: thumbsSwiper }}
                modules={[Navigation, Thumbs]}
                className="country-main-swiper"
            >
                {movies.map((movie, index) => (
                    <SwiperSlide key={index}>
                        <div className="country-banner">
                            <img src={movie.image} alt={movie.title} />

                            <div className="country-overlay" />

                            <div className="country-content">
                                <span className="country-tag">
                                    Quốc gia nổi bật
                                </span>

                                <h2>{movie.title}</h2>

                                <p>{movie.subtitle}</p>

                                <button className="country-button">
                                    Xem tất cả
                                    <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <Swiper
                onSwiper={setThumbsSwiper}
                loop
                slidesPerView={5}
                spaceBetween={20}
                watchSlidesProgress
                modules={[Thumbs]}
                className="country-thumb-swiper"
                breakpoints={{
                    320: {
                        slidesPerView: 2,
                    },
                    640: {
                        slidesPerView: 3,
                    },
                    1024: {
                        slidesPerView: 5,
                    },
                }}
            >
                {movies.map((movie, index) => (
                    <SwiperSlide key={index}>
                        <div className="country-thumb">
                            <img src={movie.image} alt={movie.title} />

                            <div className="country-thumb-overlay">
                                <h4>{movie.title}</h4>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}