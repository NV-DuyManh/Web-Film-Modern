import React, { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import "./SlideFilmCountry.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function SlideFilmCountry() {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const swiperRef = useRef(null);
    useEffect(() => {
        if (swiperRef.current && swiperRef.current.params) {
            swiperRef.current.params.navigation.prevEl = prevRef.current;
            swiperRef.current.params.navigation.nextEl = nextRef.current;
            swiperRef.current.navigation.init();
            swiperRef.current.navigation.update();
        }
    }, []);
    return (
        <div className="country-section md:flex">
            <div className="country-sidebar flex md:flex-col max-md:justify-between max-md:w-full">
                <h2>
                    Phim <span className="highlight">Hàn</span><br />
                    Quốc <span className="highlight">mới</span>
                </h2>

                <div className="view-all">Xem toàn bộ <span>&gt;</span></div>
            </div>

            <div className="country-slider relative">
                <button
                    ref={prevRef}
                    className="absolute left-0 top-29.5 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
                >
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    onSwiper={(swiper) => (swiperRef.current = swiper)}
                    breakpoints={{
                        0: {
                            slidesPerView: 1,
                            spaceBetween: 10,
                        },
                        768: {
                            slidesPerView: 2,
                            spaceBetween: 15,
                        },
                        1024: {
                            slidesPerView: 3,
                            spaceBetween: 20,
                        },
                    }}
                >
                         <SwiperSlide>
                        <div className="movie-card">
                            <div className="movie-image">
                                <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg" />
                                <div className="tags-container">
                                    <span className="tag gray">PĐ. 16</span>
                                </div>
                            </div>
                            <h3>Nữ Hoàng Nước Mắt</h3>
                            <p>Queen of Tears</p>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className="movie-card">
                            <div className="movie-image">
                                <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg" />
                                <div className="tags-container">
                                    <span className="tag gray">PĐ. 16</span>
                                </div>
                            </div>
                            <h3>Nữ Hoàng Nước Mắt</h3>
                            <p>Queen of Tears</p>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className="movie-card">
                            <div className="movie-image">
                                <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg" />
                                <div className="tags-container">
                                    <span className="tag gray">PĐ. 16</span>
                                </div>
                            </div>
                            <h3>Nữ Hoàng Nước Mắt</h3>
                            <p>Queen of Tears</p>
                        </div>
                    </SwiperSlide>

                    <SwiperSlide>
                        <div className="movie-card">
                            <div className="movie-image">
                                <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg" />
                                <div className="tags-container">
                                    <span className="tag gray">PĐ. 16</span>
                                </div>
                            </div>
                            <h3>Nữ Hoàng Nước Mắt</h3>
                            <p>Queen of Tears</p>
                        </div>
                    </SwiperSlide>

                    <SwiperSlide>
                        <div className="movie-card">
                            <div className="movie-image">
                                <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg" />
                                <div className="tags-container">
                                    <span className="tag gray">PĐ. 16</span>
                                </div>
                            </div>
                            <h3>Nữ Hoàng Nước Mắt</h3>
                            <p>Queen of Tears</p>
                        </div>
                    </SwiperSlide>


                    {/* Các SwiperSlide khác */}
                </Swiper>

                <button
                    ref={nextRef}
                    className="absolute right-0 top-29.5 z-10 translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}