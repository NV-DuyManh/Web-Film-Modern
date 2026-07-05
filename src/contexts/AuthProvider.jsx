import React, { createContext, useEffect, useState, useContext } from 'react';
import { UserContext } from './UserProvider';

export const AuthContext = createContext();
function AuthProvider({ children }) {
    const [isLogin, setIsLogin] = useState(null);
    const users = useContext(UserContext);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("isLogin"));
        if (user) {
            setIsLogin(user);
        }
    }, []);

    // Đồng bộ hoá dữ liệu session nếu có thay đổi từ DB
    useEffect(() => {
        if (isLogin && users && users.length > 0) {
            const updatedUser = users.find(u => u.id === isLogin.id);
            if (updatedUser) {
                // Kiểm tra xem có gì thay đổi không (so sánh stringify cho lẹ)
                if (JSON.stringify(updatedUser) !== JSON.stringify(isLogin)) {
                    setIsLogin(updatedUser);
                    localStorage.setItem("isLogin", JSON.stringify(updatedUser));
                }
            }
        }
    }, [users, isLogin]);

    const loginByUser = (data) => {
        localStorage.setItem("isLogin", JSON.stringify(data));
        setIsLogin(data);
    }

    const handleLogout = () => {
        localStorage.removeItem("isLogin");
        setIsLogin(null);
    }
    return (
        <AuthContext.Provider value={{ isLogin , loginByUser  , handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
