import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

import Logo5 from '../assets/Logo5.png';
import Female from '../assets/Female.png';
import Male from '../assets/Male.png';

export const CharacterContext = createContext();

function CharacterProvider({ children }) {
    const [characters, setCharacters] = useState([]);

    useEffect(() => {
        const unsubcribe = fetchDocumentsRealtime("Characters", (characterList) => {
            const processedList = characterList.map(character => {
                let finalImg = character.imgUrl;
                if (!finalImg || finalImg.includes('src/assets') || finalImg.includes('Logo')) {
                    if (character.sexID === 'Female') finalImg = Female;
                    else if (character.sexID === 'Male') finalImg = Male;
                    else finalImg = Logo5;
                }
                return { ...character, imgUrl: finalImg };
            });
            setCharacters(processedList);
        });
        return () => unsubcribe();
    }, []);

    return (
        <CharacterContext.Provider value={characters}>
            {children}
        </CharacterContext.Provider>
    );
}

export default CharacterProvider;
