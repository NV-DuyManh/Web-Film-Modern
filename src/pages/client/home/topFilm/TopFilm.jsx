import React, { useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft, FaTicketAlt, FaListUl, FaEye } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { getObjectById } from '../../../../services/firebaseResponse';

import { PlanContext } from '../../../../contexts/PlanProvider';
import { Link } from 'react-router-dom';

function TopFilm() {
    const movies = useContext(MovieContext);
    const topMovies = movies?.slice(0, 10) || [];
    
    const plans = useContext(PlanContext);

    return (
        <div className='bg-[#111827] w-full text-white py-10 px-6 md:px-10 overflow-hidden'>
            <div className='mb-2'>
                <h1 className='font-bold text-2xl md:text-3xl glow-text-multi'>Top 10 phim bộ hôm nay</h1>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button className="movie-nav-btn movie-nav-btn--prev top-prev-btn" draggable="false">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{
                        nextEl: '.top-next-btn',
                        prevEl: '.top-prev-btn',
                    }}
                    breakpoints={{
                        0: {
                            slidesPerView: 2,
                            spaceBetween: 12,
                        },
                        520: {
                            slidesPerView: 3,
                            spaceBetween: 15,
                        },
                        728: {
                            slidesPerView: 4,
                            spaceBetween: 18,
                        },
                        1024: {
                            slidesPerView: 5,
                            spaceBetween: 20,
                        },
                        1280: {
                            slidesPerView: 6,
                            spaceBetween: 24,
                        },
                    }}
                    className="movie-swiper"
                >
                    {topMovies.map((e, index) => (
                        <SwiperSlide key={e.id}>
                            <Link to={`/detailFilm/${e.id}`}>
                                <div className="group cursor-pointer flex flex-col h-full">

                                    <div
                                        className="relative w-full aspect-2/3 transition-all duration-300 group-hover:-translate-y-2 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_12px_15px_rgba(250,204,21,0.3)]"
                                    >
                                        <div className={`absolute top-0 left-0 w-full h-[90%] rounded-xl overflow-hidden border-[3px] border-transparent group-hover:border-[#facc15] transform ${index % 2 === 0 ? 'skew-y-[8deg]' : 'skew-y-[-8deg]'} origin-center z-10 transition-colors duration-300`}>
                                            <img
                                                src={e.imgUrl}
                                                className={`absolute left-0 w-full object-cover transition-transform duration-500 scale-[1.08] group-hover:scale-[1.12] transform ${index % 2 === 0 ? 'skew-y-[-8deg]' : 'skew-y-[8deg]'} origin-center`}
                                                style={{ height: 'calc(100% * 100 / 90)', top: '0' }}
                                                draggable="false"
                                            />
                                            <div className={`absolute left-0 w-full bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40 pointer-events-none transform ${index % 2 === 0 ? 'skew-y-[-8deg]' : 'skew-y-[8deg]'} origin-center`} style={{ height: 'calc(100% * 100 / 90)', top: '0' }}></div>
                                            <div className={`absolute left-0 w-full bg-[#facc15]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform ${index % 2 === 0 ? 'skew-y-[-8deg]' : 'skew-y-[8deg]'} origin-center`} style={{ height: 'calc(100% * 100 / 90)', top: '0' }}></div>
                                        </div>


                                        <div className="absolute bottom-0 left-0 w-full h-[20%] rounded-b-xl overflow-hidden border-b-[3px] border-l-[3px] border-r-[3px] border-transparent group-hover:border-[#facc15] z-20 transition-colors duration-300">
                                            <img
                                                src={e.imgUrl}
                                                className="absolute left-0 w-full object-cover transition-transform duration-500 scale-[1.08] group-hover:scale-[1.12] origin-center"
                                                style={{ height: 'calc(100% * 100 / 20)', top: 'calc(-100% * 80 / 20)' }}
                                                draggable="false"
                                            />
                                            <div className="absolute left-0 w-full bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40 pointer-events-none" style={{ height: 'calc(100% * 100 / 20)', top: 'calc(-100% * 80 / 20)' }}></div>
                                            <div className="absolute left-0 w-full bg-[#facc15]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ height: 'calc(100% * 100 / 20)', top: 'calc(-100% * 80 / 20)' }}></div>
                                        </div>

                                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex justify-center w-full z-30 transition-all duration-300">
                                            {e.planID && (() => {
                                                const plan = getObjectById(plans, e.planID);
                                                if (!plan) return null;
                                                const level = Number(plan.level) || 0;
                                                let cls = "bg-slate-500/30 border-slate-400/50 text-white shadow-sm";
                                                let text = plan.name;


                                                if (level >= 3) {
                                                    cls = "bg-linear-to-r from-pink-500/50 via-fuchsia-300/70 to-pink-500/50 border-pink-300 text-white shadow-[0_0_15px_rgba(236,72,153,0.8)] premium-laser";
                                                } else if (level === 2) {
                                                    cls = "bg-yellow-500/30 border-yellow-400/50 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.4)]";
                                                } else if (level === 1) {
                                                    cls = "bg-cyan-500/30 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]";
                                                }

                                                return (
                                                    <div className="group-hover:scale-110 transition-transform duration-300 origin-center">
                                                        <p className={`text-[10px] md:text-[11px] font-black px-3 py-0.5 rounded-full border ${cls} backdrop-blur-md uppercase tracking-widest`}>
                                                            {text}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-30 transition-all duration-300">
                                            {e.episodeSub && (
                                                <div className="w-9 h-5 shrink-0 flex items-center justify-center bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[8px] font-bold rounded backdrop-blur-md shadow-sm">
                                                    PĐ.{String(e.episodeSub).trim()}
                                                </div>
                                            )}
                                            {e.episodeVoice && (
                                                <div className="w-9 h-5 shrink-0 flex items-center justify-center bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[8px] font-bold rounded backdrop-blur-md shadow-sm">
                                                    TM.{String(e.episodeVoice).trim()}
                                                </div>
                                            )}
                                            {e.episodeDub && (
                                                <div className="w-9 h-5 shrink-0 flex items-center justify-center bg-pink-500/20 border border-pink-400/50 text-pink-300 text-[8px] font-bold rounded backdrop-blur-md shadow-sm">
                                                    LT.{String(e.episodeDub).trim()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-3 flex items-start gap-2 md:gap-3 transition-transform duration-300 group-hover:-translate-y-1">
                                        <p className={`text-3xl md:text-4xl font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${index === 0 ? 'text-red-600' :
                                            index === 1 ? 'text-orange-500' :
                                                index === 2 ? 'text-yellow-400' :
                                                    'text-pink-500'
                                            }`}>
                                            {index + 1}
                                        </p>

                                        <div className="flex flex-col min-w-0 mt-1">
                                            <h3 className="text-white font-bold text-xs md:text-sm truncate transition-colors group-hover:text-[#facc15]">
                                                {e.otherName}
                                            </h3>
                                            <p className="text-slate-400 text-[9px] md:text-[11px] truncate mt-0.5 transition-colors group-hover:text-slate-200">
                                                {e.name}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] md:text-[10px] font-bold">
                                                {e.rent != null && (
                                                    <span className="flex items-center gap-1 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)] transition-transform duration-300 group-hover:scale-105">
                                                        <FaTicketAlt /> {e.rent} VNĐ
                                                    </span>
                                                )}
                                                {e.rent != null && e.endEpisode && (
                                                    <span className="text-slate-500">•</span>
                                                )}
                                                {e.endEpisode && (
                                                    <span className="flex items-center gap-1 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] transition-transform duration-300 group-hover:scale-105">
                                                        <FaListUl /> {e.endEpisode} Tập
                                                    </span>
                                                )}
                                                {e.endEpisode && (
                                                    <span className="text-slate-500">•</span>
                                                )}
                                                <span className="flex items-center gap-1 text-purple-400 drop-shadow-[0_0_5px_rgba(192,38,211,0.5)] transition-transform duration-300 group-hover:scale-105">
                                                    <FaEye /> {e.views || 0}
                                                </span>
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button className="movie-nav-btn movie-nav-btn--next top-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}

export default TopFilm;
