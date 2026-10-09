import { useMovieEpisodes, useEpisodeStream } from '../../../../hooks/useMovieEpisodes';
import useMovie from '../../../../hooks/useMovie';
import MovieImage from '../../../../components/MovieImage';
import { normalizeEpisodes, episodeKey, episodeLabel, findEpisode } from '../../../../utils/episodes';
import useCanonicalPath from '../../../../hooks/useCanonicalPath';
import { routeSegment } from '../../../../utils/nameRoutes';
import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useSubscriptions, useRentMovies, useMovies } from '../../../../hooks/useCollections';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaPlay, FaClosedCaptioning, FaMicrophone, FaBell, FaHistory, FaBolt } from 'react-icons/fa';
import { getObjectById } from '../../../../services/firebaseResponse';
import { updateDocument } from '../../../../services/firebaseService';
import { PlanContext } from '../../../../contexts/PlanProvider';
import ListEpisodes from './ListEpisodes';
import { saveResume, clearResume, formatTime, timeAgo } from '../../../../utils/watchHistory';
import useResumeEntry from '../../../../hooks/useResumeEntry';
import VideoPlayer from './VideoPlayer';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { isSingleMovie, formatEpisodeName, getUserPlanInfo, getExpiryDate } from '../../../../utils/appUtils';
import { nextPlayableEpisode, episodeSource } from '../../../../utils/playback';
import NextEpisodePrompt from './NextEpisodePrompt';
import Comment from '../detailFilm/Comment';
import SEO from '../../../../components/SEO';
import PageLoadingSpinner from '../../../../components/common/PageLoadingSpinner';
import { trackEvent } from '../../../../services/eventTracker';
import { flushActiveResumeSync } from '../../../../services/resumeSyncService';


