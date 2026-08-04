import React, { useContext, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FaChevronLeft, FaChevronRight, FaClock, FaCalendarAlt } from "react-icons/fa";
import { MovieContext } from "../../../../contexts/MovieProvider";
import { getObjectById } from "../../../../services/firebaseResponse";

import { PlanContext } from "../../../../contexts/PlanProvider";
import { Link } from 'react-router-dom';

function FilmCountry({ title, countryName, titleClass }) {
    const movies = useContext(MovieContext);
    
    const plans = useContext(PlanContext);

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
                            1024: { slidesPerView: 3, spaceBetween: 15 },
                            1280: { slidesPerView: 4, spaceBetween: 20 },
                        }}
                        className="movie-swiper"
                    >
                        {filteredMovies.map((e) => (
                            <SwiperSlide key={e.id}>
                                <Link to={`/detailFilm/${e.id}`}>
                                    <div className="group cursor-pointer flex flex-col h-full">
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                            <img src={e.bannerUrl} alt="" draggable="false" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40"></div>

                                            {e.planID && (() => {
                                                const plan = getObjectById(plans, e.planID);
                                                if (!plan) return null;
                                                const level = Number(plan.level) || 0;
                                                let cls = "bg-slate-600/90 border-slate-500 text-white";
                                                let text = plan.name;


                                                if (level >= 3) {
                                                    cls = "bg-linear-to-r from-fuchsia-600 via-pink-400 to-rose-500 border-pink-300 text-white shadow-[0_0_15px_rgba(236,72,153,0.8)] premium-laser";
                                                } else if (level === 2) {
                                                    cls = "bg-linear-to-r from-yellow-400 via-amber-500 to-yellow-500 border-yellow-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.7)]";
                                                } else if (level === 1) {
                                                    cls = "bg-linear-to-r from-blue-600 to-cyan-500 border-cyan-300 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]";
                                                }

                                                return (
                                                    <div className="absolute top-2 right-2 flex gap-1.5 z-10 group-hover:scale-105 transition-transform duration-300">
                                                        <p className={`text-[9px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${cls} backdrop-blur-md uppercase tracking-wider`}>
                                                            {text}
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 z-20">
                                                {(() => {
                                                    const cId = (e.countriesID || '').toLowerCase();
                                                    let bgCls = "from-indigo-500 to-purple-600 border-indigo-400 shadow-[0_2px_4px_rgba(99,102,241,0.4)]";
                                                    if (cId.includes('korea') || cId.includes('hàn')) {
                                                        bgCls = "from-cyan-500 to-blue-600 border-cyan-400 shadow-[0_2px_4px_rgba(6,182,212,0.4)]";
                                                    } else if (cId.includes('china') || cId.includes('trung')) {
                                                        bgCls = "from-red-500 to-rose-600 border-red-400 shadow-[0_2px_4px_rgba(239,68,68,0.4)]";
                                                    } else if (cId.includes('japan') || cId.includes('nhật')) {
                                                        bgCls = "from-pink-500 to-rose-500 border-pink-400 shadow-[0_2px_4px_rgba(236,72,153,0.4)]";
                                                    } else if (cId.includes('thai') || cId.includes('thái')) {
                                                        bgCls = "from-emerald-500 to-teal-600 border-emerald-400 shadow-[0_2px_4px_rgba(16,185,129,0.4)]";
                                                    } else if (cId.includes('vietnam') || cId.includes('việt')) {
                                                        bgCls = "from-yellow-400 to-orange-500 border-yellow-300 text-black shadow-[0_2px_4px_rgba(250,204,21,0.4)]";
                                                    } else if (cId.includes('us') || cId.includes('mỹ') || cId.includes('u.s') || cId.includes('america')) {
                                                        bgCls = "from-blue-600 to-indigo-700 border-blue-400 shadow-[0_2px_4px_rgba(37,99,235,0.4)]";
                                                    }

                                                    const textCls = cId.includes('vietnam') || cId.includes('việt') ? 'text-black' : 'text-white';

                                                    return (
                                                        <p className={`bg-linear-to-r ${bgCls} ${textCls} border text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider`}>
                                                            {e.countriesID}
                                                        </p>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <div className="pt-3 px-1 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                            <h3 className="m-0 text-base font-bold text-white truncate w-full transition-colors group-hover:text-[#facc15]">{e.otherName}</h3>
                                            <p className="m-0 mt-1 text-[#8c909e] text-[10px] md:text-[11px] truncate w-full transition-colors group-hover:text-slate-300">{e.name}</p>
                                            {(e.duration || e.releaseYear) && (
                                                <div className="flex items-center justify-center gap-2 mt-1.5 w-full font-bold">
                                                    {e.releaseYear && (
                                                        <span className="flex items-center gap-1.5 text-white bg-linear-to-r from-blue-500 to-cyan-500 px-2.5 py-0.5 rounded-full shadow-md transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                            <FaCalendarAlt /> {e.releaseYear}
                                                        </span>
                                                    )}
                                                    {e.duration && (
                                                        <span className="flex items-center gap-1.5 text-black bg-linear-to-r from-yellow-300 to-yellow-500 px-2.5 py-0.5 rounded-full shadow-md transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                            <FaClock /> {e.duration} Phút
                                                        </span>
                                                    )}
                                                </div>
                                            )}
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

export default FilmCountry;
