import React, { useContext, useState, useMemo, useEffect } from 'react';
import ModalDetail from '../../watch/detailFilm/ModalDetail';
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

import { useNavigate } from 'react-router-dom';

function Anime() {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [mainSwiper, setMainSwiper] = useState(null);
    const movies = useMovies();
    const categoryTypes = useContext(CategoryTypeContext);
    const categories = useContext(CategoryContext);

    const plans = useContext(PlanContext);
    const { isLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loginDialog, setLoginDialog] = useState(false);

    const filteredMovies = useMemo(() => {
        if (!movies) return [];
        let base = movies;
        const animeType = categoryTypes?.find(ct => ct.name.toLowerCase().includes('anime') || ct.name.toLowerCase().includes('hoạt hình'));
        if (animeType) {
            base = base.filter(m => m.categoryTypeID === animeType.id);
        }
        return base;
    }, [movies, categoryTypes]);

    const handleFavorite = async (e, movieId) => {
        e.stopPropagation();
        if (!isLogin) {
            setLoginDialog(true);
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



    if (!movies || movies.length === 0) return (
        <div className='anime-slide bg-white/5 animate-pulse'></div>
    );

    return (
        <div className='anime-container'>
            <div className='flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 sm:mb-6 gap-4'>
                <div className='flex items-center gap-2 sm:gap-3 whitespace-nowrap'>
                    <h2 className='font-bold text-xl sm:text-2xl md:text-3xl glow-text-multi'>
                        Kho Tàng Anime
                    </h2>
                    <FaChevronRight className='border w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-transparent text-yellow-400 border-yellow-400/50 p-1 sm:p-1.5 rounded-full' />
                </div>


            </div>

            <div className='anime-slide-outer' key="anime-swiper">
                <div className='anime-slide-wrapper'>
                    <Swiper
                        onSwiper={setMainSwiper}
                        observer={true}
                        observeParents={true}
                        style={{
                            '--swiper-navigation-color': '#fff',
                            '--swiper-pagination-color': '#fff',
                        }}
                        spaceBetween={0}
                        speed={800}
                        navigation={false}
                        loop={filteredMovies?.length >= 7}
                        {...(filteredMovies?.length >= 7 ? { loopedSlides: filteredMovies.length } : {})}
                        effect={'fade'}
                        fadeEffect={{ crossFade: true }}
                        thumbs={{
                            swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null
                        }}
                        modules={[FreeMode, Navigation, Thumbs, EffectFade]}
                        className="anime-main-swiper"
                    >
                        {filteredMovies?.map((e) => (
                            <SwiperSlide key={e.id}>
                                <img
                                    className="anime-main-img"
                                    src={getOptimizedUrl(e.bannerUrl, 1920, 1080, 'banner')}
                                    alt={e.name}
                                    draggable="false"
                                    width={1920} height={1080} loading="lazy" decoding="async" />

                                <div className="anime-overlay"></div>

                                <div className='anime-info-box'>
                                    <h2 className='text-center lg:text-left text-xl sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]'>
                                        {e.otherName || "Đang cập nhật tên gốc"}
                                    </h2>

                                    <h3 className='mt-1 lg:mt-1.5 text-center lg:text-left text-xs sm:text-sm font-semibold text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]'>
                                        {e.name}
                                    </h3>

                                    <div className='mt-2 sm:mt-3 flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2'>
                                        <button className='rounded-md cursor-pointer border border-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] lg:text-[11px] font-bold text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.25)] transition duration-300 hover:bg-yellow-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(250,204,21,0.7)]'>
                                            {getObjectById(plans, e.planID)?.name}
                                        </button>



                                        <button className='rounded-md border cursor-pointer border-green-400 bg-green-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] lg:text-[11px] font-bold text-green-300 shadow-[0_0_8px_rgba(74,222,128,0.25)] transition duration-300 hover:bg-green-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(74,222,128,0.7)]'>
                                            {e.endEpisode} Tập
                                        </button>

                                        <button className='rounded-md border cursor-pointer border-pink-400 bg-pink-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-xs font-bold text-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.25)] transition duration-300 hover:bg-pink-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(244,114,182,0.7)]'>
                                            {e.duration} Phút
                                        </button>
                                        <button className='rounded-md border cursor-pointer border-purple-400 bg-purple-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-xs font-bold text-purple-300 shadow-[0_0_8px_rgba(192,38,211,0.25)] transition duration-300 hover:bg-purple-400 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(192,38,211,0.7)] flex items-center gap-1'>
                                            <FaEye /> {(Number(e.views) || 0) + 100}
                                        </button>
                                    </div>

                                    <div className='flex mt-1.5 lg:mt-2 flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2'>
                                        {e.listCategory?.map((categoryId) => {
                                            const categoryName = getObjectById(categories, categoryId)?.name;
                                            if (!categoryName) return null;
                                            return (
                                                <div
                                                    key={categoryId}
                                                    className='mt-1 lg:mt-2 w-fit cursor-pointer rounded-md border border-purple-500/60 bg-purple-600/50 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-bold text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-purple-400 hover:bg-purple-500 hover:text-white hover:shadow-[0_0_16px_rgba(168,85,247,0.8)]'
                                                >
                                                    {categoryName}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <p 
                                        className='hidden lg:block mt-2 lg:mt-2 max-w-130 text-left text-xs lg:text-sm leading-5 lg:leading-6 text-gray-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                                        style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'normal'
                                        }}
                                    >
                                        {e.description || "Nội dung phim đang được cập nhật. Cùng đón chờ những tập phim mới nhất trên hệ thống của chúng tôi."}
                                    </p>

                                    <div className='mt-3 sm:mt-4 lg:mt-3 flex items-center justify-center lg:justify-start gap-3 sm:gap-4'>
                                        <button aria-label="Xem phim" onClick={() => navigate(`/xem-phim/${e.slug || e.id}`)} className='group relative flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-linear-to-br from-amber-300 to-yellow-500 text-lg sm:text-xl text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.4)] transition duration-500 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] active:scale-95 cursor-pointer'>
                                            <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-30 bg-amber-400"></div>
                                            <FaPlay className='ml-1 relative z-10 transition-transform duration-500 group-hover:scale-125 group-hover:drop-shadow-md' />
                                        </button>

                                        <div className='flex h-9 sm:h-11 lg:h-12 overflow-hidden rounded-full border border-white/20 bg-slate-900/80 backdrop-blur-xl shadow-lg'>
                                            <button aria-label={(isLogin?.listFavorite || []).includes(e.id) ? "Bỏ yêu thích" : "Yêu thích"} onClick={(event) => handleFavorite(event, e.id)} className={`group flex h-full w-10 sm:w-14 items-center justify-center text-base sm:text-lg transition duration-300 hover:bg-pink-500 hover:text-white active:scale-95 cursor-pointer ${(isLogin?.listFavorite || []).includes(e.id) ? 'bg-pink-600 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]' : 'text-slate-400'}`}>
                                                {(isLogin?.listFavorite || []).includes(e.id) ? (
                                                    <FaHeart className='transition duration-300' />
                                                ) : (
                                                    <FaRegHeart className='transition duration-300 group-hover:scale-110' />
                                                )}
                                            </button>

                                            <div className='h-full w-px bg-white/20'></div>

                                            <button aria-label="Thông tin chi tiết" onClick={() => navigate(`/phim/${e.slug || e.id}`)} className='group flex h-full w-10 sm:w-14 items-center justify-center text-base sm:text-lg text-cyan-400 transition duration-300 hover:bg-cyan-500 hover:text-white active:scale-95 cursor-pointer'>
                                                <FaInfoCircle className='transition duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' />
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
                        observer={true}
                        observeParents={true}
                        speed={800}
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
                        loop={filteredMovies?.length >= 7}
                        {...(filteredMovies?.length >= 7 ? { loopedSlides: filteredMovies.length } : {})}
                        slideToClickedSlide={true}
                        modules={[FreeMode, Navigation, Thumbs]}
                        className="anime-thumb-swiper"
                    >
                        {filteredMovies?.map((e, index) => (
                            <SwiperSlide key={e.id}>
                                <img src={getOptimizedUrl(e.imgUrl, 300, 450, 'poster')} alt={e.name} draggable="false" />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>

            <ModalDetail
                open={loginDialog}
                handleClose={() => setLoginDialog(false)}
                title="Yêu cầu đăng nhập"
                description="Bạn cần đăng nhập để thêm phim vào yêu thích"
            />
        </div>
    );
}

export default Anime;
