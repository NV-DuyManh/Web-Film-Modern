import React, { createContext, useEffect, useState } from 'react';
import { fetchDocumentsRealtime } from '../services/firebaseService';
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import { SECURE_ACCOUNTS_ENABLED, accountRequest } from '../services/accountService';
import { resolveAccountAvatar } from '../utils/accountAvatar';

import Logo5 from '../assets/Logo5.png';
import Female from '../assets/Female.png';
import Male from '../assets/Male.png';

export const UserContext = createContext();

function UserProvider({ children }) {
    const [users, setUsers] = useState([]);
    const { isLogin } = useContext(AuthContext) || {};

    useEffect(() => {
        if (SECURE_ACCOUNTS_ENABLED) {
            let active = true;
            const reload = async () => {
                if (isLogin?.role !== 'admin') { setUsers(isLogin ? [isLogin] : []); return; }
                try { const entries = await accountRequest('directory'); if (active) setUsers(entries.map(resolveAccountAvatar)); }
                catch { if (active) setUsers([]); }
            };
            reload();
            window.addEventListener('mfilm_account_changed', reload);
            return () => { active = false; window.removeEventListener('mfilm_account_changed', reload); };
        }
    }, [isLogin]);

    useEffect(() => {
        if (SECURE_ACCOUNTS_ENABLED) return;
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
        <UserContext.Provider value={SECURE_ACCOUNTS_ENABLED && isLogin?.role !== 'admin' ? (isLogin ? [isLogin] : []) : users}>
            {children}
        </UserContext.Provider>
    );
}

export default UserProvider;
