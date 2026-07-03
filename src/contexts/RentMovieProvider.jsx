import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const RentMovieContext = createContext();

const RentMovieProvider = ({ children }) => {
    const [rentMovies, setRentMovies] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime('RentMovies', (data) => {
            setRentMovies(data);
        });

        return () => unsubscribe();
    }, []);

    return (
        <RentMovieContext.Provider value={rentMovies}>
            {children}
        </RentMovieContext.Provider>
    );
};
export default RentMovieProvider;
