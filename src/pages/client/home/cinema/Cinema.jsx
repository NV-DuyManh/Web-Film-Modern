import React, { useContext } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft, FaVideo, FaCalendarAlt, FaTicketAlt, FaEye } from 'react-icons/fa';

import { getObjectById } from '../../../../services/firebaseResponse';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { Link } from 'react-router-dom';

function Cinema() {
    const movies = useMovies();
    
    const plans = useContext(PlanContext);

    return (
        <div className='bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden'>
            <div className='flex justify-between items-center '>
                <div className='flex items-center gap-3'>
                    <h1 className='font-bold text-2xl md:text-3xl glow-text-multi'>Mãn Nhãn với Phim Chiếu Rạp</h1>
                    <FaChevronRight className='border w-6 h-6 md:w-8 md:h-8 bg-transparent text-white border-white/30 p-1.5 rounded-full ' />
                </div>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button className="movie-nav-btn movie-nav-btn--prev cinema-prev-btn" draggable="false">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{ nextEl: '.cinema-next-btn', prevEl: '.cinema-prev-btn' }}
                    breakpoints={{
                        0: { slidesPerView: 1, spaceBetween: 10 },
                        500: { slidesPerView: 2, spaceBetween: 12 },
                        768: { slidesPerView: 3, spaceBetween: 15 },
                        1024: { slidesPerView: 4, spaceBetween: 20 },
                    }}
                    className="movie-swiper"
                >
                    {movies?.map((e) => (
                        <SwiperSlide key={e.id}>
                            <Link to={`/phim/${e.slug || e.id}`}>
                                <div className="group cursor-pointer flex flex-col">
                                    <div className="relative mb-2 w-full">
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                            <img src={e.bannerUrl} className="w-full h-full object-cover" draggable="false" alt="" />
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
                                            <div className="absolute bottom-2 right-2 flex gap-1.5 z-20">
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
                                                        <p className={`bg-linear-to-r ${bgCls} ${textCls} border text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap uppercase tracking-wider`}>
                                                            {e.countriesID}
                                                        </p>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="absolute -bottom-6 left-4 w-16 md:w-20 aspect-2/3 rounded-lg overflow-hidden border-2 border-[#111827] shadow-[0_4px_15px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:-translate-y-4 group-hover:scale-105 group-hover:rotate-[-4deg] group-hover:border-[#22d3ee] group-hover:shadow-[0_8px_20px_rgba(34,211,238,0.5)]">
                                            <img src={e.imgUrl} alt="" className="w-full h-full object-cover" draggable="false" />
                                        </div>
                                    </div>

                                    <div className="pt-6 px-1 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                        <h3 className="text-white font-bold text-base md:text-lg truncate w-full transition-colors group-hover:text-[#facc15]">{e.otherName}</h3>
                                        <p className="text-slate-400 text-[10px] md:text-[11px] truncate w-full mt-0.5 mb-1 transition-colors group-hover:text-slate-200">{e.name}</p>
                                        
                                        <div className="flex flex-col items-center gap-1.5 w-full">
                                            
                                            <div className="flex justify-center gap-2">
                                                {e.releaseYear && <p className="flex items-center gap-1.5 px-2.5 py-0.5 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full text-white text-[9px] md:text-[10px] w-max font-bold shadow-md transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.6)]"><FaCalendarAlt /> {e.releaseYear}</p>}
                                                <p className="flex items-center gap-1.5 px-2.5 py-0.5 bg-linear-to-r from-yellow-400 to-amber-600 rounded-full text-white text-[9px] md:text-[10px] font-bold shadow-md transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                                                    <FaTicketAlt /> {e.rent} VNĐ
                                                </p>
                                                <p className="flex items-center gap-1.5 px-2.5 py-0.5 bg-linear-to-r from-purple-500 to-fuchsia-600 rounded-full text-white text-[9px] md:text-[10px] font-bold shadow-md transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(192,38,211,0.6)]">
                                                    <FaEye /> {(Number(e.views) || 0) + 100}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button className="movie-nav-btn movie-nav-btn--next cinema-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}

export default Cinema;
