import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';
import Logo5 from '../assets/Logo5.png';
import Female from '../assets/Female.png';
import Male from '../assets/Male.png';

export const AuthorContext = createContext();

function AuthorProvider({ children }) {
    const [authors, setAuthors] = useState([]);

    useEffect(() => {
        const unsubcribe = fetchDocumentsRealtime("Authors", (authorList) => {
            const processedList = authorList.map(author => {
                let finalImg = author.imgUrl;
                if (!finalImg || finalImg.includes('src/assets') || finalImg.includes('Logo')) {
                    if (author.sexID === 'Female') finalImg = Female;
                    else if (author.sexID === 'Male') finalImg = Male;
                    else finalImg = Logo5;
                }
                return { ...author, imgUrl: finalImg };
            });
            setAuthors(processedList);
        });
        return () => unsubcribe();
    }, []);

    return (
        <AuthorContext.Provider value={authors}>
            {children}
        </AuthorContext.Provider>
    );
}

export default AuthorProvider;
