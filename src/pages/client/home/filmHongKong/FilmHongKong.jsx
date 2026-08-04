import React, { useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft, FaCalendarAlt, FaCheckCircle, FaClock } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { getObjectById } from '../../../../services/firebaseResponse';

import { PlanContext } from '../../../../contexts/PlanProvider';
import { Link } from 'react-router-dom';

function FilmHongKong() {
    const movies = useContext(MovieContext);
    
    const plans = useContext(PlanContext);

    return (
        <div className='bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden'>
            <div className='flex justify-between items-center '>
                <div className='flex items-center gap-3 pt-10 '>
                    <h1 className='font-bold text-2xl md:text-3xl glow-text-multi'>
                        Điện Ảnh Hồng Kông ở Chỗ Này Này
                    </h1>
                    <FaChevronRight className='border w-6 h-6 md:w-8 md:h-8 bg-transparent text-white border-white/30 p-1.5 rounded-full' />
                </div>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button className="movie-nav-btn movie-nav-btn--prev hk-prev-btn" draggable="false">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{
                        nextEl: '.hk-next-btn',
                        prevEl: '.hk-prev-btn',
                    }}
                    breakpoints={{
                        0: { slidesPerView: 2, spaceBetween: 12 },
                        520: { slidesPerView: 3, spaceBetween: 15 },
                        728: { slidesPerView: 4, spaceBetween: 18 },
                        1024: { slidesPerView: 5, spaceBetween: 20 },
                        1280: { slidesPerView: 6, spaceBetween: 24 },
                    }}
                    className="movie-swiper"
                >
                    {movies?.map((e) => (
                        <SwiperSlide key={e.id}>
                            <Link to={`/detailFilm/${e.id}`}>
                                <div className="group cursor-pointer flex flex-col h-full">

                                    <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                        <img
                                            src={e.imgUrl}
                                            alt={e.name}
                                            className="w-full h-full object-cover"
                                            draggable="false"
                                        />
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

                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {(() => {
                                                const cId = (e.countriesID || '').toLowerCase();
                                                let bgCls = "from-indigo-500 to-purple-600";
                                                if (cId.includes('korea') || cId.includes('hàn')) bgCls = "from-cyan-500 to-blue-600";
                                                else if (cId.includes('china') || cId.includes('trung')) bgCls = "from-red-500 to-rose-600";
                                                else if (cId.includes('japan') || cId.includes('nhật')) bgCls = "from-pink-500 to-rose-500";
                                                else if (cId.includes('thai') || cId.includes('thái')) bgCls = "from-emerald-500 to-teal-600";
                                                else if (cId.includes('vietnam') || cId.includes('việt')) bgCls = "from-yellow-400 to-orange-500";
                                                else if (cId.includes('us') || cId.includes('mỹ') || cId.includes('u.s') || cId.includes('america')) bgCls = "from-blue-600 to-indigo-700";

                                                const textCls = cId.includes('vietnam') || cId.includes('việt') ? 'text-black' : 'text-white';

                                                return (
                                                    <p className={`bg-linear-to-r ${bgCls} ${textCls} text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded-l whitespace-nowrap uppercase tracking-wider`}>
                                                        {e.countriesID}
                                                    </p>
                                                );
                                            })()}
                                            <p className="bg-blue-600/90 backdrop-blur-md text-white text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded-r whitespace-nowrap">
                                                LT. {e.endEpisode}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-3 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                        <h3 className="text-white font-bold text-sm md:text-base truncate w-full transition-colors group-hover:text-[#facc15]">
                                            {e.otherName}
                                        </h3>
                                        <p className="text-slate-400 text-[10px] md:text-[11px] truncate w-full mt-0.5 transition-colors group-hover:text-slate-200">
                                            {e.name}
                                        </p>
                                        <div className="flex items-center justify-center gap-2 mt-1.5 w-full font-bold">
                                            {e.releaseYear && (
                                                <div className="flex items-center gap-1.5 text-white bg-linear-to-r from-blue-500 to-cyan-500 px-2.5 py-0.5 rounded-full shadow-md transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                    <FaCalendarAlt /> {e.releaseYear}
                                                </div>
                                            )}
                                            {e.duration && (
                                                <div className="flex items-center gap-1.5 text-black bg-linear-to-r from-yellow-300 to-yellow-500 px-2.5 py-0.5 rounded-full shadow-md transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] text-[9px] md:text-[10px] whitespace-nowrap">
                                                    <FaClock /> {e.duration}p
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button className="movie-nav-btn movie-nav-btn--next hk-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}

export default FilmHongKong;
