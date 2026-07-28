import React, { useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
import { getObjectById } from '../../../../services/firebaseReponse';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { Link } from 'react-router-dom';

export default function FilmComing() {
    const movies = useContext(MovieContext);
    const authors = useContext(AuthorContext);
    const plans = useContext(PlanContext);

    return (
        <div className='bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden'>
            <div className='flex justify-between items-center'>
                <div className='flex items-center gap-3'>
                    <h1 className='font-bold text-2xl md:text-3xl glow-text-multi'>
                        Phim Sắp Tới
                    </h1>
                    <FaChevronRight className='border w-6 h-6 md:w-8 md:h-8 bg-transparent text-white border-white/30 p-1.5 rounded-full ' />
                </div>
            </div>

            <div className="movie-slider-wrapper relative group/slider">
                <button className="movie-nav-btn movie-nav-btn--prev filmcoming-prev-btn" draggable="false">
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
                    {movies?.map((e) => (
                        <SwiperSlide key={e.id}>
                            <Link to={`/detailFilm/${e.id}`}>
                                <div className="group cursor-pointer flex flex-col">
                                    <div className="relative mb-2 w-full">
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-800 shadow-lg border-[3px] border-transparent transition-all duration-300 group-hover:border-[#facc15] group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)]">
                                            <img src={e.bannerUrl} className="w-full h-full object-cover" draggable="false" alt={e.name} />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-40"></div>

                                            {e.planID && (() => {
                                                const plan = getObjectById(plans, e.planID);
                                                if (!plan) return null;
                                                const name = (plan.name || '').toLowerCase();
                                                let cls = "bg-slate-600/90 border-slate-500 text-white";
                                                let text = plan.name;

                                                if (text.toLowerCase() === 'prenium') text = 'Premium';

                                                if (name.includes('vip')) {
                                                    cls = "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 border-yellow-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.7)]";
                                                } else if (name.includes('premium') || name.includes('prenium')) {
                                                    cls = "bg-gradient-to-r from-fuchsia-600 to-rose-500 border-pink-400 text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]";
                                                } else if (name.includes('basic')) {
                                                    cls = "bg-gradient-to-r from-blue-600 to-cyan-500 border-cyan-300 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]";
                                                }

                                                return (
                                                    <div className="absolute top-2 right-2 flex gap-1.5 z-10 group-hover:scale-105 transition-transform duration-300">
                                                        <p className={`text-[9px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${cls} backdrop-blur-md uppercase tracking-wider`}>
                                                            {text}
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            <div className="absolute bottom-2 left-2 flex gap-1.5 z-20">
                                                <p className="bg-yellow-300 text-black text-[12px] md:text-[15px] font-extrabold px-2 py-0.5 rounded-sm drop-shadow-md">
                                                    Sắp chiếu
                                                </p>
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

                <button className="movie-nav-btn movie-nav-btn--next filmcoming-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}
