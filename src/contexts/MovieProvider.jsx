import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';
import Logo from '../assets/Logo.png';
import Logo5 from '../assets/Logo5.png';

export const MovieContext = createContext();

function MovieProvider({ children }) {
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Movies", (movieList) => {
            const processedList = movieList.map(movie => ({
                ...movie,
                imgUrl: movie.imgUrl || Logo5,
                bannerUrl: movie.bannerUrl || Logo,
            }));
            setMovies(processedList);
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
