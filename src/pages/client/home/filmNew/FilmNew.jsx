import React, { useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { getObjectById } from '../../../../services/firebaseReponse';
import { Link } from 'react-router-dom';

export default function FilmNew() {
    const movies = useContext(MovieContext);
    const authors = useContext(AuthorContext);
    const plans = useContext(PlanContext);

    return (
        <div className='bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden'>
            <div className='flex justify-between items-center'>
                <div className='flex items-center gap-3 '>
                    <h1 className='font-bold text-2xl md:text-3xl glow-text-multi'>
                        Phim Điện Ảnh Mới Coóng
                    </h1>
                    <FaChevronRight className='border w-6 h-6 md:w-8 md:h-8 bg-transparent text-white border-white/30 p-1.5 rounded-full    ' />
                </div>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button className="movie-nav-btn movie-nav-btn--prev filmnew-prev-btn" draggable="false">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    navigation={{ nextEl: '.filmnew-next-btn', prevEl: '.filmnew-prev-btn' }}
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
                            <Link to={`/detailFilm/${e.id}`}>
                                <div className="group cursor-pointer flex flex-col">
                                    <div className="relative mb-2 w-full">
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                            <img src={e.bannerUrl} className="w-full h-full object-cover" draggable="false" alt={e.name} />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40"></div>

                                            {e.planID && (() => {
                                                const planObj = getObjectById(plans, e.planID);
                                                if (!planObj) return null;
                                                const planNameLower = (planObj.name || '').toLowerCase();
                                                let badgeClasses = "bg-slate-600/90 border-slate-500 text-white";
                                                let badgeText = planObj.name;

                                                if (badgeText.toLowerCase() === 'prenium') badgeText = 'Premium';

                                                if (planNameLower.includes('vip')) {
                                                    badgeClasses = "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 border-yellow-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.7)]";
                                                } else if (planNameLower.includes('premium') || planNameLower.includes('prenium')) {
                                                    badgeClasses = "bg-gradient-to-r from-fuchsia-600 to-rose-500 border-pink-400 text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]";
                                                } else if (planNameLower.includes('basic')) {
                                                    badgeClasses = "bg-gradient-to-r from-blue-600 to-cyan-500 border-cyan-300 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]";
                                                }

                                                return (
                                                    <div className="absolute top-2 right-2 flex gap-1.5 z-10 group-hover:scale-105 transition-transform duration-300">
                                                        <p className={`text-[9px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${badgeClasses} backdrop-blur-md uppercase tracking-wider`}>
                                                            {badgeText}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 z-20">
                                                {(() => {
                                                    const cName = (e.countriesID || '').toLowerCase();
                                                    let cColor = "from-slate-600 to-slate-800 border-slate-400";

                                                    if (cName.includes('nhật') || cName.includes('japan')) cColor = "from-red-500 to-rose-700 border-red-400";
                                                    else if (cName.includes('trung') || cName.includes('china')) cColor = "from-orange-500 to-red-600 border-orange-400";
                                                    else if (cName.includes('hàn') || cName.includes('korea')) cColor = "from-blue-500 to-indigo-700 border-blue-400";
                                                    else if (cName.includes('hồng') || cName.includes('hong')) cColor = "from-teal-500 to-emerald-700 border-teal-400";
                                                    else if (cName.includes('thái') || cName.includes('thai')) cColor = "from-purple-500 to-violet-700 border-purple-400";
                                                    else if (cName.includes('mỹ') || cName.includes('âu') || cName.includes('us')) cColor = "from-cyan-500 to-blue-700 border-cyan-400";
                                                    else {
                                                        const hashes = ["from-fuchsia-500 to-pink-700 border-fuchsia-400", "from-amber-500 to-orange-700 border-amber-400", "from-lime-500 to-green-700 border-lime-400"];
                                                        cColor = hashes[cName.length % hashes.length];
                                                    }

                                                    return (
                                                        <div className={`px-2.5 py-1 rounded-md text-[9px] md:text-[10px] font-extrabold tracking-wide uppercase border bg-gradient-to-br ${cColor} text-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform`}>
                                                            {e.countriesID}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 px-1 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                                        <h3 className="text-white font-bold text-base md:text-lg truncate w-full transition-colors group-hover:text-[#facc15]">
                                            {e.otherName}
                                        </h3>
                                        <p className="text-slate-400 text-xs md:text-sm truncate w-full mt-0.5">
                                            {e.name}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </SwiperSlide>

                    ))}
                </Swiper>

                <button className="movie-nav-btn movie-nav-btn--next filmnew-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}
