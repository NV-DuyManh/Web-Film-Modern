import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const TopicContext = createContext();

function TopicProvider({ children }) {
    const [topics, setTopics] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Topics", (data) => {
            setTopics(data);
        });
        
        return () => unsubscribe();
    }, []);

    return (
        <TopicContext.Provider value={topics}>
            {children}
        </TopicContext.Provider>
    );
}

export default TopicProvider;
