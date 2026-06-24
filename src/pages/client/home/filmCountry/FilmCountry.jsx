import React, { useContext, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MovieContext } from "../../../../contexts/MovieProvider";
import { getObjectById } from "../../../../services/firebaseReponse";
import { AuthorContext } from "../../../../contexts/AuthorProvider";

export default function FilmCountry() {
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
        <div className="country-section w-full md:flex gap-10 py-5 px-6 md:px-10 bg-[#111827] overflow-hidden font-sans">
            <div className="country-sidebar justify-center items-center md:items-start md:justify-start mt-4 shrink-0 flex flex-col max-md:justify-between max-md:w-full">
                <h2 className="m-0  md:mb-5 text-3xl font-bold text-white leading-snug">
                    Phim <span className="text-[#f482c3]">Nhật</span><br className="hidden md:block" /> Bản <span className="text-[#f482c3]">mới</span>
                </h2>
                <div className="inline-flex items-center gap-2 text-white text-sm cursor-pointer">Xem toàn bộ <span>&gt;</span></div>
            </div>

            <div className="country-slider flex-1 min-w-0">
                <div className="movie-slider-wrapper relative group/slider">
                    <button ref={prevRef} className="movie-nav-btn movie-nav-btn--prev" draggable="false">
                        <FaChevronLeft />
                    </button>

                    <Swiper
                        modules={[Navigation]}
                        onSwiper={(swiper) => (swiperRef.current = swiper)}
                        breakpoints={{
                            0: { slidesPerView: 1, spaceBetween: 10 },
                            768: { slidesPerView: 2, spaceBetween: 15 },
                            1024: { slidesPerView: 3, spaceBetween: 20 }, 
                            1280: { slidesPerView: 4, spaceBetween: 24 }
                        }}
                        className="movie-swiper"
                    >
                        {movies.map((e) => (
                            <SwiperSlide>
                                <div className="group cursor-pointer flex flex-col h-full">
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                        <img src={e.imgUrl} alt="" draggable="false" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 z-20">
                                            <span className="px-2 py-0.5 rounded-md text-xs font-bold border border-[#facc15] text-[#facc15] bg-slate-900/70 backdrop-blur-sm">{e.duration + " Phút"}</span>
                                        </div>
                                    </div>
                                    <div className="pt-3 flex flex-col transition-transform duration-300 group-hover:-translate-y-1">
                                        <h3 className="m-0 text-base font-bold text-white truncate transition-colors group-hover:text-[#facc15]">{e.name}</h3>
                                        <p className="m-0 mt-1 text-[#8c909e] text-sm">{getObjectById(authors, e.author)?.name}</p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <button ref={nextRef} className="movie-nav-btn movie-nav-btn--next" draggable="false">
                        <FaChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
}