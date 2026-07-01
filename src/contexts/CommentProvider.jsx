import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const CommentContext = createContext();

function CommentProvider({ children }) {
    const [comments, setComments] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Comments", (commentList) => {
            setComments(commentList);
        });
        return () => unsubscribe();
    }, []);

    return (
        <CommentContext.Provider value={comments}>
            {children}
        </CommentContext.Provider>
    );
}

export default CommentProvider;
