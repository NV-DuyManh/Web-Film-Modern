import { collection, doc, query, where, onSnapshot, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export function createMovieCommentService(database) {
    return {
        subscribe(movieID, onData, onError) {
            return onSnapshot(query(collection(database, 'Comments'), where('movieID', '==', movieID)),
                snapshot => onData(snapshot.docs.map(item => ({ ...item.data(), id: item.id }))), onError);
        },
        async post({ movieID, user, text, parent = null, plan }) {
            const description = text.trim();
            if (!movieID || !user?.id || !description || description.length > 1000) throw new Error('INVALID_COMMENT');
            if (parent) {
                const savedParent = await getDoc(doc(database, 'Comments', parent.id));
                if (!savedParent.exists() || savedParent.data().movieID !== movieID) throw new Error('COMMENT_PARENT_MISSING');
            }
            const reference = doc(collection(database, 'Comments'));
            const comment = {
                id: reference.id, movieID, userID: user.id, description, createdAt: Date.now(),
                parentID: parent?.id || null, likedBy: [],
                // Public display fields only. Never copy the account document.
                author: {
                    name: String(user.name || user.fullName || 'Thành viên'),
                    avatarUrl: String(user.avatarUrl || ''),
                    planID: String(user.planID || ''),
                    planName: String(plan?.name || 'Free'),
                    level: Number(plan?.level) || 0,
                },
            };
            await setDoc(reference, comment);
            return comment;
        },
        async setLiked(commentID, userID, liked) {
            if (!commentID || !userID) throw new Error('INVALID_COMMENT_LIKE');
            // Atomic union/remove preserves other people's likes and makes
            // repeated requests from the same account idempotent.
            await updateDoc(doc(database, 'Comments', commentID), { likedBy: liked ? arrayUnion(userID) : arrayRemove(userID) });
        },
    };
}
