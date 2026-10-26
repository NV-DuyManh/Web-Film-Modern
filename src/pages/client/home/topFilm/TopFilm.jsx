import { getPlanAppearance } from '../../../../utils/planAppearance.js';
import MovieImage from '../../../../components/MovieImage';
import { routeSegment } from '../../../../utils/nameRoutes';
import React, { useContext } from 'react';
import useDailyMovieRanking from '../../../../hooks/useDailyMovieRanking';
import { Swiper, SwiperSlide } from '../../../../components/common/VisibleSwiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft, FaListUl, FaEye } from 'react-icons/fa';
import { getObjectById } from '../../../../services/firebaseResponse';

import { PlanContext } from '../../../../contexts/PlanProvider';
import { Link } from 'react-router-dom';

function TopFilm() {
    const { items: topMovies, status } = useDailyMovieRanking();

    const plans = useContext(PlanContext);

    return (
        <div className='bg-[#111827] w-full text-white py-10 px-6 md:px-10 overflow-hidden'>
            <div className='mb-5'>
                <h2 className='font-bold text-2xl md:text-3xl glow-text-multi'>Top 10 phim hot hôm nay</h2>
                <p className="mt-2 text-xs md:text-sm text-slate-400">Từ lượt bấm, mở và xem phim của mọi người trong ngày.</p>
            </div>

            {topMovies.length === 0 ? (
                <div role="status" className="flex min-h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/3 px-6 text-center text-sm text-slate-400">
                    {status === 'loading' ? 'Đang cập nhật bảng xếp hạng hôm nay…' : status === 'error'
                        ? 'Bảng xếp hạng đang tạm gián đoạn. Vui lòng quay lại sau ít phút.'
                        : 'Hôm nay chưa có lượt tương tác. Những phim được quan tâm sẽ xuất hiện tại đây.'}
                </div>
            ) : <>

            <div className="movie-slider-wrapper relative group/slider">
                <button aria-label="Previous" className="movie-nav-btn movie-nav-btn--prev top-prev-btn" draggable="false">
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
                            <Link to={`/phim/${routeSegment(e)}`}>
                                <div className="group cursor-pointer flex flex-col h-full">

                                    <div
                                        className="relative w-full aspect-2/3 transition duration-300 group-hover:-translate-y-2 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_12px_15px_rgba(250,204,21,0.3)]"
                                    >
                                        <div className={`absolute top-0 left-0 w-full h-[90%] rounded-xl overflow-hidden border-3 border-transparent group-hover:border-[#facc15] transform ${index % 2 === 0 ? 'skew-y-[8deg]' : 'skew-y-[-8deg]'} origin-center z-10 transition-colors duration-300`}>
                                            <MovieImage
                                                movie={e} kind="poster" imageWidth={300} imageHeight={450} imageType="poster"
                                                alt={e.name}
                                                className={`absolute left-0 w-full object-cover scale-[1.08] transform ${index % 2 === 0 ? 'skew-y-[-8deg]' : 'skew-y-[8deg]'} origin-center`}
                                                style={{ height: 'calc(100% * 100 / 90)', top: '0' }}
                                                draggable="false"
                                                loading="lazy" decoding="async" />
                                            <div className={`absolute left-0 w-full bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40 pointer-events-none transform ${index % 2 === 0 ? 'skew-y-[-8deg]' : 'skew-y-[8deg]'} origin-center`} style={{ height: 'calc(100% * 100 / 90)', top: '0' }}></div>
                                            <div className={`absolute left-0 w-full bg-[#facc15]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform ${index % 2 === 0 ? 'skew-y-[-8deg]' : 'skew-y-[8deg]'} origin-center`} style={{ height: 'calc(100% * 100 / 90)', top: '0' }}></div>
                                        </div>


                                        <div className="absolute bottom-0 left-0 w-full h-[20%] rounded-b-xl overflow-hidden border-b-3 border-l-3 border-r-3 border-transparent group-hover:border-[#facc15] z-20 transition-colors duration-300">
                                            <MovieImage
                                                movie={e} kind="poster" imageWidth={300} imageHeight={450} imageType="poster"
                                                alt={e.name}
                                                className="absolute left-0 w-full object-cover scale-[1.08] origin-center"
                                                style={{ height: 'calc(100% * 100 / 20)', top: 'calc(-100% * 80 / 20)' }}
                                                draggable="false"
                                                loading="lazy" decoding="async" />
                                            <div className="absolute left-0 w-full bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40 pointer-events-none" style={{ height: 'calc(100% * 100 / 20)', top: 'calc(-100% * 80 / 20)' }}></div>
                                            <div className="absolute left-0 w-full bg-[#facc15]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ height: 'calc(100% * 100 / 20)', top: 'calc(-100% * 80 / 20)' }}></div>
                                        </div>

                                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex justify-center w-full z-30 transition duration-300">
                                            {e.planID && (() => {
                                                const plan = getObjectById(plans, e.planID);
                                                if (!plan) return null;
                                                const cls = getPlanAppearance(plan).className;
                                                const text = plan.name;


                                                return (
                                                    <div className="group-hover:scale-110 transition-transform duration-300 origin-center">
                                                        <p className={`text-[10px] md:text-[11px] font-black px-3 py-0.5 rounded-full border ${cls} uppercase tracking-widest`}>
                                                            {text}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-30 transition duration-300">
                                            {Number(e.episodeSub) > 0 && (
                                                <div className="w-9 h-5 shrink-0 flex items-center justify-center bg-linear-to-r from-cyan-500 to-blue-500 text-white text-[8px] font-bold rounded shadow-md">
                                                    PĐ.{String(e.episodeSub).trim()}
                                                </div>
                                            )}
                                            {Number(e.episodeVoice) > 0 && (
                                                <div className="w-9 h-5 shrink-0 flex items-center justify-center bg-linear-to-r from-emerald-500 to-teal-500 text-white text-[8px] font-bold rounded shadow-md">
                                                    TM.{String(e.episodeVoice).trim()}
                                                </div>
                                            )}
                                            {Number(e.episodeDub) > 0 && (
                                                <div className="w-9 h-5 shrink-0 flex items-center justify-center bg-linear-to-r from-pink-500 to-rose-500 text-white text-[8px] font-bold rounded shadow-md">
                                                    LT.{String(e.episodeDub).trim()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2 transition-transform duration-300 group-hover:-translate-y-1">
                                        <div className="flex items-start gap-2 md:gap-3">
                                            <p className={`text-3xl md:text-4xl font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${index === 0 ? 'text-red-600' :
                                                index === 1 ? 'text-orange-500' :
                                                    index === 2 ? 'text-yellow-400' :
                                                        'text-pink-500'
                                                }`}>
                                                {index + 1}
                                            </p>

                                            <div className="flex flex-1 flex-col min-w-0 mt-1">
                                                <h3 className="text-white font-bold text-xs md:text-sm truncate transition-colors group-hover:text-[#facc15]">
                                                    {e.name || e.otherName}
                                                </h3>
                                                <p className="text-slate-400 text-[9px] md:text-[11px] truncate mt-0.5 transition-colors group-hover:text-slate-200">
                                                    {e.otherName || e.name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex w-full flex-wrap items-center justify-center gap-2.5 mt-2 text-[9px] md:text-[10px] font-bold">
                                            {Number(e.endEpisode) > 0 && (
                                                <span className="flex items-center gap-1.5 text-white bg-linear-to-r from-emerald-400 to-green-600 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] whitespace-nowrap">
                                                    <FaListUl /> {e.endEpisode} Tập
                                                </span>
                                            )}
                                            <span title={`${e.dailyActivity.click} lượt bấm · ${e.dailyActivity.open} lượt mở · ${e.dailyActivity.watch} lượt xem hôm nay`} className="flex items-center gap-1.5 text-white bg-linear-to-r from-purple-500 to-fuchsia-600 px-2.5 py-0.5 rounded-full shadow-md transition hover:scale-105 hover:shadow-[0_0_15px_rgba(192,38,211,0.6)] whitespace-nowrap">
                                                <FaEye /> {e.dailyActivity.watch} hôm nay
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button aria-label="Next" className="movie-nav-btn movie-nav-btn--next top-next-btn" draggable="false">
                    <FaChevronRight />
                </button>
            </div>
            </>}
        </div>
    );
}

export default TopFilm;
