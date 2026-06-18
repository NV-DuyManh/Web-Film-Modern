import React, { useEffect, useRef, useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import "./FilmCountry.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MovieContext } from "../../../../contexts/MovieProvider";
import { getObjectById } from "../../../../services/firebaseReponse";
import { AuthorContext } from "../../../../contexts/AuthorProvider";

export default function SlideFilmCountry() {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const swiperRef = useRef(null);
    const movies = useContext(MovieContext);
    const authors = useContext(AuthorContext);

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
                    Phim <span className="highlight">Nhật</span><br /> Bản <span className="highlight">mới</span>
                </h2>
                <div className="view-all">Xem toàn bộ <span>&gt;</span></div>
            </div>

            <div className="country-slider">
                <div className="slider-wrapper">
                    <button ref={prevRef} className="nav-btn nav-btn--prev">
                        <FaChevronLeft />
                    </button>

                    <Swiper
                        modules={[Navigation]}
                        onSwiper={(swiper) => (swiperRef.current = swiper)}
                        breakpoints={{
                            0: { slidesPerView: 1, spaceBetween: 10 },
                            768: { slidesPerView: 2, spaceBetween: 15 },
                            1024: { slidesPerView: 3, spaceBetween: 20 },
                        }}
                    >
                        {movies.map((e) => (
                            <SwiperSlide key={e.id}>
                                <div className="movie-card">
                                    <div className="movie-image">
                                        <img src={e.imgUrl} alt={e.name} draggable="false" />
                                        <div className="tags-container">
                                            <span className="tag yellow">{e.duration + " Phút"}</span>
                                        </div>
                                    </div>
                                    <h3>{e.name}</h3>
                                    <p>{getObjectById(authors, e.author)?.name}</p>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <button ref={nextRef} className="nav-btn nav-btn--next">
                        <FaChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
}