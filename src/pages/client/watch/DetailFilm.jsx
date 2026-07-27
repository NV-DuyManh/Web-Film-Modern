import React, { useContext, useMemo, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaPlay, FaHeart, FaPlus, FaShare, FaComment, FaStar, FaPaperPlane } from 'react-icons/fa';
import { MovieContext } from '../../../contexts/MovieProvider';
import { AuthorContext } from '../../../contexts/AuthorProvider';
import { CharacterContext } from '../../../contexts/CharacterProvider';
import { getObjectById } from '../../../services/firebaseReponse';
import { PlanContext } from '../../../contexts/PlanProvider';
import { EpisodeContext } from '../../../contexts/EpisodeProvider';
import ListEpisodes from './ListEpisodes';

export default function DetailFilm() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('episodes');
    const movies = useContext(MovieContext);
    const authors = useContext(AuthorContext);
    const characters = useContext(CharacterContext);
    const plans = useContext(PlanContext);
    const episodes = useContext(EpisodeContext);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const movie = useMemo(() => {
        let found = getObjectById(movies, id);
        if (!found) {
            const ep = episodes.find(e => e.id == id);
            if (ep) {
                found = getObjectById(movies, ep.movieID);
            }
        }
        return found;
    }, [movies, episodes, id]);



    const topMovies = movies?.slice(0, 10) || [];

    const realMovieId = movie?.id || id;

    const episodeShow = useMemo(() => {
        return episodes.filter(e => e.movieID == realMovieId).sort((a, b) => a.numberEpisode - b.numberEpisode)
    }, [realMovieId, episodes]);

    const movieCharacters = useMemo(() => {
        if (!movie) return [];
        let charList = movie.character || movie.characters || movie.list_character || movie.list_Character;
        if (Array.isArray(charList) && charList.length > 0) {
            const resolved = charList.map(c => typeof c === 'string' ? getObjectById(characters, c) : c).filter(Boolean);
            if (resolved.length > 0) return resolved;
        }
        return [];
    }, [movie, characters]);

    const recommendedMovies = useMemo(() => {
        return movies?.filter(m => m.id !== realMovieId).slice(0, 8) || [];
    }, [movies, realMovieId]);

    const galleryImages = useMemo(() => {
        if (!movie) return [];
        const list = [
            movie.bannerUrl,
            movie.imgUrl,
            ...(Array.isArray(movie.gallery) ? movie.gallery : []),
            ...(Array.isArray(movie.images) ? movie.images : [])
        ].filter(Boolean);

        return Array.from(new Set(list));
    }, [movie]);

    const handleClickEpisodes = (ep) => {
        navigate(`/play/${ep.id}`);
    }

    if (!movie) {
        return (
            <div className="bg-[#0f1322] min-h-screen text-slate-300 flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                    <p className="text-lg font-bold text-slate-400">Đang tải thông tin phim...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f1322] min-h-screen text-slate-300 font-sans relative text-sm pb-20">

            <div className="w-full h-112.5 md:h-137.5 lg:h-162.5 relative z-0">
                <img
                    src={movie.bannerUrl || movie.imgUrl}
                    alt="Banner"
                    className="w-full h-full object-cover object-top"
                />
            </div>

            <div className="relative z-10 w-full bg-[#0f1322] rounded-t-[40px] pt-8 lg:pt-12 -mt-20 lg:-mt-32">

                <div className="w-full max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

                    <div className="lg:col-span-3 flex flex-col gap-6">

                        <div className="rounded-xl overflow-hidden shadow-2xl w-2/3 sm:w-1/2 lg:w-full mx-auto relative z-20 -mt-24 lg:-mt-48 border-4 border-[#0f1322]">
                            <img
                                src={movie.imgUrl}
                                alt={movie.name}
                                className="w-full aspect-2/3 object-cover"
                            />
                        </div>

                        <div className="text-center lg:text-left mt-1">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight">
                                {movie.name}
                            </h1>
                            <h2 className="text-sm text-yellow-500 font-medium">
                                {movie.originName || movie.name}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-[10px] font-bold">
                            <p className="px-1.5 py-0.5 border border-yellow-500 text-yellow-500 rounded inline">{getObjectById(plans, movie.planID)?.name}</p>
                            <p className="px-1.5 py-0.5 bg-white text-black rounded inline">Vietsub</p>
                            <p className="px-1.5 py-0.5 border border-slate-600 text-slate-300 rounded inline">{movie.year || '2024'}</p>
                            <p className="px-1.5 py-0.5 border border-slate-600 text-slate-300 rounded inline">{movie.endEpisode || 0} Tập</p>
                        </div>

                        <div className="text-[13px] space-y-2 mt-2">
                            <p className="text-slate-400 leading-relaxed text-justify">
                                <p className="font-bold text-white block mb-1 inline">Giới thiệu:</p>
                                {movie.description || 'Đang cập nhật nội dung giới thiệu cho bộ phim này...'}
                            </p>
                            <p className="text-slate-400"><p className="font-bold text-white inline">Thời lượng:</p> {movie.time || 'Đang cập nhật'}</p>
                            <p className="text-slate-400"><p className="font-bold text-white inline">Quốc gia:</p> <p className="text-slate-300 hover:text-white cursor-pointer inline">{movie.countriesID}</p></p>
                            <p className="text-slate-400"><p className="font-bold text-white inline">Đạo diễn:</p> <p className="text-slate-300 hover:text-white cursor-pointer inline">{movie.list_Author?.length > 0 ? movie.list_Author.map(id => getObjectById(authors, id)?.name).filter(Boolean).join(', ') : (getObjectById(authors, movie.author)?.name || 'Đang cập nhật')}</p></p>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-base font-bold text-white mb-3">Nhân vật</h3>
                            <div className="flex flex-wrap gap-4">
                                {(movie.character || movie.characters || movie.list_character || movie.list_Character || []).map((charIdOrObj, idx) => {
                                    const character = typeof charIdOrObj === 'string' ? getObjectById(characters, charIdOrObj) : charIdOrObj;
                                    if (!character) return null;
                                    return (
                                        <div key={idx} className="relative flex flex-col items-center gap-1.5 w-14 cursor-pointer group">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-600 group-hover:border-yellow-400 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all duration-300 transform group-hover:scale-110 z-10">
                                                <img src={character.imgUrl} alt={character.name} className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-[10px] text-center text-slate-300 truncate w-full transition-opacity duration-300">{character.name}</p>

                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:-translate-y-1 transition-all duration-300 z-50 pointer-events-none whitespace-nowrap">
                                                <div className="bg-[#0f1322]/90 backdrop-blur-md text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-yellow-500/30 shadow-[0_5px_20px_rgba(250,204,21,0.2)]">
                                                    {character.name}
                                                </div>
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-yellow-500/30"></div>
                                                <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-[#0f1322]/90"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8 hidden lg:block">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                Top phim tuần này
                            </h3>
                            <div className="flex flex-col gap-4">
                                {topMovies.map((m, index) => (
                                    <div key={index} onClick={() => navigate(`/detailFilm/${m.id}`)} className="flex items-center gap-3 group cursor-pointer">
                                        <div
                                            className={`text-3xl sm:text-4xl font-black italic w-10 shrink-0 text-center transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${index === 0
                                                ? "text-red-600"
                                                : index === 1
                                                    ? "text-orange-500"
                                                    : index === 2
                                                        ? "text-yellow-400"
                                                        : "text-pink-500"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-700/60">
                                            <img src={m.imgUrl} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        </div>
                                        <div className="flex flex-col min-w-0 relative">
                                            <h4 className="text-[13px] font-bold text-slate-200 group-hover:text-yellow-400 transition-colors truncate">{m.name}</h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{m.year || 2024} • {m.endEpisode} Tập</p>

                                            <div className="absolute top-0 left-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:-translate-y-[110%] transition-all duration-300 z-50 pointer-events-none whitespace-nowrap">
                                                <div className="bg-[#0f1322]/95 backdrop-blur-md text-yellow-400 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-yellow-500/30 shadow-[0_5px_20px_rgba(250,204,21,0.2)]">
                                                    {m.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="lg:col-span-9 flex flex-col gap-6">

                        <div className="bg-[#1a2035] rounded-3xl p-6 lg:p-8 flex flex-col gap-8 shadow-lg">

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-8">
                                    <Link to={`/play/${id}`} className="flex items-center gap-2 bg-[#facc15] hover:bg-yellow-500 text-black px-8 py-3 rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                        <FaPlay className="text-sm" /> Xem Ngay
                                    </Link>


                                    <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                                        <FaHeart className="text-xl" />
                                        <p className="text-[10px] font-bold uppercase inline">Yêu thích</p>
                                    </button>
                                    <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                                        <FaPlus className="text-xl" />
                                        <p className="text-[10px] font-bold uppercase inline">Thêm vào</p>
                                    </button>
                                    <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                                        <FaShare className="text-xl" />
                                        <p className="text-[10px] font-bold uppercase inline">Chia sẻ</p>
                                    </button>
                                </div>
                                <button className="flex items-center gap-2 px-5 py-2 bg-blue-600/30 text-blue-400 rounded-full text-[13px] font-bold transition-colors hover:bg-blue-600/50">
                                    <FaStar /> 0 Đánh giá
                                </button>
                            </div>

                            <div className="flex items-center gap-6 md:gap-8 border-b border-slate-700/60 pb-1">
                                <button
                                    onClick={() => setActiveTab('episodes')}
                                    className={`relative pb-3 text-sm md:text-base font-bold transition-all duration-200 cursor-pointer ${activeTab === 'episodes'
                                        ? "text-yellow-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-yellow-400 after:rounded-full after:shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Tập phim
                                </button>

                                <button
                                    onClick={() => setActiveTab('gallery')}
                                    className={`relative pb-3 text-sm md:text-base font-bold transition-all duration-200 cursor-pointer ${activeTab === 'gallery'
                                        ? "text-yellow-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-yellow-400 after:rounded-full after:shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Gallery
                                </button>

                                <button
                                    onClick={() => setActiveTab('actors')}
                                    className={`relative pb-3 text-sm md:text-base font-bold transition-all duration-200 cursor-pointer ${activeTab === 'actors'
                                        ? "text-yellow-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-yellow-400 after:rounded-full after:shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Diễn viên
                                </button>

                                <button
                                    onClick={() => setActiveTab('recommend')}
                                    className={`relative pb-3 text-sm md:text-base font-bold transition-all duration-200 cursor-pointer ${activeTab === 'recommend'
                                        ? "text-yellow-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-yellow-400 after:rounded-full after:shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Đề xuất
                                </button>
                            </div>

                            {activeTab === 'episodes' && (
                                <ListEpisodes handleClickEpisodes={handleClickEpisodes} episodeShow={episodeShow} />
                            )}
                            {activeTab === 'gallery' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-2">
                                    {galleryImages.length > 0 ? (
                                        galleryImages.map((imgSrc, idx) => (
                                            <div
                                                key={idx}
                                                className="relative rounded-2xl overflow-hidden aspect-16/9 border border-slate-800 shadow-md hover:border-yellow-400/60 transition-colors cursor-pointer"
                                            >
                                                <img
                                                    src={imgSrc}
                                                    alt={`Gallery ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-[#131828]/60 rounded-2xl border border-slate-800/60">
                                            Chưa có hình ảnh trong bộ sưu tập.
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'actors' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-2">
                                    {movieCharacters.length > 0 ? (
                                        movieCharacters.map((char, idx) => (
                                            <div key={idx} className="flex flex-col items-center group cursor-pointer">
                                                <div className="relative w-full aspect-3/4 rounded-2xl overflow-hidden border border-slate-800 shadow-lg group-hover:border-yellow-400 group-hover:shadow-[0_8px_25px_rgba(250,204,21,0.25)] group-hover:-translate-y-1 transition-all duration-300">
                                                    <img
                                                        src={char.imgUrl}
                                                        alt={char.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-3 text-center">
                                                        <h4 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors truncate">
                                                            {char.name}
                                                        </h4>
                                                    </div>
                                                </div>

                                                {char.role && (
                                                    <p className="text-xs font-semibold text-rose-300 text-center mt-2 truncate w-full">
                                                        {char.role}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-[#131828]/60 rounded-2xl border border-slate-800/60">
                                            Chưa có thông tin diễn viên cho bộ phim này.
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'recommend' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-2">
                                    {recommendedMovies.map((m, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => navigate(`/detailFilm/${m.id}`)}
                                            className="group flex flex-col rounded-2xl overflow-hidden bg-[#141a2e]/80 border border-slate-800/80 hover:border-yellow-400/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-md"
                                        >
                                            <div className="aspect-2/3 w-full overflow-hidden">
                                                <img src={m.imgUrl} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            </div>
                                            <div className="p-3 flex flex-col">
                                                <h4 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors truncate">{m.name}</h4>
                                                <p className="text-xs text-slate-400 mt-1">{m.year || 2024} • {m.endEpisode || 0} Tập</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-5 animate-fade-in mt-2">
                            <h3 className="text-xl font-bold text-white">Các bản chiếu</h3>

                            <div className="relative bg-[#3b415a] rounded-xl overflow-hidden w-full sm:w-[320px] shadow-lg">
                                <div className="absolute top-0 right-0 w-[80%] h-full z-0">
                                    <img
                                        src={movie.imgUrl || movie.bannerUrl}
                                        alt="bg"
                                        className="w-full h-full object-cover object-top opacity-50"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-r from-[#3b415a] via-[#3b415a]/80 to-transparent"></div>
                                </div>

                                <div className="relative z-10 p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-[#6366f1] rounded flex items-center justify-center p-1.5 shadow">
                                            <FaComment className="text-white text-[12px]" />
                                        </div>
                                        <p className="font-bold text-white text-[15px] inline">Vietsub #1</p>
                                    </div>

                                    <div className="mt-1 mb-1">
                                        <p className="font-black text-white text-xl inline">1</p>
                                    </div>

                                    <button className="bg-white hover:bg-slate-100 text-black px-4 py-2 mt-1 rounded-md font-bold text-[13px] w-fit shadow-md transition-colors">
                                        Xem bản này
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}