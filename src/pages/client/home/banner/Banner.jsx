import React, { useContext, useState } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';
import { FaPlay, FaHeart, FaRegHeart, FaInfoCircle, FaChevronRight } from 'react-icons/fa';
import './Banner.css';

import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { CategoryContext } from '../../../../contexts/CategoryProvider';

import { PlanContext } from '../../../../contexts/PlanProvider';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { updateDocument } from '../../../../services/firebaseService';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

function Banner() {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [mainSwiper, setMainSwiper] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const movies = useMovies();
    const hotMovies = movies?.filter(m => m.isHot) || [];
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

    if (!hotMovies || hotMovies.length === 0) return null;

    return (
        <div className='slide-banner'>
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
                loop={hotMovies.length >= 7}
                loopedSlides={hotMovies.length || 10}
                effect={'fade'}
                fadeEffect={{ crossFade: true }}
                thumbs={{
                    swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null
                }}
                modules={[FreeMode, Navigation, Thumbs, EffectFade]}
                className="mySwiper2"
            >
                {hotMovies.map((e) => (
                    <SwiperSlide key={e.id}>
                        <img
                            className="banner-img"
                            src={e.bannerUrl}
                            alt={e.name}
                            draggable="false"
                        />

                        <div className="banner-overlay"></div>

                        <div className='banner-info-box'>
                            <h1 className='text-center lg:text-left text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]'>
                                {e.otherName}
                            </h1>

                            <h2 className='mt-1.5 lg:mt-2 text-center lg:text-left text-sm sm:text-base font-semibold text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]'>
                                {e.name}
                            </h2>

                            <div className='mt-3 sm:mt-4 flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2'>
                                <button className='rounded-md cursor-pointer border border-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-[12px] font-bold text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.25)] transition-all duration-300 hover:bg-yellow-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(250,204,21,0.7)]'>
                                    {getObjectById(plans, e.planID)?.name}
                                </button>

                                

                                <button className='rounded-md cursor-pointer border border-green-400 bg-green-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-[12px] font-bold text-green-300 shadow-[0_0_8px_rgba(74,222,128,0.25)] transition-all duration-300 hover:bg-green-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(74,222,128,0.7)]'>
                                    {e.endEpisode} Tập
                                </button>

                                <button className='rounded-md cursor-pointer border border-pink-400 bg-pink-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-[12px] font-bold text-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.25)] transition-all duration-300 hover:bg-pink-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(244,114,182,0.7)]'>
                                    {e.duration} Phút
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

                            <p className='hidden lg:block mt-3 lg:mt-4 max-w-130 text-left text-sm leading-6 text-gray-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-3'>
                                {e.description || "Nội dung phim đang được cập nhật. Cùng đón chờ những tập phim mới nhất trên hệ thống của chúng tôi."}
                            </p>

                            <div className='mt-4 lg:mb-20 sm:mt-6 lg:-translate-y-2 flex items-center justify-center lg:justify-start gap-3 sm:gap-4'>
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

            <div className='thumb-wrapper'>
                <Swiper
                    onSwiper={setThumbsSwiper}
                    breakpoints={{
                        0: { slidesPerView: 7, spaceBetween: 6 },
                        480: { slidesPerView: 7, spaceBetween: 8 },
                        768: { slidesPerView: 7, spaceBetween: 10 },
                        1024: { slidesPerView: 6, spaceBetween: 14 },
                        1280: { slidesPerView: 6, spaceBetween: 16 }
                    }}
                    freeMode={true}
                    watchSlidesProgress={true}
                    grabCursor={true}
                    allowTouchMove={true}
                    loop={hotMovies.length >= 7}
                    loopedSlides={hotMovies.length || 10}
                    slideToClickedSlide={true}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="thumb-swiper"
                >
                    {hotMovies.map((e, index) => (
                        <SwiperSlide
                            key={e.id}
                            onClick={() => {
                                if (mainSwiper && !mainSwiper.destroyed) {
                                    mainSwiper.slideToLoop(index);
                                }
                            }}
                        >
                            <img src={e.bannerUrl} alt={e.name} draggable="false" />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}

export default Banner;
