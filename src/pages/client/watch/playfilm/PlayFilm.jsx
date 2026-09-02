import { getOptimizedUrl } from '../../../../utils/cloudinary';
import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaPlay, FaClosedCaptioning, FaMicrophone, FaBell, FaHistory, FaBolt } from 'react-icons/fa';
import { getObjectById } from '../../../../services/firebaseResponse';
import { fetchDataById, updateDocument } from '../../../../services/firebaseService';
import { PlanContext } from '../../../../contexts/PlanProvider';
import ListEpisodes from './ListEpisodes';
import { getResume, saveResume, clearResume, formatTime, timeAgo } from '../../../../utils/watchHistory';
import VideoPlayer from './VideoPlayer';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { isSingleMovie, formatEpisodeName } from '../../../../utils/appUtils';
import Comment from '../detailFilm/Comment';
import SEO from '../../../../components/SEO';
import { syncSingleMovieEpisodes } from '../../../../services/autoEpisodeSyncService';
import PageLoadingSpinner from '../../../../components/common/PageLoadingSpinner';

function PlayFilm({ handleOpenLogin }) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tap = searchParams.get('tap');
    
    const [activeAudio, setActiveAudio] = useState('vietsub');
    const serverParam = searchParams.get('server');
    const [activeServer, setActiveServer] = useState(serverParam ? parseInt(serverParam) : 1);
    const movies = useMovies();
    const plans = useContext(PlanContext);
    const [episodes, setEpisodes] = useState([]);
    const [currentEpisode, setCurrentEpisode] = useState(null);
    const playerRef = useRef(null);
    const { isLogin } = useContext(AuthContext);

    const movie = useMemo(() => movies.find(m => m.slug === slug || m.id === slug) || {}, [movies, slug]);
    const realMovieId = movie?.id;
    const categoryTypes = useContext(CategoryTypeContext);
    const isSingle = isSingleMovie(movie, categoryTypes);

    useEffect(() => {
        if (!realMovieId) return;
        const unsubscribe = fetchDataById("Episodes", "movieID", realMovieId, (data) => {
            setEpisodes(data);
        });
        return () => unsubscribe();
    }, [realMovieId]);

    // Tự động kiểm tra và thêm tập mới tức thì khi người xem phát phim
    useEffect(() => {
        if (movie && movie.slug) {
            syncSingleMovieEpisodes(movie, episodes);
        }
    }, [movie?.id, movie?.slug]);

    const episodeShow = useMemo(() => {
        if (!realMovieId) return [];
        const list = episodes.filter(e => e.movieID == realMovieId);
        const map = new Map();
        list.sort((a, b) => (Number(a.numberEpisode) || 0) - (Number(b.numberEpisode) || 0)).forEach(e => {
            const num = Number(e.numberEpisode);
            if (!map.has(num)) {
                map.set(num, e);
            } else {
                const prev = map.get(num);
                if ((!prev.url || !prev.url.startsWith('http')) && e.url?.startsWith('http')) {
                    map.set(num, e);
                }
            }
        });
        return Array.from(map.values()).sort((a, b) => (Number(a.numberEpisode) || 0) - (Number(b.numberEpisode) || 0));
    }, [realMovieId, episodes]);

    const [playEpisodes, setPlayEpisodes] = useState({});

    useEffect(() => {
        if (episodeShow.length > 0) {
            let ep;
            if (tap) {
                ep = episodeShow.find(e => String(e.numberEpisode) === String(tap));
            }
            if (!ep) ep = episodeShow[0];
            
            setPlayEpisodes(ep);
            setCurrentEpisode(ep);
        }
    }, [episodeShow, tap]);

    useEffect(() => {
        if (playEpisodes && activeServer === 2 && !playEpisodes.url2) {
            setActiveServer(1);
        }
    }, [playEpisodes, activeServer]);

    useEffect(() => {
        if (!realMovieId) return;

        const currentViews = movie?.views || 0;
        updateDocument("Movies", { id: realMovieId, views: currentViews + 1 }, true).catch(e => console.error(e));
    }, [realMovieId, playEpisodes?.id]);


    const [showModal, setShowModal] = useState(false);
    const [resumeData, setResumeData] = useState(null);


    useEffect(() => {
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
    }, [slug, tap, realMovieId, playEpisodes?.id]);


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
        navigate(`/xem-phim/${slug}?tap=${ep.numberEpisode}&server=${activeServer}`);
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
                title={`Xem ${movie?.otherName || movie?.name || 'Phim'}${playEpisodes?.numberEpisode ? ` - ${formatEpisodeName(playEpisodes.numberEpisode, isSingle)}` : ''}`}
                description={`Xem phim ${movie?.otherName || movie?.name || ''} ${formatEpisodeName(playEpisodes?.numberEpisode || 1, isSingle).toLowerCase()} vietsub, thuyết minh chất lượng cao tại MFILM.`}
                image={movie?.bannerUrl || movie?.imgUrl}
                url={`/xem-phim/${slug}${tap ? `?tap=${tap}` : ''}`}
                type="video.episode"
            />

            <div className="mx-auto px-4 sm:px-6 pt-4 relative z-10">

                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/phim/${movie?.slug || realMovieId}`)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition cursor-pointer shadow-sm"
                            title="Quay lại chi tiết phim"
                        >
                            <FaChevronLeft className="pr-0.5 text-sm" />
                        </button>
                        <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                            <span className="inline">Xem phim <span className="text-yellow-400 inline">{movie?.otherName || movie?.name}</span></span>
                            {playEpisodes?.numberEpisode && (
                                <>
                                    <p className="text-slate-500 inline">•</p>
                                    <p className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 rounded-lg text-xs sm:text-sm font-extrabold shadow-sm inline">
                                        {formatEpisodeName(playEpisodes.numberEpisode, isSingle)}
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
                        src={activeServer === 2 && playEpisodes?.url2 ? playEpisodes.url2 : playEpisodes?.url}
                        onTimeUpdate={handleTimeUpdate}
                        autoPlay={false}
                        hideControls={showModal}
                    />


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


                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start border-b border-gray-800 pb-6">
                            <div className="md:w-1/3">
                                <h1 className="text-2xl font-bold text-white">{movie.otherName || movie.name}</h1>
                                <p className="text-yellow-500 text-sm mt-1">{movie.name}</p>
                            </div>
                            <div className="md:w-2/3 text-sm text-gray-400 leading-relaxed">
                                <p>{movie.description || 'Đang cập nhật nội dung giới thiệu cho bộ phim này...'}</p>
                                <button onClick={() => navigate(`/phim/${movie.slug || movie.id}`)} className="text-yellow-500 mt-2 font-medium hover:underline">Thông tin phim &gt;</button>
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
                                            setActiveServer(1);
                                            navigate(`/xem-phim/${slug}?tap=${playEpisodes.numberEpisode || tap || 1}&server=1`, { replace: true });
                                        }} 
                                        className={`px-4 py-1.5 rounded-lg text-xs transition cursor-pointer border ${activeServer === 1 ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold shadow-sm' : 'bg-[#1b2236] text-slate-300 hover:text-white border-slate-700/60 hover:bg-[#232c46] font-bold'}`}
                                    >SVR 1</button>
                                )}
                                {playEpisodes?.url2 && (
                                    <button 
                                        onClick={() => {
                                            setActiveServer(2);
                                            navigate(`/xem-phim/${slug}?tap=${playEpisodes.numberEpisode || tap || 1}&server=2`, { replace: true });
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
                                <div key={e.id} onClick={() => navigate(`/phim/${e.slug || e.id}`)} className="flex gap-4 bg-transparent p-2 rounded-lg hover:bg-[#161821] transition-colors cursor-pointer group">
                                    <div className="w-18 h-26.25 shrink-0 overflow-hidden rounded-md border border-gray-800 group-hover:border-gray-600">
                                        <img src={getOptimizedUrl(e.imgUrl, 300, 450, 'poster')} alt={e.otherName || e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
