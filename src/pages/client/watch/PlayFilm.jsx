import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaPlay, FaClosedCaptioning, FaMicrophone, FaBell, FaHistory } from 'react-icons/fa';
import { MovieContext } from '../../../contexts/MovieProvider';
import { getObjectById } from '../../../services/firebaseResponse';
import { PlanContext } from '../../../contexts/PlanProvider';
import ListEpisodes from './ListEpisodes';
import { EpisodeContext } from '../../../contexts/EpisodeProvider';
import { getResume, saveResume, clearResume, formatTime, timeAgo } from '../../../utils/watchHistory';
import VideoPlayer from './VideoPlayer';

export default function PlayFilm({ handleOpenLogin }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeAudio, setActiveAudio] = useState('vietsub');
    const movies = useContext(MovieContext);
    const plans = useContext(PlanContext);
    const episodes = useContext(EpisodeContext);
    const playerRef = useRef(null);


    const currentEpisode = useMemo(() => episodes.find(e => e.id == id), [id, episodes]);
    const isDirectMovieId = !currentEpisode && movies.some(m => m.id == id);
    const movieId = currentEpisode ? currentEpisode.movieID : id;
    const movie = useMemo(() => getObjectById(movies, movieId) || {}, [movies, movieId]);

    const realMovieId = currentEpisode ? currentEpisode.movieID : (isDirectMovieId ? id : null);

    const [playEpisodes, setPlayEpisodes] = useState({});
    const episodeShow = useMemo(() => {
        const mid = currentEpisode ? currentEpisode.movieID : id;
        return episodes.filter(e => e.movieID == mid).sort((a, b) => a.numberEpisode - b.numberEpisode);
    }, [id, episodes, currentEpisode]);


    const [showModal, setShowModal] = useState(false);
    const [resumeData, setResumeData] = useState(null);


    useEffect(() => {
        if (currentEpisode) {
            setPlayEpisodes(currentEpisode);
        } else if (episodeShow.length > 0) {
            setPlayEpisodes(episodeShow[0]);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (realMovieId && playEpisodes?.id) {
            const saved = getResume(realMovieId);
            const epSeconds = saved?.episodes?.[playEpisodes.id] || 0;

            if (epSeconds > 5) {
                setResumeData({ ...saved, seconds: epSeconds });
                setShowModal(true);
            } else {
                setResumeData(null);
                setShowModal(false);
            }
        }
    }, [id, currentEpisode, episodeShow, realMovieId, playEpisodes?.id]);


    const handleTimeUpdate = useCallback((currentSeconds) => {
        if (playEpisodes?.id && realMovieId && currentSeconds > 0) {
            saveResume(realMovieId, {
                episodeId: playEpisodes.id,
                episodeNumber: playEpisodes.numberEpisode,
                seconds: currentSeconds,
            });
        }
    }, [playEpisodes?.id, realMovieId]);


    useEffect(() => {
        const handleBeforeUnload = () => {
            const time = playerRef.current?.getTime?.() || 0;
            if (playEpisodes?.id && realMovieId && time > 0) {
                saveResume(realMovieId, {
                    episodeId: playEpisodes.id,
                    episodeNumber: playEpisodes.numberEpisode,
                    seconds: Math.floor(time),
                });
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [playEpisodes?.id, realMovieId]);


    const handleClickEpisodes = (ep) => {
        const time = playerRef.current?.getTime?.() || 0;
        if (playEpisodes?.id && realMovieId && time > 0) {
            saveResume(realMovieId, {
                episodeId: playEpisodes.id,
                episodeNumber: playEpisodes.numberEpisode,
                seconds: Math.floor(time),
            });
        }
        window.location.href = `/play/${ep.id}`;
    };

    const handleResume = () => {
        setShowModal(false);
        const seekTo = resumeData?.seconds || 0;
        setTimeout(() => {
            if (playerRef.current) {
                playerRef.current.seek(seekTo);
                playerRef.current.play();
            }
        }, 500);
    };

    const handleFromStart = () => {
        setShowModal(false);
        if (realMovieId && playEpisodes?.id) {
            clearResume(realMovieId, playEpisodes.id);
        }
        setTimeout(() => {
            if (playerRef.current) {
                playerRef.current.seek(0);
                playerRef.current.play();
            }
        }, 300);
    };


    return (
        <div className="min-h-screen bg-[#0d0f14] text-gray-300 font-sans pb-10 py-25">
            <div className="mx-auto px-4 sm:px-6 pt-4">


                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/detailFilm/${movieId}`)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all cursor-pointer shadow-sm"
                            title="Quay lại chi tiết phim"
                        >
                            <FaChevronLeft className="pr-0.5 text-sm" />
                        </button>
                        <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                            <p className="inline">Xem phim <p className="text-yellow-400 inline">{movie?.name}</p></p>
                            {playEpisodes?.numberEpisode && (
                                <>
                                    <p className="text-slate-500 inline">•</p>
                                    <p className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 rounded-lg text-xs sm:text-sm font-extrabold shadow-sm inline">
                                        Tập {playEpisodes.numberEpisode}
                                    </p>
                                </>
                            )}
                        </h1>
                    </div>


                    {resumeData && (
                        <div className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-900/20 backdrop-blur-md px-4 py-2 text-sm font-medium text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                                <FaHistory className="text-[12px]" />
                            </div>
                            <p className="relative tracking-wide">
                                Lần trước xem đến <span className="mx-0.5 font-bold text-amber-400">Tập {resumeData.latestEpisodeNumber}</span> 
                                <span className="ml-1 text-xs text-amber-200/60">({timeAgo(resumeData.updatedAt)})</span>
                            </p>
                        </div>
                    )}
                </div>


                <div className="relative w-full mb-8 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black group">
                    <VideoPlayer
                        ref={playerRef}
                        src={playEpisodes?.url}
                        onTimeUpdate={handleTimeUpdate}
                        autoPlay={false}
                        hideControls={showModal}
                    />


                    {showModal && resumeData && (
                        <div className="absolute inset-0 z-[999] bg-black flex items-center justify-center p-4">
                            <div className="resume-modal">
                                <div className="resume-modal__icon">
                                    <FaPlay className="text-2xl ml-1" />
                                </div>
                                <p className="text-gray-200 text-sm sm:text-base font-semibold leading-relaxed">
                                    Hệ thống ghi nhận bạn đã từng xem anime này trước đó!
                                </p>
                                <p className="text-gray-400 text-xs sm:text-sm">
                                    Bạn có muốn xem tiếp từ đoạn:
                                </p>
                                <div className="resume-modal__time">
                                    {formatTime(resumeData.seconds)}
                                </div>
                                <div className="flex items-center gap-3 w-full mt-1">
                                    <button onClick={handleResume} className="resume-modal__btn resume-modal__btn--primary">
                                        Xem tiếp
                                    </button>
                                    <button onClick={handleFromStart} className="resume-modal__btn resume-modal__btn--secondary">
                                        Từ đầu
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
                                <button onClick={() => navigate(`/detailFilm/${movie.id}`)} className="text-yellow-500 mt-2 font-medium hover:underline">Thông tin phim &gt;</button>
                            </div>
                        </div>

                        <div className="mt-6 bg-linear-to-r from-[#4b6cb7] via-[#7b2ff7] to-[#b83280] rounded-lg p-5 flex gap-4 items-start shadow-lg">
                            <div className="mt-1 shrink-0 text-yellow-400"><FaBell className="text-xl" /></div>
                            <div className="text-sm text-white space-y-1 font-medium">
                                <p>Click chọn SV 1, SV 2 hoặc SV 3 nếu không xem được.</p>
                                <p>Tham gia <a href="" className="text-yellow-300 hover:underline">nhóm Game Telegram</a></p>
                                <p>Mời bạn tham gia <a href="#" className="text-yellow-300 hover:underline">nhóm discord của RoPhim</a></p>
                            </div>
                        </div>


                        <div className="mt-6 p-4 bg-[#14192b] rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 inline">Bản chiếu:</p>
                                <button onClick={() => setActiveAudio('vietsub')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${activeAudio === 'vietsub' ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm' : 'bg-[#1b2236] text-slate-300 hover:text-white border-slate-700/60 hover:bg-[#232c46]'}`}>
                                    <FaClosedCaptioning className="text-sm" /> Vietsub
                                </button>
                                <button onClick={() => setActiveAudio('thuyetminh')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${activeAudio === 'thuyetminh' ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm' : 'bg-[#1b2236] text-slate-300 hover:text-white border-slate-700/60 hover:bg-[#232c46]'}`}>
                                    <FaMicrophone className="text-sm" /> Thuyết Minh
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 inline">Server:</p>
                                <button className="px-4 py-1.5 rounded-lg bg-yellow-400 text-black text-xs font-extrabold shadow-sm hover:bg-yellow-500 transition-all cursor-pointer">SVR 1</button>
                                <button className="px-4 py-1.5 rounded-lg bg-[#1b2236] text-slate-300 border border-slate-700/60 text-xs font-bold hover:bg-[#232c46] hover:text-white transition-all cursor-pointer">SVR 2</button>
                                <button className="px-4 py-1.5 rounded-lg bg-[#1b2236] text-slate-300 border border-slate-700/60 text-xs font-bold hover:bg-[#232c46] hover:text-white transition-all cursor-pointer">SVR 3</button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <ListEpisodes handleClickEpisodes={handleClickEpisodes} episodeShow={episodeShow} playEpisodes={playEpisodes} />
                        </div>
                    </div>


                    <div className="w-full lg:w-80 xl:w-90 shrink-0">
                        <h2 className="text-xl font-bold text-white mb-6">Đề xuất cho bạn</h2>
                        <div className="flex flex-col gap-4">
                            {movies.slice(0, 5).map((e) => (
                                <div key={e.id} onClick={() => navigate(`/detailFilm/${e.id}`)} className="flex gap-4 bg-transparent p-2 rounded-lg hover:bg-[#161821] transition-colors cursor-pointer group">
                                    <div className="w-18 h-26.25 shrink-0 overflow-hidden rounded-md border border-gray-800 group-hover:border-gray-600">
                                        <img src={e.imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="flex flex-col justify-center py-1">
                                        <h3 className="text-[15px] font-bold text-gray-200 line-clamp-2 group-hover:text-yellow-400 transition-colors leading-snug">{e.name}</h3>
                                        <p className="text-xs text-amber-300 line-clamp-1 mt-1">{getObjectById(plans, e.planID)?.name}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <p className="text-[11px] text-gray-400 inline">{e.countriesID}</p>
                                            <p className="w-1 h-1 rounded-full bg-gray-600 inline"></p>
                                            <p className="text-[11px] text-gray-400 inline">{e.duration} phút</p>
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
