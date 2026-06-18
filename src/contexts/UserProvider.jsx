import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';

export const UserContext = createContext();

function UserProvider({ children }) {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Users", (userList) => {
            setUsers(userList);
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