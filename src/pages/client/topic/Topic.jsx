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
                className="group block relative rounded-3xl overflow-hidden aspect-[4/3] bg-[#0b0f19] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
            >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${collection.gradient} transition-opacity duration-500 z-0`}></div>
                
                <div className="absolute inset-[2px] bg-[#0f1523] rounded-[22px] overflow-hidden z-10 flex flex-col justify-end">
                    
                    <div className="absolute inset-0 flex items-start justify-center pt-5">
                        {previewMovies[0] ? (
                            <img 
                                src={getOptimizedUrl(previewMovies[0].bannerUrl || previewMovies[0].imgUrl, 480, 270, 'thumb')} 
                                alt=""
                                className="absolute w-[90%] h-[70%] object-cover object-center rounded-2xl shadow-2xl transition-all duration-500 opacity-100 group-hover:opacity-0 group-hover:scale-95 group-hover:-translate-y-2 z-50 border border-white/10"
                            />
                        ) : (
                            <div className="absolute w-[90%] h-[70%] bg-slate-800 rounded-2xl z-50 border border-white/10 transition-all duration-500 opacity-100 group-hover:opacity-0"></div>
                        )}
                    </div>

                    <div className="absolute inset-0 flex items-start justify-center pt-5">
                        {previewMovies[3] && (
                            <img 
                                src={getOptimizedUrl(previewMovies[3].imgUrl, 300, 450, 'poster')} 
                                alt=""
                                className="absolute w-[40%] h-[80%] object-cover object-top rounded-xl shadow-lg transition-all duration-500 opacity-0 group-hover:opacity-80 group-hover:-translate-x-24 group-hover:-translate-y-1 group-hover:-rotate-[20deg] z-10 border border-white/10"
                            />
                        )}
                        {previewMovies[2] && (
                            <img 
                                src={getOptimizedUrl(previewMovies[2].imgUrl, 300, 450, 'poster')} 
                                alt=""
                                className="absolute w-[40%] h-[80%] object-cover object-top rounded-xl shadow-lg transition-all duration-500 opacity-0 group-hover:opacity-90 group-hover:-translate-x-10 group-hover:-translate-y-1 group-hover:-rotate-[5deg] group-hover:z-30 z-20 border border-white/10"
                            />
                        )}
                        {previewMovies[1] && (
                            <img 
                                src={getOptimizedUrl(previewMovies[1].imgUrl, 300, 450, 'poster')} 
                                alt=""
                                className="absolute w-[40%] h-[80%] object-cover object-top rounded-xl shadow-xl transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-10 group-hover:-translate-y-1 group-hover:rotate-[5deg] group-hover:z-40 z-30 border border-white/10"
                            />
                        )}
                        {previewMovies[0] && (
                            <img 
                                src={getOptimizedUrl(previewMovies[0].imgUrl, 300, 450, 'poster')} 
                                alt=""
                                className="absolute w-[40%] h-[80%] object-cover object-top rounded-xl shadow-2xl transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-24 group-hover:-translate-y-1 group-hover:rotate-[20deg] z-40 group-hover:z-50 border border-white/10 group-hover:border-white/30"
                            />
                        )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#070b14] via-[#070b14]/80 to-transparent z-40 pointer-events-none"></div>
                    
                    <div className="relative z-50 p-5 md:p-6 pb-4 md:pb-5 w-full flex flex-col">
                        <h3 className={`font-black text-xl md:text-2xl mb-1 bg-gradient-to-r ${collection.gradient} text-transparent bg-clip-text drop-shadow-[0_2px_2px_rgba(0,0,0,1)] py-1 leading-tight group-hover:scale-105 origin-left transition-transform duration-500`}>
                            {collection.title}
                        </h3>
                        <p className="text-slate-200 text-xs md:text-sm line-clamp-2 mb-3 min-h-[32px] md:min-h-[40px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-medium transition-colors group-hover:text-white">
                            {collection.description}
                        </p>
                        
                        <div className="flex items-center justify-between w-full border-t border-white/10 pt-3 group-hover:border-white/20 transition-colors">
                            <span className="px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm text-white/90 text-[11px] font-bold border border-white/10 group-hover:bg-white/10 group-hover:text-white transition-all">
                                {movies.length} PHIM
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/50 group-hover:text-white transition-colors">
                                <span>Khám phá</span>
                                <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform duration-300" />
                            </div>
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

    return (
        <div className="w-full min-h-screen bg-transparent relative overflow-hidden" style={{ paddingTop: '90px', paddingBottom: '60px' }}>
            <SEO 
                title="Chủ Đề Phim - Bộ Sưu Tập Phim Hay"
                description="Khám phá các bộ sưu tập phim theo chủ đề: Phim Hot, Anime, Phim Hàn, Phim Trung Quốc, Phim Bộ Dài Tập và nhiều hơn nữa tại MFILM."
                url="/topic"
            />
            <ParticleBackground />

            <div className="max-w-350 mx-auto px-4 sm:px-6 md:px-8 relative z-10">


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
