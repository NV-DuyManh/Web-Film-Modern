import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaPlay, FaVolumeUp, FaExpand, FaEllipsisV, FaComments, FaPaperPlane, FaClosedCaptioning, FaMicrophone, FaBell } from 'react-icons/fa';
import { MovieContext } from '../../../contexts/MovieProvider';
import { getObjectById } from '../../../services/firebaseReponse';
import { PlanContext } from '../../../contexts/PlanProvider';
import ListEpisodes from './ListEpisodes';
import { EpisodeContext } from '../../../contexts/EpisodeProvider';

export default function PlayFilm({ handleOpenLogin }) {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [activeAudio, setActiveAudio] = useState('vietsub');
    const movies = useContext(MovieContext);
    const plans = useContext(PlanContext);
    const episodes = useContext(EpisodeContext);

    const currentEpisode = useMemo(() => {
        return episodes.find(e => e.id == id);
    }, [id, episodes]);

    const movieId = currentEpisode ? currentEpisode.movieID : id;

    const movie = useMemo(() => {
        return getObjectById(movies, movieId) || {};
    }, [movies, movieId]);

    const [playEpisodes, setPlayEpisodes] = useState({});



    const episodeShow = useMemo(() => {
        let dataSort = [];
        if (currentEpisode) {
            setPlayEpisodes(currentEpisode);
            dataSort = episodes.filter(e => e.movieID == currentEpisode.movieID).sort((a, b) => a.numberEpisode - b.numberEpisode);
        } else {
            dataSort = episodes.filter(e => e.movieID == id).sort((a, b) => a.numberEpisode - b.numberEpisode);
            if (dataSort.length > 0) {
                setPlayEpisodes(dataSort[0]);
            }
        }
        return dataSort;
    }, [id, episodes, currentEpisode]);

    const handleClickEpisodes = (ep) => {
        setPlayEpisodes(ep);
        navigate(`/play/${ep.id}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return (
        <div className="min-h-screen bg-[#0d0f14] text-gray-300 font-sans pb-10 py-25">
            <div className=" mx-auto px-4 sm:px-6 pt-4">

                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(`/detaifilm/${movieId}`)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all cursor-pointer shadow-sm"
                        title="Quay lại chi tiết phim"
                    >
                        <FaChevronLeft className="pr-0.5 text-sm" />
                    </button>
                    <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                        <span>Xem phim <span className="text-yellow-400">{movie?.name}</span></span>
                        {playEpisodes?.numberEpisode && (
                            <>
                                <span className="text-slate-500">•</span>
                                <span className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 rounded-lg text-xs sm:text-sm font-extrabold shadow-sm">
                                    Tập {playEpisodes.numberEpisode}
                                </span>
                            </>
                        )}
                    </h1>
                </div>

                <div className="w-full mb-8">
                    <iframe className='w-full h-screen' src={playEpisodes?.url} frameborder="0"></iframe>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start border-b border-gray-800 pb-6">
                            <div className="md:w-1/3">
                                <h1 className="text-2xl font-bold text-white">{movie.name}</h1>
                                <p className="text-yellow-500 text-sm mt-1">{movie.originName || movie.name} ({movie.year || 'Đang cập nhật'})</p>
                            </div>
                            <div className="md:w-2/3 text-sm text-gray-400 leading-relaxed">
                                <p>{movie.description || 'Đang cập nhật nội dung giới thiệu cho bộ phim này...'}</p>
                                <button onClick={() => navigate(`/detaifilm/${movie.id}`)} className="text-yellow-500 mt-2 font-medium hover:underline">Thông tin phim &gt;</button>
                            </div>
                        </div>

                        <div className="mt-6 bg-linear-to-r from-[#4b6cb7] via-[#7b2ff7] to-[#b83280] rounded-lg p-5 flex gap-4 items-start shadow-lg">
                            <div className="mt-1 shrink-0 text-yellow-400">
                                <FaBell className="text-xl" />
                            </div>
                            <div className="text-sm text-white space-y-1 font-medium">
                                <p>Click chọn SV 1, SV 2 hoặc SV 3 nếu không xem được.</p>
                                <p>Tham gia <a href="" className="text-yellow-300 hover:underline">nhóm Game Telegram</a></p>
                                <p>Mời bạn tham gia <a href="#" className="text-yellow-300 hover:underline">nhóm discord của RoPhim</a></p>
                            </div>
                        </div>

                        {/* Server & Audio Control Bar */}
                        <div className="mt-6 p-4 bg-[#14192b] rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                            {/* Audio selection */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Bản chiếu:</span>
                                <button
                                    onClick={() => setActiveAudio('vietsub')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                        activeAudio === 'vietsub'
                                            ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm'
                                            : 'bg-[#1b2236] text-slate-300 hover:text-white border-slate-700/60 hover:bg-[#232c46]'
                                    }`}
                                >
                                    <FaClosedCaptioning className="text-sm" /> Vietsub
                                </button>
                                <button
                                    onClick={() => setActiveAudio('thuyetminh')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                        activeAudio === 'thuyetminh'
                                            ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm'
                                            : 'bg-[#1b2236] text-slate-300 hover:text-white border-slate-700/60 hover:bg-[#232c46]'
                                    }`}
                                >
                                    <FaMicrophone className="text-sm" /> Thuyết Minh
                                </button>
                            </div>

                            {/* Server selection */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Server:</span>
                                <button className="px-4 py-1.5 rounded-lg bg-yellow-400 text-black text-xs font-extrabold shadow-sm hover:bg-yellow-500 transition-all cursor-pointer">
                                    SVR 1
                                </button>
                                <button className="px-4 py-1.5 rounded-lg bg-[#1b2236] text-slate-300 border border-slate-700/60 text-xs font-bold hover:bg-[#232c46] hover:text-white transition-all cursor-pointer">
                                    SVR 2
                                </button>
                                <button className="px-4 py-1.5 rounded-lg bg-[#1b2236] text-slate-300 border border-slate-700/60 text-xs font-bold hover:bg-[#232c46] hover:text-white transition-all cursor-pointer">
                                    SVR 3
                                </button>
                            </div>
                        </div>

                        {/* Episodes Grid */}
                        <div className="mt-4">
                        </div>
                    </div>
                    <div className="w-full lg:w-[320px] xl:w-90 shrink-0">
                        <h2 className="text-xl font-bold text-white mb-6">Đề xuất cho bạn</h2>

                        <div className="flex flex-col gap-4">
                            {movies.slice(0, 5).map((e) => (
                                <div className="flex gap-4 bg-transparent p-2 rounded-lg hover:bg-[#161821] transition-colors cursor-pointer group">
                                    <div className="w-18 h-26.25 shrink-0 overflow-hidden rounded-md border border-gray-800 group-hover:border-gray-600">
                                        <img src={e.imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="flex flex-col justify-center py-1">
                                        <h3 className="text-[15px] font-bold text-gray-200 line-clamp-2 group-hover:text-yellow-400 transition-colors leading-snug">{e.name}</h3>
                                        <p className="text-xs text-amber-300 line-clamp-1 mt-1">
                                            {getObjectById(plans, e.planID)?.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[11px] text-gray-400">{e.countriesID}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                            <span className="text-[11px] text-gray-400">{e.duration} phút</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
