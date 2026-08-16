import React, { useContext, useMemo, useState, useRef } from 'react';
import { useRentMovies, useSubscriptions, useMovies } from '../../../../hooks/useCollections';
import { FaPlay, FaLock } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { getExpiryDate, getUserPlanInfo } from '../../../../utils/appUtils';
import { getObjectById } from '../../../../services/firebaseResponse';
import { PlanContext } from '../../../../contexts/PlanProvider';
import ModalDetail from '../detailFilm/ModalDetail';

function ListEpisodes({ episodeShow, playEpisodes, handleClickEpisodes }) {
    const { slug } = useParams();
    const [rangeIndex, setRangeIndex] = useState(0);
    const [openLoginDialog, setOpenLoginDialog] = useState(false);
    const CHUNK_SIZE = 80;
    const navigate = useNavigate();
    const { isLogin } = useContext(AuthContext);
    const subscriptions = useSubscriptions();
    const movies = useMovies();
    const plans = useContext(PlanContext);
    const allRent = useRentMovies();

    const movie = useMemo(() => {
        let found = movies.find(m => m.slug === slug || m.id === slug);
        if (!found) {
            const ep = episodeShow?.find(e => e.id == slug);
            if (ep) {
                found = getObjectById(movies, ep.movieID);
            }
        }
        return found;
    }, [movies, episodeShow, slug]);
    const levelUser = useMemo(() => {
        if (!plans || !movie) return false;
        const moviePlan = getObjectById(plans, movie.planID);
        const movieLevel = moviePlan?.level || 0;

        if (movieLevel === 0) return true;

        if (!isLogin || !subscriptions) return false;

        const userPlanLevel = getUserPlanInfo(isLogin, subscriptions, plans).level;
        return userPlanLevel >= movieLevel;
    }, [subscriptions, isLogin, plans, movie]);

    const checkRent = useMemo(() => {
        if (!isLogin || !movie) return false;
        const check = allRent.find(p => {
            return p.movieID == movie.id && p.userID == isLogin.id && getExpiryDate(p) > new Date();
        });
        return check;
    }, [isLogin, allRent, movie]);

    const checkShow = useMemo(() => {
        return levelUser || checkRent
    }, [levelUser, checkRent])

    const scrollRef = useRef(null);
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    if (!episodeShow || episodeShow.length === 0) {
        return (
            <div className="py-8 text-center text-slate-400 bg-[#0d121f] rounded-xl border border-slate-700/80 my-2">
                <p className="text-sm font-medium">Danh sách tập phim đang được cập nhật...</p>
            </div>
        );
    }



    const handleMouseDown = (e) => {
        isDown.current = true;
        if (scrollRef.current) {
            scrollRef.current.classList.add('cursor-grabbing');
            scrollRef.current.classList.remove('cursor-grab');
            startX.current = e.pageX - scrollRef.current.offsetLeft;
            scrollLeft.current = scrollRef.current.scrollLeft;
        }
    };

    const handleMouseLeave = () => {
        isDown.current = false;
        if (scrollRef.current) {
            scrollRef.current.classList.remove('cursor-grabbing');
            scrollRef.current.classList.add('cursor-grab');
        }
    };

    const handleMouseUp = () => {
        isDown.current = false;
        if (scrollRef.current) {
            scrollRef.current.classList.remove('cursor-grabbing');
            scrollRef.current.classList.add('cursor-grab');
        }
    };

    const handleMouseMove = (e) => {
        if (!isDown.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 2;
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const hasRanges = episodeShow.length > CHUNK_SIZE;
    const ranges = [];
    if (hasRanges) {
        for (let i = 0; i < episodeShow.length; i += CHUNK_SIZE) {
            ranges.push(episodeShow.slice(i, i + CHUNK_SIZE));
        }
    }

    const currentEpisodes = hasRanges ? (ranges[rangeIndex] || episodeShow) : episodeShow;

    return (
        <div className="flex flex-col gap-4 py-1">

            {hasRanges && (
                <div className="flex items-center gap-2 pb-3 border-b border-slate-700/60 w-full overflow-hidden">
                    <p className="text-xs font-black bg-linear-to-r from-amber-400 to-yellow-500 text-transparent bg-clip-text uppercase tracking-widest shrink-0 inline drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] mr-1">
                        Chọn phần:
                    </p>
                    <div 
                        ref={scrollRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className="flex items-center gap-2 overflow-x-auto scrollbar-hide cursor-grab flex-1"
                    >
                        {ranges.map((_, idx) => {
                            const start = idx * CHUNK_SIZE + 1;
                            const end = Math.min((idx + 1) * CHUNK_SIZE, episodeShow.length);
                            const isSelected = rangeIndex === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setRangeIndex(idx)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition duration-300 cursor-pointer whitespace-nowrap border ${isSelected
                                        ? "bg-linear-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                        : "bg-[#0d121f] text-slate-300 hover:text-white hover:bg-[#161d30] border-slate-700/80"
                                        }`}
                                >
                                    Tập {start} - {end}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}


            <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-4">
                {currentEpisodes.map((e) => {
                    const isActive = playEpisodes?.id == e.id;
                    return (
                        <button
                            key={e.id}
                            onClick={() => checkShow ? handleClickEpisodes(e) : (!isLogin ? setOpenLoginDialog(true) : navigate(`/pay/${movie?.id || slug}`))}
                            className={`group relative flex w-full h-10 sm:h-11 items-center justify-center gap-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition duration-300 cursor-pointer border whitespace-nowrap overflow-hidden ${isActive
                                ? "ep-btn-active bg-linear-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-amber-300 font-black scale-105 ring-2 ring-amber-400/50 ring-offset-2 ring-offset-[#0d0f14] z-10 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                                : "bg-slate-800/80 text-slate-200 border-slate-600/50 hover:border-cyan-400 hover:bg-linear-to-r hover:from-cyan-900/40 hover:to-blue-900/40 hover:text-cyan-300 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(34,211,238,0.25)] hover:scale-[1.04] active:scale-95"
                                }`}
                        >
                            {checkShow ? (
                                <FaPlay className={`text-[10px] sm:text-xs shrink-0 transition duration-300 ${isActive ? "text-slate-950 drop-shadow-sm" : "text-amber-400/80 group-hover:text-cyan-400 group-hover:scale-110"}`} />
                            ) : (
                                <FaLock className="text-[10px] sm:text-xs shrink-0 transition duration-300 text-rose-500 group-hover:text-rose-400 group-hover:scale-110 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                            )}
                            <p className="relative inline truncate"><span className="hidden sm:inline">Tập </span>{e.numberEpisode}</p>
                        </button>
                    );
                })}
            </div>
            <ModalDetail open={openLoginDialog} handleClose={() => setOpenLoginDialog(false)} />
        </div>
    );
}

export default ListEpisodes;
