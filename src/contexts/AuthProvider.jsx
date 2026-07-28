import React, { createContext, useEffect, useState, useContext } from 'react';
import { UserContext } from './UserProvider';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();
function AuthProvider({ children }) {
    const [isLogin, setIsLogin] = useState(null);
    const users = useContext(UserContext);
    const navigate = useNavigate();
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("isLogin"));
        if (user) {
            setIsLogin(user);
        }
    }, []);

    useEffect(() => {
        if (isLogin && users && users.length > 0) {
            const updatedUser = users.find(u => u.id === isLogin.id);
            if (updatedUser) {
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
        navigate("/");
    }
    return (
        <AuthContext.Provider value={{ isLogin , loginByUser  , handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
