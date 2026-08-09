import React, { useContext, useState } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';
import { FaPlay, FaHeart, FaRegHeart, FaInfoCircle, FaChevronRight, FaEye } from 'react-icons/fa';
import './Anime.css';

import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { getOptimizedUrl } from '../../../../utils/cloudinary';
import { CategoryContext } from '../../../../contexts/CategoryProvider';

import { PlanContext } from '../../../../contexts/PlanProvider';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { updateDocument } from '../../../../services/firebaseService';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

function Anime() {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [mainSwiper, setMainSwiper] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const movies = useMovies();
    const categoryTypes = useContext(CategoryTypeContext);
    const categories = useContext(CategoryContext);
    
    const plans = useContext(PlanContext);
    const { isLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleFavorite = async (e, movieId) => {
        e.stopPropagation();
        if (!isLogin) {
            Swal.fire('Vui lòng đăng nhập', 'Bạn cần đăng nhập để thêm phim vào yêu thích', 'warning');
            return;
        }
        try {
            const currentFavorites = isLogin.listFavorite || [];
            let newFavorites;
            if (currentFavorites.includes(movieId)) {
                newFavorites = currentFavorites.filter(id => id !== movieId);
            } else {
                newFavorites = [...currentFavorites, movieId];
            }
            await updateDocument("Users", { id: isLogin.id, listFavorite: newFavorites });
        } catch (error) {
            console.error("Error updating favorites", error);
        }
    };

    return (
        <div className='anime-container'>
            <div className='flex justify-between items-center mb-4 sm:mb-6'>
                <div className='flex items-center gap-2 sm:gap-3'>
                    <h1 className='font-bold text-xl sm:text-2xl md:text-3xl glow-text-multi'>
                        Kho Tàng Anime Mới Nhất
                    </h1>
                    <FaChevronRight className='border w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-transparent text-yellow-400 border-yellow-400/50 p-1 sm:p-1.5 rounded-full' />
                </div>
            </div>

            <div className='anime-slide-outer'>
                <div className='anime-slide-wrapper'>
                    <Swiper
                        onSwiper={setMainSwiper}
                        style={{
                            '--swiper-navigation-color': '#fff',
                            '--swiper-pagination-color': '#fff',
                        }}
                        spaceBetween={0}
                        onSlideChange={(swiper) => {
                            setActiveIndex(swiper.realIndex);
                            if (thumbsSwiper && !thumbsSwiper.destroyed) {
                                thumbsSwiper.slideToLoop(swiper.realIndex);
                            }
                        }}
                        navigation={false}
                        loop={movies?.length >= 7}
                        loopedSlides={movies?.length || 10}
                        effect={'fade'}
                        fadeEffect={{ crossFade: true }}
                        thumbs={{
                            swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null
                        }}
                        modules={[FreeMode, Navigation, Thumbs, EffectFade]}
                        className="anime-main-swiper"
                    >
                        {movies?.map((e) => (
                            <SwiperSlide key={e.id}>
                                <img
                                    className="anime-main-img"
                                    src={getOptimizedUrl(e.bannerUrl, 480, 270, 'thumb')}
                                    alt={e.name}
                                    draggable="false"
                                width={480} height={270} loading="lazy" decoding="async"/>

                                <div className="anime-overlay"></div>

                                <div className='anime-info-box'>
                                    <h1 className='text-center lg:text-left text-xl sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]'>
                                        {e.name}
                                    </h1>

                                    <h2 className='mt-1 lg:mt-1.5 text-center lg:text-left text-xs sm:text-sm font-semibold text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]'>
                                        {getObjectById(categoryTypes, e.categoryTypeID)?.name || "Series Movie"}
                                    </h2>

                                    <div className='mt-2 sm:mt-3 flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2'>
                                        <button className='rounded-md cursor-pointer border border-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] lg:text-[11px] font-bold text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.25)] transition-all duration-300 hover:bg-yellow-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(250,204,21,0.7)]'>
                                            {getObjectById(plans, e.planID)?.name}
                                        </button>

                                        

                                        <button className='rounded-md border cursor-pointer border-green-400 bg-green-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] lg:text-[11px] font-bold text-green-300 shadow-[0_0_8px_rgba(74,222,128,0.25)] transition-all duration-300 hover:bg-green-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(74,222,128,0.7)]'>
                                            {e.endEpisode} Tập
                                        </button>

                                        <button className='rounded-md border cursor-pointer border-pink-400 bg-pink-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-[12px] font-bold text-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.25)] transition-all duration-300 hover:bg-pink-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(244,114,182,0.7)]'>
                                            {e.duration} Phút
                                        </button>
                                        <button className='rounded-md border cursor-pointer border-purple-400 bg-purple-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-[12px] font-bold text-purple-300 shadow-[0_0_8px_rgba(192,38,211,0.25)] transition-all duration-300 hover:bg-purple-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(192,38,211,0.7)] flex items-center gap-1'>
                                            <FaEye /> {(Number(e.views) || 0) + 100}
                                        </button>
                                    </div>

                                    <div className='flex mt-1.5 lg:mt-2 flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2'>
                                        {e.listCategory?.map((categoryId) => {
                                            const categoryName = getObjectById(categories, categoryId)?.name;
                                            if (!categoryName) return null;
                                            return (
                                                <h5
                                                    key={categoryId}
                                                    className='mt-1 lg:mt-2 w-fit cursor-pointer rounded-md border border-purple-500/60 bg-purple-600/50 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-purple-400 hover:bg-purple-500 hover:text-white hover:shadow-[0_0_16px_rgba(168,85,247,0.8)]'
                                                >
                                                    {categoryName}
                                                </h5>
                                            );
                                        })}
                                    </div>

                                    <p className='hidden lg:block mt-2 lg:mt-2 max-w-130 text-left text-xs lg:text-sm leading-5 lg:leading-6 text-gray-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-2'>
                                        {e.description || "Nội dung phim đang được cập nhật. Cùng đón chờ những tập phim mới nhất trên hệ thống của chúng tôi."}
                                    </p>

                                    <div className='mt-3 sm:mt-4 lg:mt-3 flex items-center justify-center lg:justify-start gap-3 sm:gap-4'>
                                        <button onClick={() => navigate(`/xem-phim/${e.slug || e.id}`)} className='group relative flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-linear-to-br from-amber-300 to-yellow-500 text-lg sm:text-xl text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all duration-500 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] active:scale-95 cursor-pointer'>
                                            <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-30 bg-amber-400"></div>
                                            <FaPlay className='ml-1 relative z-10 transition-transform duration-500 group-hover:scale-125 group-hover:drop-shadow-md' />
                                        </button>

                                        <div className='flex h-9 sm:h-11 lg:h-12 overflow-hidden rounded-full border border-white/20 bg-slate-900/80 backdrop-blur-xl shadow-lg'>
                                            <button onClick={(event) => handleFavorite(event, e.id)} className={`group flex h-full w-10 sm:w-14 items-center justify-center text-base sm:text-lg transition-all duration-300 hover:bg-pink-500 hover:text-white active:scale-95 cursor-pointer ${(isLogin?.listFavorite || []).includes(e.id) ? 'bg-pink-600 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]' : 'text-slate-400'}`}>
                                                {(isLogin?.listFavorite || []).includes(e.id) ? (
                                                    <FaHeart className='transition-all duration-300' />
                                                ) : (
                                                    <FaRegHeart className='transition-all duration-300 group-hover:scale-110' />
                                                )}
                                            </button>

                                            <div className='h-full w-px bg-white/20'></div>

                                            <button onClick={() => navigate(`/phim/${e.slug || e.id}`)} className='group flex h-full w-10 sm:w-14 items-center justify-center text-base sm:text-lg text-cyan-400 transition-all duration-300 hover:bg-cyan-500 hover:text-white active:scale-95 cursor-pointer'>
                                                <FaInfoCircle className='transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                <div className='anime-thumb-wrapper'>
                    <Swiper
                        onSwiper={setThumbsSwiper}
                        breakpoints={{
                            0: { slidesPerView: 7, spaceBetween: 6 },
                            480: { slidesPerView: 7, spaceBetween: 8 },
                            768: { slidesPerView: 7, spaceBetween: 10 },
                            1024: { slidesPerView: 10, spaceBetween: 12 },
                            1280: { slidesPerView: 12, spaceBetween: 14 }
                        }}
                        freeMode={true}
                        watchSlidesProgress={true}
                        grabCursor={true}
                        allowTouchMove={true}
                        loop={movies?.length >= 7}
                        loopedSlides={movies?.length || 10}
                        slideToClickedSlide={true}
                        modules={[FreeMode, Navigation, Thumbs]}
                        className="anime-thumb-swiper"
                    >
                        {movies?.map((e, index) => (
                            <SwiperSlide
                                key={e.id}
                                onClick={() => {
                                    if (mainSwiper && !mainSwiper.destroyed) {
                                        mainSwiper.slideToLoop(index);
                                    }
                                }}
                                className={activeIndex === index ? 'custom-thumb-active' : ''}
                            >
                                <img src={getOptimizedUrl(e.imgUrl, 300, 450, 'poster')} alt={e.name} draggable="false" />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </div>
    );
}

export default Anime;
