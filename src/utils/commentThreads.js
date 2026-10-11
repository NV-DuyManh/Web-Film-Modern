export function commentTime(comment) {
    const value = comment?.createdAt;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value?.seconds === 'number') return value.seconds * 1000;
    if (typeof value === 'number') return value;
    return Date.parse(value) || 0;
}

export function commentLikes(comment) {
    return [...new Set((Array.isArray(comment?.likedBy) ? comment.likedBy : []).filter(id => typeof id === 'string' && id))];
}

// Replies stay one level deep visually, but keep the exact person being replied
// to. Old comments and replies whose parent was removed remain visible.
export function buildCommentThreads(comments, sort = 'newest') {
    const byId = new Map(comments.filter(c => c.id).map(c => [c.id, c]));
    const rootFor = comment => {
        let current = comment;
        const seen = new Set([comment.id]);
        while (current.parentID && byId.has(current.parentID)) {
            if (seen.has(current.parentID)) return comment;
            seen.add(current.parentID);
            current = byId.get(current.parentID);
        }
        return current;
    };
    const threads = new Map();
    for (const comment of byId.values()) {
        const root = rootFor(comment);
        if (!threads.has(root.id)) threads.set(root.id, { comment: root, replies: [] });
        if (root.id !== comment.id) threads.get(root.id).replies.push(comment);
    }
    const rows = [...threads.values()];
    for (const row of rows) row.replies.sort((a, b) => commentTime(a) - commentTime(b) || a.id.localeCompare(b.id));
    return rows.sort((a, b) => {
        if (sort === 'popular') {
            const difference = commentLikes(b.comment).length - commentLikes(a.comment).length;
            if (difference) return difference;
        }
        return commentTime(b.comment) - commentTime(a.comment) || a.comment.id.localeCompare(b.comment.id);
    });
}

export function commentErrorMessage(error) {
    const code = String(error?.code || '');
    if (code.includes('resource-exhausted')) return 'Firebase đang hết lượt sử dụng miễn phí. Bạn thử lại sau nhé; nội dung đang viết vẫn được giữ.';
    if (code.includes('permission-denied') || code.includes('unauthenticated')) return 'Không thể lưu lúc này. Bạn đăng nhập lại rồi thử nhé.';
    if (code.includes('unavailable') || code.includes('deadline-exceeded')) return 'Kết nối đang gián đoạn. Bạn kiểm tra mạng rồi thử lại nhé.';
    return error?.message === 'COMMENT_PARENT_MISSING' ? 'Bình luận này đã bị xóa. Bạn có thể gửi một bình luận mới.' : 'Chưa lưu được thay đổi. Bạn thử lại nhé.';
}
