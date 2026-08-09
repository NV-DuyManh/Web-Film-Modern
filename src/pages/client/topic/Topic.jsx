import { getOptimizedUrl } from '../../../utils/cloudinary';
import React, { useContext, useMemo } from 'react';
import { useTopics, useMovies } from '../../../hooks/useCollections';
import { Link } from 'react-router-dom';
import { CategoryContext } from '../../../contexts/CategoryProvider';
import { CategoryTypeContext } from '../../../contexts/CategoryTypeProvider';
import { FaFire, FaStar, FaFilm, FaGlobeAsia, FaTv, FaTheaterMasks, FaPlay, FaArrowRight } from 'react-icons/fa';


import { motion } from 'framer-motion';
import ParticleBackground from '../../../components/client/background/ParticleBackground';
import SEO from '../../../components/SEO';

export const SMART_FILTERS = {
    'phim-hot': (movies) => [...movies].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 20),
    'phim-moi': (movies) => [...movies].sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearB - yearA;
    }).slice(0, 20),
    'anime-hay': (movies) => movies.filter(m => m.countriesID?.toLowerCase() === 'japan').sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 20),
    'phim-han': (movies) => movies.filter(m => m.countriesID?.toLowerCase() === 'south korea').sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 20),
    'phim-trung': (movies) => movies.filter(m => m.countriesID?.toLowerCase() === 'china').sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 20),
    'phim-bo-dai-tap': (movies) => movies.filter(m => (Number(m.totalEpisodes) || 0) > 15).sort((a, b) => (Number(b.totalEpisodes) || 0) - (Number(a.totalEpisodes) || 0)).slice(0, 20),
    'phim-le': (movies, categoryTypes) => {
        const leId = categoryTypes?.find(c => c.name?.toLowerCase().includes('lẻ'))?.id;
        if (!leId) return [];
        return movies.filter(m => m.categoryTypeID === leId).sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 20);
    },
    'phim-viet': (movies) => movies.filter(m => m.countriesID?.toLowerCase() === 'vietnam' || m.countriesID?.toLowerCase() === 'việt nam').sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 20)
};

