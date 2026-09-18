import React, { createContext, useEffect, useState, useContext, useCallback, useRef } from 'react';
import { UserContext } from './UserProvider';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { rotateSessionId } from '../services/eventTracker';

export const AuthContext = createContext();

function AuthProvider({ children }) {
    const [isLogin, setIsLogin] = useState(null);
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
    // authEpoch increments on every login/logout/account-switch.
    // ForYou captures the epoch when it starts a fetch; if epoch has changed by the time
    // the response arrives, the stale response is discarded — prevents Account A data
    // overwriting Account B after rapid account switches.
    const [authEpoch, setAuthEpoch] = useState(0);
    const users = useContext(UserContext);
    const navigate = useNavigate();

    // 1. Listen for Firebase Auth initialization & session restoration
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            setFirebaseAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    // 2. Hydrate custom Firestore user session from localStorage
    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem("isLogin"));
            if (user) {
                setIsLogin(user);
            }
        } catch {
            localStorage.removeItem("isLogin");
        }
    }, []);

    useEffect(() => {
        if (isLogin && users && users.length > 0) {
            const updatedUser = users.find(u => u.id === isLogin.id);
            if (updatedUser) {
                if (JSON.stringify(updatedUser) !== JSON.stringify(isLogin)) {
                    setIsLogin(updatedUser);
                    try {
                        localStorage.setItem("isLogin", JSON.stringify(updatedUser));
                    } catch {
                        // ignore storage write errors
                    }
                }
            }
        }
    }, [users, isLogin]);

    const loginByUser = useCallback((data, fbUser = null) => {
        // If switching accounts (not first login), rotate session so the new user
        // does not inherit the previous user's anonymous behavior history.
        if (isLogin && isLogin.id !== data?.id) {
            rotateSessionId();
        }
        try {
            localStorage.setItem("isLogin", JSON.stringify(data));
        } catch {
            // ignore storage errors
        }
        if (fbUser) {
            setFirebaseUser(fbUser);
            setFirebaseAuthReady(true);
        }
        setIsLogin(data);
        setAuthEpoch(prev => prev + 1);
    }, [isLogin]);

    const handleLogout = useCallback(async () => {
        // 1. Clear persisted session
        try {
            localStorage.removeItem("isLogin");
        } catch {
            // ignore
        }

        // 2. Sign out Firebase Auth (Google SSO and email/password Firebase Auth sessions)
        try {
            const auth = getAuth();
            if (auth.currentUser) {
                await signOut(auth);
            }
        } catch {
            // Non-fatal: continue with logout even if Firebase signOut fails
        }

        // 3. Rotate anonymous sessionId to prevent session contamination for the next user
        rotateSessionId();

        // 4. Clear local state and increment epoch (causes ForYou to discard in-flight requests)
        setFirebaseUser(null);
        setIsLogin(null);
        setAuthEpoch(prev => prev + 1);

        navigate("/");
    }, [navigate]);

    const [globalAvatarPreview, setGlobalAvatarPreview] = useState(null);

    return (
        <AuthContext.Provider value={{
            isLogin,
            firebaseUser,
            firebaseAuthReady,
            loginByUser,
            handleLogout,
            authEpoch,
            globalAvatarPreview,
            setGlobalAvatarPreview
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
