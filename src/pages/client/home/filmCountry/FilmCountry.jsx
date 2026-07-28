import React, { useContext, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MovieContext } from "../../../../contexts/MovieProvider";
import { getObjectById } from "../../../../services/firebaseReponse";
import { AuthorContext } from "../../../../contexts/AuthorProvider";
import { Link } from 'react-router-dom';

export default function FilmCountry({ title, countryName, titleClass }) {
    const movies = useContext(MovieContext);
    const authors = useContext(AuthorContext);

    const filteredMovies = countryName
        ? movies.filter(m => m.countriesID?.toLowerCase() === countryName.toLowerCase())
        : movies;

    const safeCountryName = countryName ? countryName.replace(/\s+/g, '') : 'default';
    const prevBtnClass = `filmcountry-${safeCountryName}-prev`;
    const nextBtnClass = `filmcountry-${safeCountryName}-next`;

    if (countryName && filteredMovies.length === 0) return null;

    return (
        <div className="country-section w-full md:flex md:items-center gap-6 lg:gap-8 py-2 px-6 md:px-10 overflow-hidden font-sans">
            <div className="country-sidebar justify-center items-center md:items-start max-md:mt-4 shrink-0 flex flex-col max-md:w-full md:w-40 md:-translate-y-5">
                <h2 className={`m-0 mb-3 md:mb-4 text-xl md:text-2xl font-bold text-center md:text-left leading-snug tracking-wide drop-shadow-md ${titleClass || 'text-white'}`}>
                    {title}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] uppercase tracking-wider font-semibold hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer group">
                    Khám phá <FaChevronRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-1 text-[#facc15]" />
                </div>
            </div>

            <div className="country-slider flex-1 min-w-0">
                <div className="movie-slider-wrapper relative group/slider">
                    <button className={`movie-nav-btn movie-nav-btn--prev ${prevBtnClass}`} draggable="false">
                        <FaChevronLeft />
                    </button>

                    <Swiper
                        modules={[Navigation]}
                        navigation={{ prevEl: `.${prevBtnClass}`, nextEl: `.${nextBtnClass}` }}
                        breakpoints={{
                            0: { slidesPerView: 1, spaceBetween: 10 },
                            500: { slidesPerView: 2, spaceBetween: 12 },
                            768: { slidesPerView: 3, spaceBetween: 15 },
                            1024: { slidesPerView: 4, spaceBetween: 20 },
                        }}
                        className="movie-swiper"
                    >
                        {filteredMovies.map((e) => (
                            <SwiperSlide key={e.id}>
                                <Link to={`/detailFilm/${e.id}`}>
                                    <div className="group cursor-pointer flex flex-col h-full">
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                            <img src={e.bannerUrl} alt="" draggable="false" className="w-full h-full object-cover" />
                                            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 z-20">
                                                <p className="px-2 py-0.5 rounded-md text-xs font-bold border border-[#facc15] text-[#facc15] bg-slate-900/70 backdrop-blur-sm inline">{e.duration + " Phút"}</p>
                                            </div>
                                        </div>
                                        <div className="pt-3 flex flex-col transition-transform duration-300 group-hover:-translate-y-1">
                                            <h3 className="m-0 text-base font-bold text-white truncate transition-colors group-hover:text-[#facc15]">{e.otherName}</h3>
                                            <p className="m-0 mt-1 text-[#8c909e] text-sm">{e.name}</p>
                                        </div>
                                    </div>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <button className={`movie-nav-btn movie-nav-btn--next ${nextBtnClass}`} draggable="false">
                        <FaChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
}
