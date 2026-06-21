import React, { createContext, useEffect, useState } from 'react';


export const AuthContext = createContext();
function AuthProvider({ children }) {
    const [isLogin, setIsLogin] = useState(null);
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("isLogin"));
        if (user) {
            setIsLogin(user);
        }
    }, []);

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