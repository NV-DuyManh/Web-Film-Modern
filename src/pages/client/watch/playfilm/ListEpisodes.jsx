import { normalizeEpisodes, episodeInfo, episodeKey, episodeLabel } from '../../../../utils/episodes';
import { routeSegment, findRouteEntity } from '../../../../utils/nameRoutes';
import React, { useContext, useMemo, useState } from 'react';
import { useRentMovies, useSubscriptions, useMovies } from '../../../../hooks/useCollections';
import { FaLock } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { getExpiryDate, getUserPlanInfo, isSingleMovie } from '../../../../utils/appUtils';
import ModalDetail from '../detailFilm/ModalDetail';

function ListEpisodes({ episodeShow, playEpisodes, handleClickEpisodes }) {
    const { slug } = useParams();
    const [chosenRange, setChosenRange] = useState(null);
    const [openLoginDialog, setOpenLoginDialog] = useState(false);
    const CHUNK_SIZE = 80;
    const navigate = useNavigate();
    const { isLogin } = useContext(AuthContext);
    const subscriptions = useSubscriptions();
    const movies = useMovies();
    const plans = useContext(PlanContext);
    const allRent = useRentMovies();

    const movie = useMemo(() => {
        let found = findRouteEntity(movies, slug);
        if (!found) {
            const ep = episodeShow?.find(e => e.id == slug);
            if (ep) {
                found = getObjectById(movies, ep.movieID);
            }
        }
        return found;
    }, [movies, episodeShow, slug]);

    const categoryTypes = useContext(CategoryTypeContext);
    const isSingle = isSingleMovie(movie, categoryTypes);

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

    const uniqueEpisodes = useMemo(() => normalizeEpisodes(episodeShow), [episodeShow]);

    const hasRanges = uniqueEpisodes.length > CHUNK_SIZE;
    const ranges = useMemo(() => {
        if (!hasRanges) return [];
        const r = [];
        for (let i = 0; i < uniqueEpisodes.length; i += CHUNK_SIZE) {
            r.push(uniqueEpisodes.slice(i, i + CHUNK_SIZE));
        }
        return r;
    }, [uniqueEpisodes, hasRanges, CHUNK_SIZE]);

    const activeKey = episodeKey(playEpisodes);
    const activeRange = Math.max(0, ranges.findIndex(chunk => chunk.some(ep => episodeKey(ep) === activeKey)));
    const requestedRange = chosenRange?.movieId === movie?.id && chosenRange?.activeKey === activeKey ? chosenRange.index : activeRange;
    const selectedRange = Math.min(requestedRange, Math.max(0, ranges.length - 1));
    const currentEpisodes = hasRanges ? ranges[selectedRange] : uniqueEpisodes;

    if (!episodeShow || episodeShow.length === 0 || uniqueEpisodes.length === 0) {
        return (
            <div className="py-8 text-center text-slate-400 bg-[#0d121f] rounded-xl border border-slate-700/80 my-2">
                <p className="text-sm font-medium">Danh sách tập phim đang được cập nhật...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 py-1">

            {hasRanges && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 pb-3 border-b border-slate-700/60 w-full min-w-0">
                    <p className="text-xs font-black bg-linear-to-r from-amber-400 to-yellow-500 text-transparent bg-clip-text uppercase tracking-widest shrink-0 inline drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] mr-1 sm:pt-2">
                        Chọn phần:
                    </p>
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0" role="group" aria-label="Chọn khoảng tập phim">
                        {ranges.map((chunk, idx) => {
                            const startEp = episodeInfo(chunk[0])?.number ?? (idx * CHUNK_SIZE + 1);
                            const endEp = episodeInfo(chunk[chunk.length - 1])?.end ?? Math.min((idx + 1) * CHUNK_SIZE, uniqueEpisodes.length);
                            const isSelected = selectedRange === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setChosenRange({ index: idx, movieId: movie?.id, activeKey })}
                                    aria-pressed={isSelected}
                                    aria-label={`Tập ${startEp} đến ${endEp}`}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition duration-300 cursor-pointer whitespace-nowrap border ${isSelected
                                        ? "bg-linear-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                        : "bg-[#0d121f] text-slate-300 hover:text-white hover:bg-[#161d30] border-slate-700/80"
                                        }`}
                                >
                                    {startEp}–{endEp}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}


            <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 5.5rem), 1fr))" }}>
                {currentEpisodes.map((e) => {
                    const isActive = episodeKey(playEpisodes) === episodeKey(e);
                    const label = episodeLabel(e, isSingle);
                    return (
                        <button
                            key={e.id}
                            onClick={() => checkShow ? handleClickEpisodes(e) : (!isLogin ? setOpenLoginDialog(true) : navigate(`/pay/${routeSegment(movie)}`))}
                            aria-label={label === 'Full' ? 'Xem phim đầy đủ' : `Tập ${label}`}
                            aria-current={isActive ? 'true' : undefined}
                            title={label === 'Full' ? 'Full' : `Tập ${label}`}
                            className={`group relative flex w-full min-w-0 h-10 sm:h-11 items-center justify-center px-2 rounded-xl text-xs sm:text-sm font-bold tabular-nums transition-colors cursor-pointer border whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 ${isActive
                                ? "ep-btn-active bg-linear-to-r from-amber-400 to-yellow-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/40"
                                : "bg-slate-800/80 text-slate-200 border-slate-600/50 hover:border-amber-400/70 hover:bg-amber-400/10 hover:text-amber-300"
                                }`}
                        >
                            {!checkShow && <FaLock aria-hidden="true" className="absolute top-1 right-1 text-[8px] text-rose-400" />}
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>
            <ModalDetail open={openLoginDialog} handleClose={() => setOpenLoginDialog(false)} />
        </div>
    );
}

export default ListEpisodes;
