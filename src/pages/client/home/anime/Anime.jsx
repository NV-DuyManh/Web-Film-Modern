import React, { useContext, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { FaPlay, FaHeart, FaInfoCircle, FaChevronRight } from 'react-icons/fa';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { getObjectById } from '../../../../services/firebaseReponse';
import { CategoriesContext } from '../../../../contexts/CategoryProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';

export default function Anime() {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const movies = useContext(MovieContext);
    const categoryTypes = useContext(CategoryTypeContext);
    const categories = useContext(CategoriesContext);
    const authors = useContext(AuthorContext);
    const plans = useContext(PlanContext);

    return (
        <div className='bg-[#111827] w-full text-white py-5 px-6 md:px-10 overflow-hidden font-sans'>
            <div className='flex justify-between items-center mb-6'>
                <div className='flex items-center gap-3'>
                    <h1 className='font-bold text-2xl md:text-3xl'>
                        Kho Tàng Anime Mới Nhất
                    </h1>
                    <FaChevronRight className='border w-6 h-6 md:w-8 md:h-8 bg-transparent text-white border-white/30 p-1.5 rounded-full' />
                </div>
            </div>

            <div className='relative w-full rounded-2xl overflow-hidden h-125 lg:h-150 border border-white/10 shadow-2xl'>
                <Swiper
                    style={{
                        '--swiper-navigation-color': '#fff',
                        '--swiper-pagination-color': '#fff',
                    }}
                    spaceBetween={0}
                    navigation={false}
                    loop={false}
                    thumbs={{
                        swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null
                    }}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="w-full h-full"
                >
                    {movies?.map((e) => (
                        <SwiperSlide key={e.id} className="relative w-full h-full">
                            <img
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                src={e.imgUrl}
                                alt={e.name}
                                draggable="false"
                            />
                            
                            <div className="absolute inset-y-0 left-0 w-full md:w-[55%] lg:w-[45%] bg-linear-to-r from-[#111827]/85 via-[#111827]/20 to-transparent pointer-events-none"></div>
                            <div className="absolute inset-x-0 bottom-0 h-[25%] bg-linear-to-t from-[#111827]/50 to-transparent pointer-events-none"></div>

                            <div className='absolute z-30 top-10 md:top-20 left-6 md:left-12 flex flex-col items-start max-w-[90%] md:max-w-175'>
                                
                                <h2 className='text-lg md:text-xl font-bold text-[#facc15] drop-shadow-md mb-2'>
                                    {getObjectById(categoryTypes, e.category_Type_Id)?.name || "Series Movie"}
                                </h2>

                                <h1 className='text-3xl md:text-5xl font-black text-white drop-shadow-lg tracking-wide mb-4'>
                                    {e.name}
                                </h1>

                                <div className='flex flex-wrap items-center gap-3 text-[11px] md:text-sm font-bold'>
                                    <span className='border border-yellow-500 text-[#facc15] px-3 py-1 rounded bg-yellow-500/10 backdrop-blur-sm'>
                                        {getObjectById(plans, e.planID)?.name || "Premium"}
                                    </span>
                                    <span className='border border-cyan-400 text-cyan-400 px-3 py-1 rounded bg-cyan-400/10 backdrop-blur-sm'>
                                        {getObjectById(authors, e.author)?.name || "Đang cập nhật"}
                                    </span>
                                    <span className='border border-green-500 text-green-400 px-3 py-1 rounded bg-green-500/10 backdrop-blur-sm'>
                                        {e.endEpisode} Tập
                                    </span>
                                    <span className='border border-pink-500 text-pink-400 px-3 py-1 rounded bg-pink-500/10 backdrop-blur-sm'>
                                        {e.duration} Phút
                                    </span>
                                </div>

                                <div className='mt-4 flex flex-wrap gap-2'>
                                    {e.list_Category?.map((categoryId) => {
                                        const categoryName = getObjectById(categories, categoryId)?.name;
                                        if (!categoryName) return null;
                                        return (
                                            <span key={categoryId} className='bg-black/50 border border-white/20 text-gray-200 px-4 py-1 rounded-md text-[11px] md:text-xs font-semibold backdrop-blur-md transition-colors hover:bg-white/20 cursor-pointer'>
                                                {categoryName}
                                            </span>
                                        );
                                    })}
                                    {(!e.list_Category || e.list_Category.length === 0) && (
                                        <span className='bg-black/50 border border-white/20 text-gray-200 px-4 py-1 rounded-md text-[11px] md:text-xs font-semibold backdrop-blur-md transition-colors hover:bg-white/20 cursor-pointer'>
                                            Hoạt hình
                                        </span>
                                    )}
                                </div>

                                <p className='mt-6 text-sm md:text-base leading-relaxed text-gray-200 line-clamp-3 md:line-clamp-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-150'>
                                    {e.description || "Nội dung phim đang được cập nhật. Cùng đón chờ những tập phim mới nhất trên hệ thống của chúng tôi."}
                                </p>

                                <div className='mt-8 flex items-center gap-4'>
                                    <button className='w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-[#fde047] text-black text-xl md:text-2xl transition-transform duration-300 hover:scale-105 hover:bg-[#fef08a] shadow-[0_0_20px_rgba(253,224,71,0.3)]'>
                                        <FaPlay className='ml-1' />
                                    </button>
                                    
                                    <div className='flex h-12 md:h-14 rounded-full border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden'>
                                        <button className='w-14 md:w-16 flex items-center justify-center text-white transition-all hover:bg-white/10 active:bg-white/20'>
                                            <FaHeart className='text-lg' />
                                        </button>
                                        <div className='w-px h-full bg-white/10'></div>
                                        <button className='w-14 md:w-16 flex items-center justify-center text-white transition-all hover:bg-white/10 active:bg-white/20'>
                                            <FaInfoCircle className='text-lg' />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <div className='absolute z-40 bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[70%] max-w-200'>
                    <Swiper
                        onSwiper={setThumbsSwiper}
                        spaceBetween={10}
                        slidesPerView={8}
                        breakpoints={{
                            320: { slidesPerView: 6, spaceBetween: 8 },
                            640: { slidesPerView: 10, spaceBetween: 10 },
                            1024: { slidesPerView: 14, spaceBetween: 12 },
                        }}
                        freeMode={true}
                        watchSlidesProgress={true}
                        grabCursor={true}
                        modules={[FreeMode, Navigation, Thumbs]}
                        className="py-2"
                    >
                        {movies?.map((e) => (
                            <SwiperSlide 
                                className="aspect-2/3 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent transition-all duration-300 hover:border-white  [&.swiper-slide-thumb-active]:border-white [&.swiper-slide-thumb-active]:shadow-[0_0_12px_rgba(255,255,255,0.4)] [&.swiper-slide-thumb-active]:-translate-y-1"
                            >
                                <img 
                                    src={e.imgUrl} 
                                    alt={e.name} 
                                    draggable="false" 
                                    className="w-full h-full object-cover pointer-events-none" 
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </div>
    );
}