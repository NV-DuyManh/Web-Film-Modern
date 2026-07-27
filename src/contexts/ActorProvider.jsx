import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

import Logo5 from '../assets/Logo5.png';
import Female from '../assets/Female.png';
import Male from '../assets/Male.png';

export const ActorContext = createContext();
function ActorProvider({ children }) {
    const [actors, setActors] = useState([]);

    useEffect(() => {
        const unsubcribe = fetchDocumentsRealtime("Actors", (actorList) => {
            const processedList = actorList.map(actor => {
                let finalImg = actor.imgUrl;
                if (!finalImg || finalImg.includes('src/assets') || finalImg.includes('Logo')) {
                    if (actor.sexID === 'Female') finalImg = Female;
                    else if (actor.sexID === 'Male') finalImg = Male;
                    else finalImg = Logo5;
                }
                return { ...actor, imgUrl: finalImg };
            });
            setActors(processedList);
        });
        return () => unsubcribe();
    }, []);

    return (
        <ActorContext.Provider value={actors}>
            {children}
        </ActorContext.Provider>
    );
}

export default ActorProvider;
