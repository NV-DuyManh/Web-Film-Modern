import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import "./SlideFilmCountry.css";

export default function SlideFilmCountry() {
    return (
        <div >
            <div className="country-section">
                <div className="country-sidebar">
                    <h2>
                        Phim <span className="highlight">Hàn</span><br />
                        Quốc <span className="highlight">mới</span>
                    </h2>

                    <a href="/" className="view-all">Xem toàn bộ <span>&gt;</span></a>
                </div>

                <div className="country-slider">
                    <Swiper
                        modules={[Navigation]}
                        navigation
                        slidesPerView={3}
                        spaceBetween={20}
                    >
                        <SwiperSlide>
                            <div className="movie-card">
                                <div className="movie-image">
                                    <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg"
                                    />
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
                                    <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg"
                                    />
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
                                    <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg"
                                    />
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
                                    <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg"
                                    />
                                    <div className="tags-container">
                                        <span className="tag gray">PĐ. 16</span>
                                    </div>
                                </div>
                                <h3>Nữ Hoàng Nước Mắt</h3>
                                <p>Queen of Tears</p>
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </div>
            </div>
                <div className="country-section">
                <div className="country-sidebar">
                    <h2>
                        Phim <span className="highlight">Hàn</span><br />
                        Quốc <span className="highlight">mới</span>
                    </h2>

                    <a href="/" className="view-all">Xem toàn bộ <span>&gt;</span></a>
                </div>

                <div className="country-slider">
                    <Swiper
                        modules={[Navigation]}
                        navigation
                        slidesPerView={3}
                        spaceBetween={20}
                    >
                        <SwiperSlide>
                            <div className="movie-card">
                                <div className="movie-image">
                                    <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg"
                                    />
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
                                    <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg"
                                    />
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
                                    <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg"
                                    />
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
                                    <img src="https://media-cdn-v2.laodong.vn/storage/newsportal/2026/3/24/1674322/Nu-Hoang-Nuoc-Mat-1A-01.jpg"
                                    />
                                    <div className="tags-container">
                                        <span className="tag gray">PĐ. 16</span>
                                    </div>
                                </div>
                                <h3>Nữ Hoàng Nước Mắt</h3>
                                <p>Queen of Tears</p>
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </div>
            </div>
        </div>

    );
}