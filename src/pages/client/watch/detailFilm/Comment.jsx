import React, { useContext, useMemo, useState } from 'react';
import { FaCommentDots, FaPaperPlane, FaRegCommentDots, FaRegThumbsUp, FaThumbsUp, FaReply, FaTimes, FaChevronDown } from 'react-icons/fa';
import { useSubscriptions } from '../../../../hooks/useCollections';
import usePublicUsers from '../../../../hooks/usePublicUsers';
import useMovieComments, { movieCommentService } from '../../../../hooks/useMovieComments';
import { PlanContext } from '../../../../contexts/PlanProvider';
import PlanBadge from '../../../../components/PlanBadge';
import Avatar from '../../../../components/FramedUserAvatar';
import { getObjectById } from '../../../../services/firebaseResponse';
import { getUserPlanInfo } from '../../../../utils/appUtils';
import { resolveCommentMember } from '../../../../utils/membership';
import { buildCommentThreads, commentLikes, commentTime, commentErrorMessage } from '../../../../utils/commentThreads';
import { timeAgo } from '../../../../utils/watchHistory';
import { trackEvent } from '../../../../services/eventTracker';

function Composer({ value, onChange, onSend, busy, user, plan, replyTo, onCancel }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#141c2e] overflow-hidden focus-within:border-cyan-400/50 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.06)] transition-colors">
            {replyTo && <div className="px-4 pt-3 flex items-center justify-between gap-2 text-xs text-cyan-300"><span>Đang trả lời <strong>{replyTo}</strong></span><button type="button" onClick={onCancel} aria-label="Hủy trả lời" className="p-1.5 rounded-md hover:bg-white/10"><FaTimes /></button></div>}
            <div className="flex gap-3 p-4">
                <Avatar user={user} plan={plan} small={Boolean(replyTo)} />
                <div className="flex-1 min-w-0">
                    {!replyTo && <div className="flex items-center gap-2 mb-2"><span className="text-sm font-semibold text-white truncate">{user?.name || user?.fullName || 'Thành viên'}</span><PlanBadge plan={plan} className="text-[9px] uppercase" /></div>}
                    <textarea aria-label={replyTo ? `Trả lời ${replyTo}` : 'Viết bình luận'} value={value} onChange={event => onChange(event.target.value)} placeholder={replyTo ? 'Viết lời trả lời của bạn...' : 'Chia sẻ cảm nhận của bạn về bộ phim...'} maxLength={1000} disabled={busy}
                        className={`w-full ${replyTo ? 'min-h-18' : 'min-h-22'} resize-y bg-transparent outline-none text-sm leading-6 text-slate-200 placeholder:text-slate-500`} />
                </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/5 bg-black/10">
                <span className="text-[11px] text-slate-500 tabular-nums">{value.length}/1000</span>
                <button type="button" onClick={onSend} disabled={!value.trim() || busy} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed">
                    {busy ? 'Đang gửi...' : <>{replyTo ? 'Gửi trả lời' : 'Gửi bình luận'}<FaPaperPlane className="text-[11px]" /></>}
                </button>
            </div>
        </div>
    );
}

