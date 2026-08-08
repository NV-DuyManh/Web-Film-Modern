import React, { useContext, useMemo } from 'react';
import { FaHeart, FaBolt, FaMinus } from 'react-icons/fa';
import { FaArrowTrendUp } from 'react-icons/fa6';
import { BiSolidMoviePlay } from 'react-icons/bi';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { CommentContext } from '../../../../contexts/CommentProvider';
import { UserContext } from '../../../../contexts/UserProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { timeAgo } from '../../../../utils/watchHistory';
import { useNavigate } from 'react-router-dom';

function Comment() {
    const movies = useContext(MovieContext) || [];
    const comments = useContext(CommentContext) || [];
    const users = useContext(UserContext) || [];
    const navigate = useNavigate();

    const latestComments = useMemo(() => {
        return [...comments]
            .sort((a, b) => {
                const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                return timeB - timeA;
            })
            .slice(0, 3);
    }, [comments]);

    const favoriteCounts = useMemo(() => {
        const counts = {};
        users.forEach(user => {
            if (user.listFavorite && Array.isArray(user.listFavorite)) {
                user.listFavorite.forEach(movieId => {
                    counts[movieId] = (counts[movieId] || 0) + 1;
                });
            }
        });
        return counts;
    }, [users]);

    const topLovedMovies = useMemo(() => {
        return [...movies].sort((a, b) => {
            const countA = favoriteCounts[a.id] || 0;
            const countB = favoriteCounts[b.id] || 0;
            return countB - countA;
        }).slice(0, 3);
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
        }).slice(0, 3);
    }, [movies, commentCounts]);
    return (
        <div className="w-full bg-[#0d0f14] py-8">
            <div className=" mx-auto px-4 sm:px-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-[#151720] border border-gray-800 rounded-xl overflow-hidden shadow-lg">

                    <div className="p-6 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-6 text-[#facc15] font-bold text-[15px] tracking-wide">
                            <BiSolidMoviePlay className="text-lg" />
                            SÔI NỔI NHẤT
                        </div>

                        <div className="flex flex-col gap-5 flex-1">
                            {topCommentedMovies.map((e, index) => (
                                <div key={e.id || index} onClick={() => navigate(`/phim/${e.slug || e.id}`)} className="flex items-center gap-3 group cursor-pointer">
                                    <p className="w-5 text-gray-500 font-bold text-sm shrink-0 inline">{index + 1}</p>
                                    <FaArrowTrendUp className="w-4 text-green-500 text-sm shrink-0" />
                                    <img src={e.imgUrl} className="w-11 h-16 object-cover rounded shrink-0 border border-gray-800 group-hover:border-gray-600 transition-colors" />
                                    <div className="flex flex-col">
                                        <h4 className="text-[13px] text-gray-200 line-clamp-2 leading-snug group-hover:text-yellow-400 transition-colors">
                                            {e.otherName || e.name}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 mt-1">{commentCounts[e.id] || 0} bình luận</p>
                                    </div>
                                </div>
                            ))}

                        </div>
                        <button className="mt-6 text-[13px] text-white flex justify-start transition-colors font-medium hover:text-yellow-400">Xem thêm</button>
                    </div>

                    <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-6 text-[#facc15] font-bold text-[15px] tracking-wide">
                            <FaHeart className="text-lg" />
                            YÊU THÍCH NHẤT
                        </div>

                        <div className="flex flex-col gap-5 flex-1">
                            {topLovedMovies.map((e, index) => (
                                <div key={e.id || index} onClick={() => navigate(`/phim/${e.slug || e.id}`)} className="flex items-center gap-3 group cursor-pointer">
                                    <p className="w-5 text-gray-500 font-bold text-sm shrink-0 inline">{index + 1}</p>
                                    <FaMinus className="w-4 text-yellow-500 text-sm shrink-0" />                                    
                                    <img src={e.imgUrl} className="w-11 h-16 object-cover rounded shrink-0 border border-gray-800 group-hover:border-gray-600 transition-colors" />
                                    <div className="flex flex-col">
                                        <h4 className="text-[13px] text-gray-200 line-clamp-2 leading-snug group-hover:text-yellow-400 transition-colors">
                                            {e.otherName || e.name}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 mt-1">{favoriteCounts[e.id] || 0} lượt thích</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-6 text-[13px] text-white flex justify-start transition-colors font-medium hover:text-yellow-400">Xem thêm</button>
                    </div>

                    <div className="p-6 md:col-span-2 lg:col-span-1 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-6 text-[#facc15] font-bold text-[15px] tracking-wide">
                            <FaBolt className="text-lg" />
                            BÌNH LUẬN MỚI
                        </div>

                        <div className="flex flex-col gap-6 flex-1">
                            {latestComments.length > 0 ? latestComments.map((comment, index) => {
                                const user = getObjectById(users, comment.userID);
                                const movie = getObjectById(movies, comment.movieID);
                                return (
                                    <div key={comment.id || index} onClick={() => navigate(`/phim/${comment.movieID}`)} className="flex gap-3 group cursor-pointer">
                                        <img src={user?.avatarUrl} className="w-10 h-10 rounded-full shrink-0 border border-gray-700 object-cover" />
                                        <div className="flex flex-col gap-1 w-full">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[13px] font-bold text-gray-200 group-hover:text-yellow-400 transition-colors inline">
                                                    {user?.name || 'Ẩn danh'}
                                                </p>
                                                <p className="text-[11px] text-gray-500 inline">
                                                    {comment.createdAt ? timeAgo(comment.createdAt.seconds ? comment.createdAt.seconds * 1000 : new Date(comment.createdAt).getTime()) : 'Vừa xong'}
                                                </p>
                                            </div>
                                            <p className="text-[13px] text-gray-400 line-clamp-2 leading-snug">
                                                {comment.description}
                                            </p>
                                            <p className="text-[11px] text-yellow-500/80 line-clamp-1 mt-0.5 inline">
                                                » {movie?.otherName || movie?.name || 'Phim đang cập nhật'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-gray-500">Chưa có bình luận nào</p>
                            )}
                            
                        </div>
                        <button className="mt-6 text-[13px] text-white flex justify-start transition-colors font-medium hover:text-yellow-400">Xem thêm</button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Comment;