function CollectionCard({ collection, movies, index }) {
    const previewMovies = movies.slice(0, 4);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
        >
            <Link 
                to={`/topic/${collection.id}`}
                className="group block relative rounded-2xl overflow-hidden aspect-4/3 border-[2px] border-white/10 hover:border-[#facc15] hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all duration-500"
            >
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    {previewMovies.map((movie, i) => (
                        <div key={movie.id || i} className="overflow-hidden">
                            <img 
                                src={getOptimizedUrl(movie.bannerUrl || movie.imgUrl, 480, 270, 'thumb')} 
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - previewMovies.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-slate-800/80"></div>
                    ))}
                </div>



                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${collection.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}></div>

                <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">

                    <h3 className={`font-black text-xl md:text-2xl mb-1 bg-gradient-to-r ${collection.gradient} text-transparent bg-clip-text drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] py-1 leading-tight`}>
                        {collection.title}
                    </h3>
                    <p className="text-slate-100 text-xs md:text-sm line-clamp-2 mb-3 min-h-[32px] md:min-h-[40px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] font-medium">
                        {collection.description}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-[#facc15] text-xs font-bold drop-shadow-md">
                            {movies.length} phim
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#22d3ee] group-hover:text-[#67e8f9] transition-colors drop-shadow-md">
                            <span>Xem tất cả</span>
                            <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

function Topic() {
    const movies = useMovies() || [];
    const categories = useContext(CategoryContext) || [];
    const categoryTypes = useContext(CategoryTypeContext) || [];

    const customTopics = useTopics() || [];

    const collections = useMemo(() => {
        if (movies.length === 0) return [];
        
        const customCols = customTopics.map(topic => {
            let topicMovies = [];
            if (topic.isSmart && topic.smartId && SMART_FILTERS[topic.smartId]) {
                topicMovies = SMART_FILTERS[topic.smartId](movies, categoryTypes, categories);
            } else {
                topicMovies = (topic.movieIds || []).map(id => movies.find(m => m.id === id)).filter(Boolean);
            }

            return {
                id: topic.id,
                title: topic.title || topic.name,
                description: topic.description,
                gradient: topic.gradient || 'from-purple-500 to-indigo-600',
                movies: topicMovies
            };
        }).filter(col => col.movies.length > 0);

        return customCols;
    }, [movies, categoryTypes, categories, customTopics]);

    const heroCollection = collections[0];
    const heroMovies = heroCollection?.movies || [];
    const topHeroMovies = heroMovies.slice(0, 5);
    const bannerMovie = heroMovies.find(m => m.bannerUrl) || topHeroMovies[0];

    return (
        <div className="w-full min-h-screen bg-transparent relative overflow-hidden" style={{ paddingTop: '90px', paddingBottom: '60px' }}>
            <SEO 
                title="Chủ Đề Phim - Bộ Sưu Tập Phim Hay"
                description="Khám phá các bộ sưu tập phim theo chủ đề: Phim Hot, Anime, Phim Hàn, Phim Trung Quốc, Phim Bộ Dài Tập và nhiều hơn nữa tại MFILM."
                url="/topic"
            />
            <ParticleBackground />

            <div className="max-w-350 mx-auto px-4 sm:px-6 md:px-8 relative z-10">

                {heroCollection && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mt-4 md:mt-6 mb-10 md:mb-14"
                    >
                        <div className="group block relative rounded-3xl overflow-hidden border-[2px] border-white/10 hover:border-[#facc15] hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all duration-500">
                            <div className="relative h-52 sm:h-64 md:h-80 lg:h-96 overflow-hidden">
                                <img 
                                    src={bannerMovie?.bannerUrl || bannerMovie?.imgUrl} 
                                    alt="" 
                                    className="absolute inset-0 w-full h-full object-cover object-top"
                                />
                                
                                <Link to={`/topic/${heroCollection.id}`} className="absolute inset-0 z-10">
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent pointer-events-none"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                                </Link>
                                
                                <div className="absolute inset-0 flex items-end p-6 md:p-10 z-20 pointer-events-none">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">

                                            <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Bộ sưu tập nổi bật</span>
                                        </div>
                                        <h2 className={`text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r ${heroCollection.gradient} text-transparent bg-clip-text mb-2 py-2 leading-tight`}>
                                            {heroCollection.title}
                                        </h2>
                                        <p className="text-slate-400 text-sm md:text-base max-w-lg mb-4">
                                            {heroCollection.description}
                                        </p>
                                        <div className="flex items-center gap-3 pointer-events-auto">
                                            <Link to={`/topic/${heroCollection.id}`} className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-semibold border border-white/10 hover:bg-white/20 transition-colors">
                                                {heroCollection.movies?.length || 0} phim
                                            </Link>
                                            <Link to={`/topic/${heroCollection.id}`} className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors group/btn">
                                                Khám phá ngay <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex items-end gap-3 mr-4 pointer-events-auto">
                                        {topHeroMovies.filter(m => m.id !== bannerMovie?.id).slice(0, 3).map((movie, i) => (
                                            <Link 
                                                to={`/phim/${movie.slug || movie.id}`}
                                                key={movie.id}
                                                className="group/poster rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 transition-all duration-300 hover:-translate-y-4 hover:border-[#facc15] hover:shadow-[0_10px_20px_rgba(250,204,21,0.3)] relative"
                                                style={{ 
                                                    width: `${100 - i * 10}px`,
                                                    transform: `translateY(${i * 8}px)`,
                                                    zIndex: 3 - i,
                                                }}
                                            >
                                                <img src={getOptimizedUrl(movie.imgUrl, 300, 450, 'poster')} alt="" className="w-full aspect-2/3 object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center">
                                                    <FaPlay className="text-white text-xl" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 via-cyan-400 to-amber-300 text-transparent bg-clip-text tracking-tight pb-1">
                        Tất Cả Bộ Sưu Tập
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Khám phá phim theo chủ đề yêu thích của bạn</p>
                </motion.div>

                {movies.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-2xl aspect-4/3 bg-slate-800/50 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {collections.map((col, index) => (
                            <CollectionCard
                                key={col.id}
                                collection={col}
                                movies={col.movies}
                                index={index}
                            />
                        ))}
                    </div>
                )}

                {movies.length > 0 && collections.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="text-6xl mb-4">🎬</div>
                        <h2 className="text-xl text-slate-400 font-semibold">Chưa có bộ sưu tập nào</h2>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Topic;
