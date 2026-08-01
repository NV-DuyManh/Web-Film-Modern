import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

import Logo5 from '../assets/Logo5.png';
import Female from '../assets/Female.png';
import Male from '../assets/Male.png';

export const UserContext = createContext();

function UserProvider({ children }) {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Users", (userList) => {
            const processedList = userList.map(user => {
                let finalImg = user.avatarUrl;
                if (!finalImg || finalImg.includes('src/assets') || finalImg.includes('Logo')) {
                    if (user.sexID === 'Female') finalImg = Female;
                    else if (user.sexID === 'Male') finalImg = Male;
                    else finalImg = Logo5;
                }
                return { 
                    ...user, 
                    avatarUrl: finalImg
                };
            });
            setUsers(processedList);
        });
        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={users}>
            {children}
        </UserContext.Provider>
    );
}

export default UserProvider;
