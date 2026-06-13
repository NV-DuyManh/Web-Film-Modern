import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import './SlideFilmCountry.css';

import { Pagination, Navigation } from 'swiper/modules';

export default function SlideFilmCountry() {
    return (
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
                    slidesPerView={3}
                    spaceBetween={30}
                    pagination={{
                        type: 'fraction',
                    }}
                    navigation={true}
                    modules={[Pagination, Navigation]}
                    className="mySwiper"
                >
                    <SwiperSlide>
                        <div className="movie-card">
                            <div className="movie-image">
                                <img
                                    src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200"
                                    alt="Trung Tâm Chăm Sóc Chấn Thương"
                                />
                                <div className="tags-container">
                                    <span className="tag gray">PĐ. 8</span>
                                    <span className="tag blue">LT. 8</span>
                                </div>
                            </div>
                            <h3>Trung Tâm Chăm Sóc Chấn Thương</h3>
                            <p>The Trauma Code: Heroes On Call</p>
                        </div>
                    </SwiperSlide>

                    <SwiperSlide>
                        <div className="movie-card">
                            <div className="movie-image">
                                <img
                                    src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200"
                                    alt="Nữ Hoàng Nước Mắt"
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
                                <img
                                    src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200"
                                    alt="Chuyên Gia Tuổi Trung Niên"
                                />
                                <div className="tags-container">
                                    <span className="tag gray">PĐ. 6</span>
                                </div>
                            </div>
                            <h3>Chuyên Gia Tuổi Trung Niên</h3>
                            <p>Fifties Professionals</p>
                        </div>
                    </SwiperSlide>

                    <SwiperSlide>
                        <div className="movie-card">
                            <div className="movie-image">
                                <img
                                    src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200"
                                    alt="Moving"
                                />
                                <div className="tags-container">
                                    <span className="tag gray">PĐ. 20</span>
                                </div>
                            </div>
                            <h3>Moving</h3>
                            <p>Korean Drama</p>
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>
        </div>
    );
}