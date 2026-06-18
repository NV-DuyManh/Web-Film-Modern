import React, { useEffect, useRef, useContext } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './Cinema.css';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';

export default function Cinema() {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const swiperRef = useRef(null);
    const movies = useContext(MovieContext);

    useEffect(() => {
        if (swiperRef.current && swiperRef.current.params) {
            swiperRef.current.params.navigation.prevEl = prevRef.current;
            swiperRef.current.params.navigation.nextEl = nextRef.current;
            swiperRef.current.navigation.init();
            swiperRef.current.navigation.update();
        }
    }, []);

    return (
        <div className='bg-[#111827] w-full text-white py-10 px-6 md:px-10 overflow-hidden'>
            <div className='flex justify-between items-center mb-6'>
                <div className='flex items-center gap-3 cursor-pointer group'>
                    <h1 className='font-bold text-2xl md:text-3xl transition-colors group-hover:text-cyan-400'>
                        Mãn Nhãn với Phim Chiếu Rạp
                    </h1>
                    <FaChevronRight className='border w-6 h-6 md:w-8 md:h-8 bg-transparent text-white border-white/30 p-1.5 rounded-full transition-all group-hover:bg-cyan-400 group-hover:border-cyan-400 group-hover:text-black' />
                </div>
            </div>

            <div className="cinema-slider-wrapper">
                <button ref={prevRef} className="cinema-nav-btn cinema-nav-btn--prev">
                    <FaChevronLeft />
                </button>

                <Swiper
                    modules={[Navigation]}
                    onSwiper={(swiper) => (swiperRef.current = swiper)}
                    breakpoints={{
                        0: { slidesPerView: 1, spaceBetween: 15 },
                        640: { slidesPerView: 2, spaceBetween: 20 },
                        1024: { slidesPerView: 3, spaceBetween: 25 },
                    }}
                    className="cinema-swiper"
                >
                    {movies?.map((e) => (
                        <SwiperSlide key={e.id}>
                            <div className="group cursor-pointer flex flex-col">
                                <div className="relative mb-2 w-full">
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-white/5">
                                        <img 
                                            src={e.imgUrl} 
                                            alt={e.name} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                            draggable="false"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                                        
                                        <div className="absolute bottom-2 right-2 flex gap-1.5 z-20">
                                            <span className="bg-slate-700/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                                P.Đ
                                            </span>
                                            <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                                T16
                                            </span>
                                        </div>
                                    </div>

                                    <div className="absolute -bottom-4 left-4 w-16 md:w-20 aspect-2/3 rounded-lg overflow-hidden border-2 border-[#111827] shadow-[0_4px_15px_rgba(0,0,0,0.8)] z-30 transition-transform duration-300 group-hover:-translate-y-2">
                                        <img 
                                            src={e.imgUrl} 
                                            alt={e.name} 
                                            className="w-full h-full object-cover"
                                            draggable="false"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 px-1 flex flex-col">
                                    <h3 className="text-white font-bold text-base md:text-lg truncate transition-colors group-hover:text-cyan-400">
                                        {e.name}
                                    </h3>
                                    <p className="text-slate-400 text-xs md:text-sm truncate mt-0.5">
                                        {e.name} (Sub)
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-[11px] md:text-xs text-slate-500 font-medium">
                                        <span className="text-slate-300 font-semibold">T16</span>
                                        <span>•</span>
                                        <span>{e.productionYear || "2026"}</span>
                                        <span>•</span>
                                        <span>{e.duration} Phút</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button ref={nextRef} className="cinema-nav-btn cinema-nav-btn--next">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}