import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const MovieContext = createContext();

function MovieProvider({ children }) {
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Movies", (movieList) => {
            setMovies(movieList);
        });
        return () => unsubscribe();
    }, []);

    return (
        <MovieContext.Provider value={movies}>
            {children}
        </MovieContext.Provider>
    );
}

export default MovieProvider;