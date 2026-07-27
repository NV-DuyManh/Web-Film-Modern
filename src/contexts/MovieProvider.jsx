import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';
import Logo from '../assets/Logo.png';
import Logo5 from '../assets/Logo5.png';
import Logo6 from '../assets/Logo6.png';


export const MovieContext = createContext();

function MovieProvider({ children }) {
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Movies", (movieList) => {
            const processedList = movieList.map(movie => {
                let finalImg = movie.imgUrl;
                let finalBanner = movie.bannerUrl;

                if (!finalImg || finalImg.includes('src/assets') || finalImg.includes('Logo5')) {
                    finalImg = Logo6;
                }
                if (!finalBanner || finalBanner.includes('src/assets') || finalBanner.includes('Logo')) {
                    finalBanner = Logo5;
                }

                return {
                    ...movie,
                    imgUrl: finalImg,
                    bannerUrl: finalBanner,
                };
            });
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
