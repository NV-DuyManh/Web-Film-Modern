import React, { useState, useContext, useMemo } from 'react';
import { FaComment, FaPaperPlane, FaRegCommentDots } from 'react-icons/fa';
import { UserContext } from '../../../../contexts/UserProvider';
import { SubscriptionContext } from '../../../../contexts/SubscriptionProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { CommentContext } from '../../../../contexts/CommentProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { addDocument } from '../../../../services/firebaseService';
import { timeAgo } from '../../../../utils/watchHistory';
import { getUserPlanInfo, getThemeColorStyle } from '../../../../utils/themeUtils';
function CommentItem({ comment, users, subscriptions, plans }) {
    const user = getObjectById(users, comment.userID);
    const planInfo = useMemo(() => {
        return getUserPlanInfo(user, subscriptions, plans);
    }, [user, subscriptions, plans]);
    
    const badgeColor = getThemeColorStyle(planInfo.theme);

    return (
        <div className="flex gap-4 p-4 hover:bg-[#161821] transition-colors rounded-xl group">
            <div className="w-10 h-10 shrink-0">
                <img src={user?.avatarUrl} className="w-full h-full rounded-full object-cover border border-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-1.5 py-[1px] text-[10px] font-extrabold uppercase border rounded flex items-center ${badgeColor}`}>
                        {planInfo.name}
                    </span>
                    <span className="font-bold text-[14px] text-white truncate max-w-[150px] sm:max-w-[200px]">
                        {user?.name}
                    </span>

                    <span className="text-slate-500 text-[12px] ml-1">
                        {comment.createdAt ? timeAgo(comment.createdAt.seconds ? comment.createdAt.seconds * 1000 : new Date(comment.createdAt).getTime()) : 'Vừa xong'}
                    </span>
                </div>
                <div className="text-slate-300 text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                    {comment.description}
                </div>
            </div>
        </div>
    );
}

function Comment({ isLogin, onOpenLogin, movieId }) {
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const users = useContext(UserContext) || [];
    const subscriptions = useContext(SubscriptionContext) || [];
    const plans = useContext(PlanContext) || [];
    const allComments = useContext(CommentContext) || [];

    const movieComments = useMemo(() => {
        if (!movieId) return [];
        return allComments
            .filter(c => c.movieID === movieId)
            .sort((a, b) => {
                const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                return timeB - timeA;
            });
    }, [allComments, movieId]);

    const handleSendComment = async () => {
        if (!commentText.trim() || !isLogin) return;
        setIsSubmitting(true);
        try {
            const newComment = {
                userID: isLogin.id,
                movieID: movieId,
                description: commentText.trim(),
                createdAt: new Date().toISOString()
            };
            await addDocument('Comments', newComment);
            setCommentText('');
        } catch (error) {
            console.error("Error adding comment: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-5 mt-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <FaComment className="text-white text-xl" />
                <h3 className="text-xl font-bold text-white">Bình luận ({movieComments.length})</h3>
            </div>

            {!isLogin ? (
                <p className="text-slate-400 text-[14px]">
                    Vui lòng <button onClick={onOpenLogin} className="text-yellow-400 hover:text-yellow-300 font-bold hover:underline cursor-pointer">đăng nhập</button> để tham gia bình luận.
                </p>
            ) : (
                <div className="flex flex-col bg-[#131828]/60 border border-slate-800/60 rounded-2xl overflow-hidden shadow-[0_5px_20px_rgba(0,0,0,0.3)]">
                    <div className="relative">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Viết bình luận"
                            maxLength={1000}
                            className="w-full h-32 bg-transparent text-slate-200 placeholder:text-slate-500 p-4 resize-none outline-none text-[14px] custom-scrollbar"
                            disabled={isSubmitting}
                        ></textarea>
                        <div className="absolute top-4 right-4 text-[10px] text-slate-500 font-medium">
                            {commentText.length} / 1000
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end px-4 py-3 bg-[#1a2035]/80 border-t border-slate-800/60">
                        <button 
                            onClick={handleSendComment}
                            disabled={!commentText.trim() || isSubmitting}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-[13px] transition-all duration-300 ${commentText.trim() && !isSubmitting ? 'text-yellow-400 hover:bg-yellow-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
                        >
                            {isSubmitting ? 'Đang gửi...' : <>Gửi <FaPaperPlane /></>}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 mt-4">
                {movieComments.length > 0 ? (
                    movieComments.map((comment, index) => (
                        <CommentItem 
                            key={comment.id || index} 
                            comment={comment} 
                            users={users} 
                            subscriptions={subscriptions} 
                            plans={plans} 
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 bg-[#131828]/40 border border-slate-800/40 rounded-2xl">
                        <FaRegCommentDots className="text-5xl text-slate-600" />
                        <p className="text-slate-500 text-[14px]">Chưa có bình luận nào</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Comment;
