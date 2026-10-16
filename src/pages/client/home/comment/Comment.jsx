import MovieImage from '../../../../components/MovieImage';
import PlanBadge from '../../../../components/PlanBadge';
import FramedUserAvatar from '../../../../components/FramedUserAvatar';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { getUserPlanInfo } from '../../../../utils/appUtils';
import { routeSegment } from '../../../../utils/nameRoutes';
import React, { useContext, useMemo, useState } from 'react';
import { useComments, useMovies, useSubscriptions } from '../../../../hooks/useCollections';
import { FaHeart, FaBolt, FaMinus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FaArrowTrendUp } from 'react-icons/fa6';
import { BiSolidMoviePlay } from 'react-icons/bi';
import usePublicUsers from '../../../../hooks/usePublicUsers';
import { SECURE_ACCOUNTS_ENABLED } from '../../../../services/accountService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebaseConfig';
import { getObjectById } from '../../../../services/firebaseResponse';
import { timeAgo } from '../../../../utils/watchHistory';
import { useNavigate } from 'react-router-dom';

function Comment() {
    const movies = useMovies() || [];
    const comments = useComments() || [];
    const plans = useContext(PlanContext) || [];
    const { isLogin } = useContext(AuthContext) || {};
    const subscriptions = useSubscriptions() || [];
    const [publicFavorites, setPublicFavorites] = useState({});
    React.useEffect(() => {
        if (!SECURE_ACCOUNTS_ENABLED) return;
        getDoc(doc(db, 'PublicStats', 'Favorites')).then(snapshot => setPublicFavorites(snapshot.data()?.counts || {})).catch(() => {});
    }, []);
    const navigate = useNavigate();

    const [visibleCommented, setVisibleCommented] = useState(3);
    const [visibleLoved, setVisibleLoved] = useState(3);
    const [visibleComments, setVisibleComments] = useState(3);

    const latestComments = useMemo(() => {
        return [...comments]
            .sort((a, b) => {
                const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                return timeB - timeA;
            });
    }, [comments]);

    const users = usePublicUsers(latestComments.slice(0, visibleComments).map(comment => comment.userID));

    const favoriteCounts = useMemo(() => {
        if (SECURE_ACCOUNTS_ENABLED) return publicFavorites;
        const counts = {};
        users.forEach(user => {
            if (user.listFavorite && Array.isArray(user.listFavorite)) {
                user.listFavorite.forEach(movieId => {
                    counts[movieId] = (counts[movieId] || 0) + 1;
                });
            }
        });
        return counts;
    }, [users, publicFavorites]);

    const topLovedMovies = useMemo(() => {
        return [...movies].sort((a, b) => {
            const countA = favoriteCounts[a.id] || 0;
            const countB = favoriteCounts[b.id] || 0;
            return countB - countA;
        });
    }, [movies, favoriteCounts]);

    const commentCounts = useMemo(() => {
        const counts = {};
        comments.forEach(c => {
            if (c.movieID) {
                counts[c.movieID] = (counts[c.movieID] || 0) + 1;
            }
        });
        return counts;
    }, [comments]);

    const topCommentedMovies = useMemo(() => {
        return [...movies].sort((a, b) => {
            const countA = commentCounts[a.id] || 0;
            const countB = commentCounts[b.id] || 0;
            return countB - countA;
        });
    }, [movies, commentCounts]);
    return (
        <div className="w-full bg-[#0d0f14] py-8">
            <div className=" mx-auto px-4 sm:px-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-[#151720] border border-gray-800 rounded-xl overflow-hidden shadow-lg">

                    <div className="p-6 border-b lg:border-b-0 md:border-r border-gray-800 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-6 text-yellow-400 font-bold text-base tracking-wide">
                            <BiSolidMoviePlay className="text-lg" />
                            SÔI NỔI NHẤT
                        </div>

                        <div className="flex flex-col gap-5 flex-1">
                            {topCommentedMovies.slice(0, visibleCommented).map((e, index) => (
                                <div key={e.id || index} onClick={() => navigate(`/phim/${routeSegment(e)}`)} className="flex items-center gap-3 group cursor-pointer">
                                    <p className="w-5 text-gray-500 font-bold text-sm shrink-0 inline">{index + 1}</p>
                                    <FaArrowTrendUp className="w-4 text-green-500 text-sm shrink-0" />
                                    <MovieImage movie={e} kind="poster" imageWidth={300} imageHeight={450} imageType="poster" alt={e.otherName} className="w-11 h-16 object-cover rounded shrink-0 border-2 border-gray-800 transition-all duration-300 ease-out group-hover:scale-110 group-hover:border-yellow-400 group-hover:shadow-[0_0_12px_rgba(250,204,21,0.35)] motion-reduce:transition-none motion-reduce:transform-none" />
                                    <div className="flex flex-col">
                                        <h4 className="text-sm text-gray-200 line-clamp-2 leading-snug group-hover:text-yellow-400 transition-colors">
                                            {e.otherName || e.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 mt-1">{commentCounts[e.id] || 0} bình luận</p>
                                    </div>
                                </div>
                            ))}

                        </div>
                        <div className="flex gap-3 mt-6 justify-center border-t border-gray-800/50 pt-4">
                            {visibleCommented === 3 && topCommentedMovies.length > 3 && (
                                <button onClick={() => setVisibleCommented(10)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-800/40 hover:bg-yellow-500/10 border border-gray-700 hover:border-yellow-500/50 text-sm text-gray-300 hover:text-yellow-400 transition-all duration-300">
                                    <span>Xem thêm</span>
                                    <FaChevronDown className="text-xs" />
                                </button>
                            )}
                            {visibleCommented > 3 && (
                                <button onClick={() => setVisibleCommented(3)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-800/40 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/50 text-sm text-gray-300 hover:text-red-400 transition-all duration-300">
                                    <span>Thu gọn</span>
                                    <FaChevronUp className="text-xs" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-6 text-yellow-400 font-bold text-base tracking-wide">
                            <FaHeart className="text-lg" />
                            YÊU THÍCH NHẤT
                        </div>

                        <div className="flex flex-col gap-5 flex-1">
                            {topLovedMovies.slice(0, visibleLoved).map((e, index) => (
                                <div key={e.id || index} onClick={() => navigate(`/phim/${routeSegment(e)}`)} className="flex items-center gap-3 group cursor-pointer">
                                    <p className="w-5 text-gray-500 font-bold text-sm shrink-0 inline">{index + 1}</p>
                                    <FaMinus className="w-4 text-yellow-500 text-sm shrink-0" />                                    
                                    <MovieImage movie={e} kind="poster" imageWidth={300} imageHeight={450} imageType="poster" alt={e.otherName} className="w-11 h-16 object-cover rounded shrink-0 border-2 border-gray-800 transition-all duration-300 ease-out group-hover:scale-110 group-hover:border-yellow-400 group-hover:shadow-[0_0_12px_rgba(250,204,21,0.35)] motion-reduce:transition-none motion-reduce:transform-none" />
                                    <div className="flex flex-col">
                                        <h4 className="text-sm text-gray-200 line-clamp-2 leading-snug group-hover:text-yellow-400 transition-colors">
                                            {e.otherName || e.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 mt-1">{favoriteCounts[e.id] || 0} lượt thích</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6 justify-center border-t border-gray-800/50 pt-4">
                            {visibleLoved === 3 && topLovedMovies.length > 3 && (
                                <button onClick={() => setVisibleLoved(10)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-800/40 hover:bg-yellow-500/10 border border-gray-700 hover:border-yellow-500/50 text-sm text-gray-300 hover:text-yellow-400 transition-all duration-300">
                                    <span>Xem thêm</span>
                                    <FaChevronDown className="text-xs" />
                                </button>
                            )}
                            {visibleLoved > 3 && (
                                <button onClick={() => setVisibleLoved(3)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-800/40 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/50 text-sm text-gray-300 hover:text-red-400 transition-all duration-300">
                                    <span>Thu gọn</span>
                                    <FaChevronUp className="text-xs" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 md:col-span-2 lg:col-span-1 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-6 text-yellow-400 font-bold text-base tracking-wide">
                            <FaBolt className="text-lg" />
                            BÌNH LUẬN MỚI
                        </div>

                        <div className="flex flex-col gap-6 flex-1">
                            {latestComments.length > 0 ? latestComments.slice(0, visibleComments).map((comment, index) => {
                                const profile = getObjectById(users, comment.userID);
                                const user = { ...comment.author, ...profile, ...(comment.userID === isLogin?.id ? isLogin : {}) };
                                const assignedPlan = getObjectById(plans, user?.planID);
                                const plan = user?.role === 'admin'
                                    ? getUserPlanInfo(user, subscriptions, plans)
                                    : assignedPlan || (comment.author
                                        ? { name: comment.author.planName, level: comment.author.level }
                                        : getUserPlanInfo(user, subscriptions, plans));
                                const movie = getObjectById(movies, comment.movieID);
                                return (
                                    <div key={comment.id || index} onClick={() => navigate(`/phim/${routeSegment(movie)}`)} className="flex gap-3 group cursor-pointer">
                                        <FramedUserAvatar user={user} plan={plan} />
                                        <div className="flex flex-col gap-1 w-full min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-200 group-hover:text-yellow-400 transition-colors truncate max-w-32 sm:max-w-40">
                                                        {user?.name || user?.fullName || 'Ẩn danh'}
                                                    </p>
                                                    <PlanBadge plan={plan} className="shrink-0 text-[9px] uppercase" />
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-gray-400 shrink-0 whitespace-nowrap">
                                                    {comment.createdAt ? timeAgo(comment.createdAt.seconds ? comment.createdAt.seconds * 1000 : new Date(comment.createdAt).getTime()) : 'Vừa xong'}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-400 line-clamp-2 leading-snug">
                                                {comment.description}
                                            </p>
                                            <p className="text-xs text-yellow-500/80 line-clamp-1 mt-0.5 inline">
                                                » {movie?.otherName || movie?.name || 'Phim đang cập nhật'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-gray-500">Chưa có bình luận nào</p>
                            )}
                            
                        </div>
                        <div className="flex gap-3 mt-6 justify-center border-t border-gray-800/50 pt-4">
                            {visibleComments === 3 && latestComments.length > 3 && (
                                <button onClick={() => setVisibleComments(10)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-800/40 hover:bg-yellow-500/10 border border-gray-700 hover:border-yellow-500/50 text-sm text-gray-300 hover:text-yellow-400 transition-all duration-300">
                                    <span>Xem thêm</span>
                                    <FaChevronDown className="text-xs" />
                                </button>
                            )}
                            {visibleComments > 3 && (
                                <button onClick={() => setVisibleComments(3)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-800/40 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/50 text-sm text-gray-300 hover:text-red-400 transition-all duration-300">
                                    <span>Thu gọn</span>
                                    <FaChevronUp className="text-xs" />
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Comment;
