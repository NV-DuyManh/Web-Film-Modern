import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const EpisodeContext = createContext();

function EpisodeProvider({ children }) {
    const [episodes, setEpisodes] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Episodes", (episodeList) => {
            setEpisodes(episodeList);
        });
        return () => unsubscribe();
    }, []);

    return (
        <EpisodeContext.Provider value={episodes}>
            {children}
        </EpisodeContext.Provider>
    );
}

export default EpisodeProvider;