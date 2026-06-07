import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const ShowTimeContext = createContext();

function ShowTimeProvider({ children }) {
    const [showTimes, setShowTimes] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("ShowTimes", (showTimeList) => {
            setShowTimes(showTimeList);
        });
        return () => unsubscribe();
    }, []);

    return (
        <ShowTimeContext.Provider value={showTimes}>
            {children}
        </ShowTimeContext.Provider>
    );
}

export default ShowTimeProvider;