function CommentItem({ comment, user, plan, isLogin, onLike, onReply, liking, replyName, isReply }) {
    const likes = commentLikes(comment);
    const liked = Boolean(isLogin?.id && likes.includes(isLogin.id));
    return (
        <div className="flex gap-3 py-4">
            <Avatar user={user} plan={plan} small={isReply} />
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-sm text-slate-100 truncate max-w-52">{user?.name || user?.fullName || 'Thành viên'}</span>
                    <PlanBadge plan={plan} className="text-[9px] uppercase tracking-wide" />
                    <span className="text-[11px] text-slate-500" title={commentTime(comment) ? new Date(commentTime(comment)).toLocaleString('vi-VN') : undefined}>{timeAgo(commentTime(comment)) || 'Vừa xong'}</span>
                </div>
                {isReply && replyName && <p className="text-[11px] text-slate-500 mt-1">Trả lời <span className="text-cyan-400">@{replyName}</span></p>}
                <p className="text-sm text-slate-300 leading-6 whitespace-pre-wrap wrap-break-word mt-2">{comment.description}</p>
                <div className="flex items-center gap-1 mt-2 -ml-2">
                    <button type="button" onClick={() => onLike(comment, !liked)} disabled={liking} aria-pressed={liked} aria-label={`${liked ? 'Bỏ thích' : 'Thích'} bình luận của ${user?.name || 'Thành viên'}`}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition disabled:opacity-50 ${liked ? 'text-cyan-300 bg-cyan-400/10' : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'}`}>
                        {liked ? <FaThumbsUp /> : <FaRegThumbsUp />}<span>{liking ? 'Đang lưu...' : 'Thích'}{likes.length > 0 && ` · ${likes.length}`}</span>
                    </button>
                    <button type="button" onClick={() => onReply(comment)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-white/5 transition"><FaReply />Trả lời</button>
                </div>
            </div>
        </div>
    );
}

function CommentSection({ isLogin, onOpenLogin, movieId }) {
    const [text, setText] = useState('');
    const [drafts, setDrafts] = useState({});
    const [submitting, setSubmitting] = useState(null);
    const [liking, setLiking] = useState({});
    const [replyTo, setReplyTo] = useState(null);
    const [expanded, setExpanded] = useState({});
    const [sort, setSort] = useState('newest');
    const [visible, setVisible] = useState(10);
    const [error, setError] = useState('');
    const subscriptions = useSubscriptions() || [];
    const plans = useContext(PlanContext) || [];
    const { items: comments, loading, error: loadError } = useMovieComments(movieId);
    const users = usePublicUsers(comments.map(comment => comment.userID));
    const threads = useMemo(() => buildCommentThreads(comments, sort), [comments, sort]);
    const currentPlan = getUserPlanInfo(isLogin, subscriptions, plans);
    const displayUser = comment => {
        const profile = getObjectById(users, comment.userID);
        return resolveCommentMember(comment, profile).user;
    };
    const displayPlan = comment => {
        return resolveCommentMember(comment, getObjectById(users, comment.userID)).plan;
    };
    const askLogin = () => { if (!isLogin?.id) { onOpenLogin?.(); return true; } return false; };
    const handleSend = async parent => {
        if (askLogin() || submitting) return;
        const value = parent ? drafts[parent.id] || '' : text;
        if (!value.trim()) return;
        setSubmitting(parent?.id || 'new'); setError('');
        try {
            await movieCommentService.post({ movieID: movieId, user: isLogin, text: value, parent, plan: currentPlan });
            trackEvent('comment', movieId, '', { length: value.trim().length, reply: Boolean(parent) });
            if (parent) {
                const thread = threads.find(row => row.comment.id === parent.id || row.replies.some(reply => reply.id === parent.id));
                if (thread) setExpanded(previous => ({ ...previous, [thread.comment.id]: true }));
                setDrafts(previous => ({ ...previous, [parent.id]: '' })); setReplyTo(null);
            } else setText('');
        } catch (failure) { setError(commentErrorMessage(failure)); }
        finally { setSubmitting(null); }
    };
    const handleLike = async (comment, liked) => {
        if (askLogin() || liking[comment.id]) return;
        setLiking(previous => ({ ...previous, [comment.id]: true })); setError('');
        try { await movieCommentService.setLiked(comment.id, isLogin.id, liked); }
        catch (failure) { setError(commentErrorMessage(failure)); }
        finally { setLiking(previous => ({ ...previous, [comment.id]: false })); }
    };
    const handleReply = comment => { if (!askLogin()) { setError(''); setReplyTo(previous => previous?.id === comment.id ? null : comment); } };
    const renderItem = (comment, isReply = false) => <React.Fragment key={comment.id}>
        <CommentItem comment={comment} user={displayUser(comment)} plan={displayPlan(comment)} isLogin={isLogin} onLike={handleLike} onReply={handleReply} liking={liking[comment.id]} isReply={isReply}
            replyName={comments.find(parent => parent.id === comment.parentID) ? displayUser(comments.find(parent => parent.id === comment.parentID)).name : null} />
        {replyTo?.id === comment.id && <div className="mb-4 sm:ml-11"><Composer value={drafts[comment.id] || ''} onChange={value => setDrafts(previous => ({ ...previous, [comment.id]: value }))} onSend={() => handleSend(comment)} busy={submitting === comment.id} user={isLogin} plan={currentPlan} replyTo={displayUser(comment).name} onCancel={() => setReplyTo(null)} /></div>}
    </React.Fragment>;
    return (
        <section aria-label="Bình luận phim" className="mt-8 rounded-3xl border border-white/8 bg-[#101726]/90 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><FaCommentDots className="text-lg" /></div><div><h3 className="text-lg sm:text-xl font-bold text-white">Bình luận <span className="ml-1 text-sm font-medium text-slate-500">({comments.length})</span></h3><p className="text-xs text-slate-500 mt-0.5">Cùng bàn luận về bộ phim</p></div></div>
                <div className="flex gap-1 rounded-xl border border-white/5 bg-black/20 p-1">{[['newest', 'Mới nhất'], ['popular', 'Nhiều lượt thích']].map(([value, label]) => <button key={value} type="button" aria-pressed={sort === value} onClick={() => { setSort(value); setVisible(10); }} className={`px-3 py-2 text-[11px] font-semibold rounded-lg transition ${sort === value ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>{label}</button>)}</div>
            </div>
            {isLogin ? <Composer value={text} onChange={setText} onSend={() => handleSend(null)} busy={submitting === 'new'} user={isLogin} plan={currentPlan} /> : <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-700/70 bg-white/2 p-4"><p className="text-sm text-slate-400">Đăng nhập để chia sẻ cảm nhận, thích và trả lời.</p><button type="button" onClick={onOpenLogin} className="px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-300 text-xs font-bold hover:bg-cyan-400/20">Đăng nhập</button></div>}
            {(error || loadError) && <p role="alert" className="my-4 px-4 py-3 rounded-xl border border-rose-400/20 bg-rose-400/5 text-rose-300 text-xs leading-5">{error || 'Chưa tải được bình luận mới nhất. Bạn thử tải lại trang sau nhé.'}</p>}
            <div aria-live="polite" className="mt-5 space-y-3">
                {threads.slice(0, visible).map(({ comment, replies }) => <article key={comment.id} className="rounded-2xl border border-white/5 bg-[#151e2e]/60 px-4">
                    {renderItem(comment)}
                    {replies.length > 0 && <div className="ml-3 sm:ml-5 pl-4 sm:pl-5 border-l border-cyan-400/15 mb-2">{(expanded[comment.id] ? replies : replies.slice(0, 2)).map(reply => renderItem(reply, true))}{replies.length > 2 && <button type="button" onClick={() => setExpanded(previous => ({ ...previous, [comment.id]: !previous[comment.id] }))} className="flex gap-2 items-center text-xs font-semibold text-cyan-400 hover:text-cyan-200 pb-3"><FaChevronDown className={expanded[comment.id] ? 'rotate-180' : ''} />{expanded[comment.id] ? 'Thu gọn trả lời' : `Xem thêm ${replies.length - 2} trả lời`}</button>}</div>}
                </article>)}
                {loading && <div role="status" className="py-8 text-center text-sm text-slate-500">Đang tải bình luận...</div>}
                {!loading && !loadError && comments.length === 0 && <div className="py-10 text-center"><FaRegCommentDots className="mx-auto text-3xl text-slate-600 mb-3" /><p className="text-sm text-slate-400">Chưa có bình luận nào</p><p className="text-xs text-slate-600 mt-1">Hãy là người đầu tiên chia sẻ cảm nhận.</p></div>}
            </div>
            {threads.length > visible && <button type="button" onClick={() => setVisible(previous => previous + 10)} className="w-full mt-4 border border-white/10 rounded-xl py-3 text-xs font-semibold text-slate-300 hover:bg-white/5">Xem thêm bình luận</button>}
        </section>
    );
}

export default function Comment(props) { return <CommentSection key={props.movieId} {...props} />; }
