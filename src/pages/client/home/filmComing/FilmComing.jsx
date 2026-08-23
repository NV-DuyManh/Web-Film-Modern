import React, { useContext, useMemo } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft, FaFire, FaCalendarAlt, FaClock, FaEye } from 'react-icons/fa';

import { getObjectById } from '../../../../services/firebaseResponse';
import { getOptimizedUrl } from '../../../../utils/cloudinary';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { Link } from 'react-router-dom';

function FilmComing() {
    const movies = useMovies();

    const plans = useContext(PlanContext);

    const comingMovies = useMemo(() => {
        if (!movies) return [];
        let filtered = movies.filter(m => m.status === 'Sắp chiếu' || m.status === 'trailer');
        if (filtered.length < 15) {
            const others = movies.filter(m => m.status !== 'Sắp chiếu' && m.status !== 'trailer');
            filtered = [...filtered, ...others].slice(0, 15);
        } else {
            filtered = filtered.slice(0, 15);
        }
        return filtered;
    }, [movies]);

    return (
        <div className='bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden'>
            <div className='flex justify-between items-center'>
                <Link to="/film-coming" className='flex items-center gap-2 sm:gap-3 group'>
                    <h2 className='font-bold text-2xl md:text-3xl glow-text-multi group-hover:text-[#facc15] transition-colors duration-300'>
                        Phim Sắp Tới
                    </h2>
                    <FaChevronRight className='border w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-transparent text-yellow-400 border-yellow-400/50 p-1 sm:p-1.5 rounded-full group-hover:bg-yellow-400 group-hover:text-black transition-colors duration-300' />
                </Link>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button aria-label="Previous" className="movie-nav-btn movie-nav-btn--prev filmcoming-prev-btn" draggable="false">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{ nextEl: '.filmcoming-next-btn', prevEl: '.filmcoming-prev-btn' }}
                    breakpoints={{
                        0: { slidesPerView: 1, spaceBetween: 10 },
                        500: { slidesPerView: 2, spaceBetween: 12 },
                        768: { slidesPerView: 3, spaceBetween: 15 },
                        1024: { slidesPerView: 4, spaceBetween: 20 },
                    }}
                    className="movie-swiper"
                >
                    {comingMovies?.map((e) => (
                        <SwiperSlide key={e.id}>
                            <Link to={`/phim/${e.slug || e.id}`}>
                                <div className="group cursor-pointer flex flex-col">
                                    <div className="relative mb-2 w-full">
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-lg border-3 border-transparent transition duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                            <img src={getOptimizedUrl(e.bannerUrl, 480, 270, 'thumb')} className="w-full h-full object-cover" draggable="false" alt={e.name} width={480} height={270} loading="lazy" decoding="async" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40"></div>

                                            {e.planID && (() => {
                                                const plan = getObjectById(plans, e.planID);
                                                if (!plan) return null;
                                                const level = Number(plan.level) || 0;
                                                let cls = "bg-slate-600 border-slate-500 text-white";
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
                                                        <p className={`text-[9px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${cls} uppercase tracking-wider`}>
                                                            {text}
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            <div className="absolute bottom-2 left-2 flex gap-1.5 z-20">
                                                <p className="flex items-center gap-1.5 bg-linear-to-r from-yellow-400 to-amber-500 text-black text-[10px] md:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.8)] border border-yellow-300 uppercase tracking-widest transition-transform duration-300 group-hover:scale-105">
                                                    <FaFire className="text-red-600 animate-pulse text-xs" /> Sắp chiếu
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 px-1 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                        <h3 className="text-white font-bold text-base md:text-lg truncate w-full transition-colors group-hover:text-[#facc15]">
                                            {e.otherName}
                                        </h3>
                                        <p className="text-slate-400 text-[10px] md:text-[11px] truncate w-full mt-0.5 transition-colors group-hover:text-slate-200">
                                            {e.name}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5 w-full font-bold">
                                            {e.releaseYear && (
                                                <span className="flex items-center gap-1.5 text-white bg-linear-to-r from-blue-500 to-cyan-500 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                    <FaCalendarAlt /> {e.releaseYear}
                                                </span>
                                            )}
                                            {e.duration && (
                                                <span className="flex items-center gap-1.5 text-black bg-linear-to-r from-yellow-300 to-yellow-500 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                    <FaClock /> {e.duration} Phút
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5 text-white bg-linear-to-r from-purple-500 to-fuchsia-600 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(192,38,211,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                <FaEye /> {(Number(e.views) || 0) + 100}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button aria-label="Next" className="movie-nav-btn movie-nav-btn--next filmcoming-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}

export default FilmComing;