function PlayFilm() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tap = searchParams.get('tap');
    
    const [activeAudio, setActiveAudio] = useState('vietsub');
    const serverParam = searchParams.get('server');
    const movies = useMovies();
    const plans = useContext(PlanContext);
    const lastProgressTimeRef = useRef(0);
    const completedEpisodeRef = useRef(null);
    const playerRef = useRef(null);
    const { isLogin } = useContext(AuthContext);
    const subscriptions = useSubscriptions();
    const rentals = useRentMovies();
    const [pendingNext, setNextPrompt] = useState(null);
    const [autoNext, setAutoNext] = useState(() => {
        try { return localStorage.getItem('mfilm_auto_next') !== 'false'; } catch { return true; }
    });
    const [autoStartEpisodeId, setAutoStartEpisodeId] = useState(null);

    const currentMovie = useMovie(slug);
    const movie = useMemo(() => currentMovie || {}, [currentMovie]);
    useCanonicalPath(movie?.id ? `/xem-phim/${routeSegment(movie)}` : '');
    const realMovieId = movie?.id;
    const categoryTypes = useContext(CategoryTypeContext);
    const isSingle = isSingleMovie(movie, categoryTypes);
    const moviePlan = getObjectById(plans, movie?.planID);
    const canWatch = !!realMovieId && !!moviePlan && (Number(moviePlan.level || 0) === 0 ||
        (!!isLogin && (getUserPlanInfo(isLogin, subscriptions, plans).level >= Number(getObjectById(plans, movie?.planID)?.level || 0) ||
            rentals.some(rent => rent.movieID === realMovieId && rent.userID === isLogin.id && getExpiryDate(rent) > new Date()))));

    const episodes = useMovieEpisodes(realMovieId);


    const episodeShow = useMemo(() => normalizeEpisodes(episodes.filter(e => e.movieID === realMovieId)), [realMovieId, episodes]);

    const selectedEpisode = useMemo(() => findEpisode(episodeShow, tap) || episodeShow[0] || {}, [episodeShow, tap]);
    const selectedStream = useEpisodeStream(selectedEpisode.id, canWatch);
    const playEpisodes = useMemo(() => ({ ...selectedEpisode, url: '', url2: '', urlM3u8: '', ...(selectedStream || {}) }), [selectedEpisode, selectedStream]);
    const playingLabel = episodeLabel(playEpisodes, isSingle);
    const playingTitle = playingLabel === 'Full' ? 'Full' : `Tập ${playingLabel}`;
    const activeServer = serverParam === '2' && playEpisodes.url2 ? 2 : 1;
    const nextPrompt = pendingNext?.fromEpisodeId === playEpisodes.id ? pendingNext : null;
    useEffect(() => { lastProgressTimeRef.current = 0; completedEpisodeRef.current = null; }, [realMovieId, playEpisodes?.id]);

    useEffect(() => {
        if (!realMovieId) return;

        const currentViews = movie?.views || 0;
        updateDocument("Movies", { id: realMovieId, views: currentViews + 1 }, true).catch(e => console.error(e));

        // Big Data Telemetry: Emit movie_view event
        trackEvent('movie_view', realMovieId, playEpisodes?.id, {
            title: movie?.name,
            episodeNumber: playEpisodes?.numberEpisode,
            slug: movie?.slug,
        });
    }, [realMovieId, playEpisodes?.id]);


    const savedResume = useResumeEntry(realMovieId, isLogin?.id);
    const [resumeDialog, setResumeDialog] = useState(null);
    const [startedEpisodeId, setStartedEpisodeId] = useState(null);
    const resumeData = savedResume?.episodes?.[playEpisodes.id] > 5 ? { ...savedResume, seconds: savedResume.episodes[playEpisodes.id] } : null;
    const showModal = !!resumeData && (resumeDialog?.episodeId === playEpisodes.id ? resumeDialog.open :
        startedEpisodeId !== playEpisodes.id && autoStartEpisodeId !== playEpisodes.id);
    const setShowModal = open => setResumeDialog({ episodeId: playEpisodes.id, open });
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [slug, tap]);


    const handleTimeUpdate = useCallback((currentSeconds, playerDurationSeconds) => {
        if (playEpisodes?.id && realMovieId && currentSeconds > 0 && completedEpisodeRef.current !== playEpisodes.id) {
            saveResume(realMovieId, {
                episodeId: playEpisodes.id,
                episodeNumber: playEpisodes.numberEpisode,
                seconds: currentSeconds,
            }, isLogin?.id);

            // Big Data Telemetry: Calculate delta for correct sum in Tinybird
            const delta = currentSeconds - lastProgressTimeRef.current;
            // Only send if delta >= 10 to match the 10s throttle, and avoid double counting
            if (delta >= 10 || delta < 0) { // delta < 0 handles seeks backwards
                const sendDelta = delta < 0 ? 10 : Math.floor(delta);
                
                // Defensive normalizations to prevent data quality bugs (e.g. percent > 100)
                let finalDuration = Number.isFinite(playerDurationSeconds) && playerDurationSeconds > 0 
                    ? playerDurationSeconds 
                    : (playerRef.current?.getDuration?.() || (Number(movie?.duration) * 60) || 3600);
                
                let finalPosition = Math.max(0, Math.min(currentSeconds, finalDuration));
                let finalPercent = Math.round((finalPosition / finalDuration) * 100);
                finalPercent = Math.min(100, Math.max(0, finalPercent));

                trackEvent('watch_progress', realMovieId, playEpisodes.id, {
                    progress: sendDelta,
                    positionSeconds: Math.floor(finalPosition),
                    durationSeconds: Math.floor(finalDuration),
                    percent: finalPercent,
                });
                lastProgressTimeRef.current = currentSeconds;
            }
        }
    }, [playEpisodes, realMovieId, movie?.duration, isLogin?.id]);

    const handlePlay = useCallback((seconds) => {
        setStartedEpisodeId(playEpisodes?.id);
        if (seconds < (playerRef.current?.getDuration?.() || Infinity) - 1) completedEpisodeRef.current = null;
        if (realMovieId && playEpisodes?.id) {
            trackEvent('play', realMovieId, playEpisodes.id, { positionSeconds: Math.floor(seconds || 0) });
        }
    }, [realMovieId, playEpisodes]);

    const handlePause = useCallback((seconds) => {
        if (playEpisodes?.id && realMovieId && seconds > 0 && completedEpisodeRef.current !== playEpisodes.id) {
            saveResume(realMovieId, { episodeId: playEpisodes.id, episodeNumber: playEpisodes.numberEpisode, seconds: Math.floor(seconds) }, isLogin?.id);
            void flushActiveResumeSync();
        }
        if (realMovieId && playEpisodes?.id) {
            trackEvent('pause', realMovieId, playEpisodes.id, { positionSeconds: Math.floor(seconds || 0) });
        }
    }, [realMovieId, playEpisodes, isLogin?.id]);

    const handleSeek = useCallback((seconds) => {
        if (realMovieId && playEpisodes?.id) {
            trackEvent('seek', realMovieId, playEpisodes.id, { positionSeconds: Math.floor(seconds || 0) });
        }
    }, [realMovieId, playEpisodes]);

    const handleEnded = useCallback(() => {
        if (realMovieId && playEpisodes?.id) {
            const finalDuration = playerRef.current?.getDuration?.() || (Number(movie?.duration) * 60) || 3600;
            trackEvent('complete', realMovieId, playEpisodes.id, { durationSeconds: Math.floor(finalDuration) });
            completedEpisodeRef.current = playEpisodes.id;
            clearResume(realMovieId, playEpisodes.id, isLogin?.id);
            const next = nextPlayableEpisode(episodeShow, playEpisodes);
            if (autoNext && canWatch && next) setNextPrompt({ ...next, fromEpisodeId: playEpisodes.id });
        }
    }, [realMovieId, playEpisodes, movie?.duration, episodeShow, autoNext, canWatch, isLogin?.id]);

    const handleBufferStart = useCallback((seconds) => {
        if (realMovieId && playEpisodes?.id) {
            trackEvent('buffer_start', realMovieId, playEpisodes.id, { positionSeconds: Math.floor(seconds || 0) });
        }
    }, [realMovieId, playEpisodes]);

    const handleBufferEnd = useCallback((seconds) => {
        if (realMovieId && playEpisodes?.id) {
            trackEvent('buffer_end', realMovieId, playEpisodes.id, { positionSeconds: Math.floor(seconds || 0) });
        }
    }, [realMovieId, playEpisodes]);



    useEffect(() => {
        const handleBeforeUnload = () => {
            const time = playerRef.current?.getTime?.() || 0;
            if (playEpisodes?.id && realMovieId && time > 0 && completedEpisodeRef.current !== playEpisodes.id) {
                saveResume(realMovieId, {
                    episodeId: playEpisodes.id,
                    episodeNumber: playEpisodes.numberEpisode,
                    seconds: Math.floor(time),
                }, isLogin?.id);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);
        const handleHidden = () => { if (document.visibilityState === 'hidden') handleBeforeUnload(); };
        document.addEventListener('visibilitychange', handleHidden);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleHidden);
        };
    }, [playEpisodes?.id, playEpisodes?.numberEpisode, realMovieId, isLogin?.id]);


    const handleClickEpisodes = (ep) => {
        setAutoStartEpisodeId(null);
        setNextPrompt(null);
        const time = playerRef.current?.getTime?.() || 0;
        if (playEpisodes?.id && realMovieId && time > 0 && completedEpisodeRef.current !== playEpisodes.id) {
            saveResume(realMovieId, {
                episodeId: playEpisodes.id,
                episodeNumber: playEpisodes.numberEpisode,
                seconds: Math.floor(time),
            }, isLogin?.id);
        }
        navigate(`/xem-phim/${routeSegment(movie)}?tap=${episodeKey(ep)}&server=${activeServer}`);
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
            clearResume(realMovieId, playEpisodes.id, isLogin?.id);
        }
        setTimeout(() => {
            if (playerRef.current) {
                playerRef.current.seek(0);
                playerRef.current.play();
            }
        }, 300);
    };



    if (!realMovieId && movies.length === 0) {
        return (
            <div className="min-h-screen bg-[#0d0f14] text-gray-300 font-sans pb-10 pt-20">
                <PageLoadingSpinner text="Đang tải dữ liệu phim..." minHeight="min-h-[70vh]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0f14] text-gray-300 font-sans pb-10 py-25 relative overflow-hidden">
            <SEO 
                title={`Xem ${movie?.otherName || movie?.name || 'Phim'}${playEpisodes?.id ? ` - ${playingTitle}` : ''}`}
                description={`Xem phim ${movie?.otherName || movie?.name || ''} ${playingTitle.toLowerCase()} vietsub, thuyết minh chất lượng cao tại MFILM.`}
                image={movie?.bannerUrl || movie?.imgUrl}
                url={`/xem-phim/${routeSegment(movie)}${tap ? `?tap=${tap}` : ''}`}
                type="video.episode"
            />

            <div className="mx-auto px-4 sm:px-6 pt-4 relative z-10">

                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/phim/${routeSegment(movie)}`)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition cursor-pointer shadow-sm"
                            title="Quay lại chi tiết phim"
                        >
                            <FaChevronLeft className="pr-0.5 text-sm" />
                        </button>
                        <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                            <span className="inline">Xem phim <span className="text-yellow-400 inline">{movie?.otherName || movie?.name}</span></span>
                            {playEpisodes?.id && (
                                <>
                                    <p className="text-slate-500 inline">•</p>
                                    <p className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 rounded-lg text-xs sm:text-sm font-extrabold shadow-sm inline">
                                        {playingTitle}
                                    </p>
                                </>
                            )}
                        </h1>
                    </div>


                    {resumeData && (
                        <div
                            className="flex items-center gap-2 bg-[#f28123] px-3 py-1 text-white cursor-pointer hover:bg-[#d9701c] transition-colors"
                            onClick={() => setShowModal(true)}
                        >
                            <FaHistory className="text-[13px]" />
                            <p className="text-[13.5px] font-medium">
                                Bạn vừa xem {formatEpisodeName(resumeData.latestEpisodeNumber, isSingle).toLowerCase()} lúc {timeAgo(resumeData.updatedAt)}
                            </p>
                        </div>
                    )}
                </div>


                <div className="relative w-full mb-8 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black group">
                    <VideoPlayer
                        ref={playerRef}
                        src={episodeSource(playEpisodes, activeServer)}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSeek={handleSeek}
                        onEnded={handleEnded}
                        onBufferStart={handleBufferStart}
                        onBufferEnd={handleBufferEnd}
                        autoPlay={autoStartEpisodeId === playEpisodes?.id}
                        hideControls={showModal}
                        canSwitchServer={!!playEpisodes?.url2 && !!(playEpisodes?.url || playEpisodes?.urlM3u8)}
                        onSwitchServer={() => {
                            const server = activeServer === 1 ? 2 : 1;
                            navigate(`/xem-phim/${routeSegment(movie)}?tap=${episodeKey(playEpisodes)}&server=${server}`, { replace: true });
                        }}
                        onError={message => trackEvent('playback_error', realMovieId, playEpisodes?.id, { message, server: activeServer })}
                    />
                    {nextPrompt && canWatch && <NextEpisodePrompt key={nextPrompt.id} episode={nextPrompt}
                        onCancel={() => setNextPrompt(null)}
                        onContinue={() => {
                            if (!canWatch) return;
                            setAutoStartEpisodeId(nextPrompt.id);
                            setNextPrompt(null);
                            const server = activeServer === 2 && nextPrompt.hasSecondServer ? 2 : 1;
                            navigate(`/xem-phim/${routeSegment(movie)}?tap=${episodeKey(nextPrompt)}&server=${server}`);
                        }} />}



                    {showModal && resumeData && (
                        <div className="absolute inset-0 z-999 bg-black flex items-center justify-center p-4">
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


                {!isSingle && <label className="mb-6 flex items-center justify-end gap-2 text-sm text-slate-300">
                    <input type="checkbox" className="accent-yellow-400" checked={autoNext} onChange={event => {
                        const enabled = event.target.checked;
                        setAutoNext(enabled);
                        if (!enabled) setNextPrompt(null);
                        try { localStorage.setItem('mfilm_auto_next', String(enabled)); } catch { /* optional preference */ }
                    }} /> Tự chuyển tập
                </label>}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start border-b border-gray-800 pb-6">
                            <div className="md:w-1/3">
                                <h1 className="text-2xl font-bold text-white">{movie.otherName || movie.name}</h1>
                                <p className="text-yellow-500 text-sm mt-1">{movie.name}</p>
                            </div>
                            <div className="md:w-2/3 text-sm text-gray-400 leading-relaxed">
                                <p>{movie.description || 'Đang cập nhật nội dung giới thiệu cho bộ phim này...'}</p>
                                <button onClick={() => navigate(`/phim/${routeSegment(movie)}`)} className="text-yellow-500 mt-2 font-medium hover:underline">Thông tin phim &gt;</button>
                            </div>
                        </div>

                        <div className="mt-6 bg-linear-to-r from-[#4b6cb7] via-[#7b2ff7] to-[#b83280] rounded-lg p-5 flex gap-4 items-start shadow-lg">
                            <div className="mt-1 shrink-0 text-yellow-400"><FaBell className="text-xl" /></div>
                            <div className="text-sm text-white space-y-1 font-medium">
                                <p>Nếu phim không phát, thử đổi giữa Server 1 và Server 2 ở bên dưới.</p>
                                <p>Cần hỗ trợ? <a href="https://zalo.me/0779534325" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:underline">Liên hệ MFILM qua Zalo</a> và gửi tên phim, tập đang gặp lỗi.</p>
                            </div>
                        </div>


                        <div className="mt-6 p-4 bg-[#14192b] rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 inline">Bản chiếu:</p>
                                <button onClick={() => setActiveAudio('vietsub')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${activeAudio === 'vietsub' ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm' : 'bg-[#1b2236] text-slate-300 hover:text-white border-slate-700/60 hover:bg-[#232c46]'}`}>
                                    <FaClosedCaptioning className="text-sm" /> Vietsub
                                </button>
                                <button onClick={() => setActiveAudio('thuyetminh')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${activeAudio === 'thuyetminh' ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm' : 'bg-[#1b2236] text-slate-300 hover:text-white border-slate-700/60 hover:bg-[#232c46]'}`}>
                                    <FaMicrophone className="text-sm" /> Thuyết Minh
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 inline">Server:</p>
                                {playEpisodes?.url && (
                                    <button 
                                        onClick={() => {
                                            navigate(`/xem-phim/${routeSegment(movie)}?tap=${episodeKey(playEpisodes) || tap || 1}&server=1`, { replace: true });
                                        }} 
                                        className={`px-4 py-1.5 rounded-lg text-xs transition cursor-pointer border ${activeServer === 1 ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm' : 'bg-[#1b2236] text-slate-300 hover:text-white border-slate-700/60 hover:bg-[#232c46] font-bold'}`}
                                    >SVR 1</button>
                                )}
                                {playEpisodes?.url2 && (
                                    <button 
                                        onClick={() => {
                                            navigate(`/xem-phim/${routeSegment(movie)}?tap=${episodeKey(playEpisodes) || tap || 1}&server=2`, { replace: true });
                                        }} 
                                        className={`px-4 py-1.5 rounded-lg text-xs transition cursor-pointer border ${activeServer === 2 ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm' : 'bg-[#1b2236] text-slate-300 hover:text-white border-slate-700/60 hover:bg-[#232c46] font-bold'}`}
                                    >SVR 2</button>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <ListEpisodes handleClickEpisodes={handleClickEpisodes} episodeShow={episodeShow} playEpisodes={playEpisodes} />
                        </div>
                        <Comment
                            isLogin={isLogin}
                            onOpenLogin={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                            movieId={realMovieId}
                        />
                    </div>


                    <div className="w-full lg:w-80 xl:w-90 shrink-0">
                        <h2 className="text-xl font-bold text-white mb-6">Đề xuất cho bạn</h2>
                        <div className="flex flex-col gap-4">
                            {movies.slice(0, 5).map((e) => (
                                <div key={e.id} onClick={() => navigate(`/phim/${routeSegment(e)}`)} className="flex gap-4 bg-transparent p-2 rounded-lg hover:bg-[#161821] transition-colors cursor-pointer group">
                                    <div className="w-18 h-26.25 shrink-0 overflow-hidden rounded-md border border-gray-800 group-hover:border-gray-600">
                                        <MovieImage movie={e} kind="poster" imageWidth={300} imageHeight={450} imageType="poster" alt={e.otherName || e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="flex flex-col justify-center py-1">
                                        <h3 className="text-[15px] font-bold text-gray-200 line-clamp-2 group-hover:text-yellow-400 transition-colors leading-snug">{e.otherName || e.name}</h3>
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

export default PlayFilm;
