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
        // Retrieve last login fingerprint (UI-only state to detect account switch)
        let previousUid = null;
        try {
            previousUid = localStorage.getItem("mfilm_last_auth_uid");
        } catch {
            // ignore
        }

        const currentUid = fbUser?.uid || data?.firebaseUid || data?.uid || (data?.id ? String(data.id) : null);

        // Always rotate anonymous session so new user never inherits previous user's session events
        rotateSessionId();

        try {
            localStorage.setItem("isLogin", JSON.stringify(data));
            if (currentUid) {
                localStorage.setItem("mfilm_last_auth_uid", currentUid);
            }
        } catch {
            // ignore storage errors
        }

        if (fbUser) {
            setFirebaseUser(fbUser);
            setFirebaseAuthReady(true);
        }
        setIsLogin(data);
        setAuthEpoch(prev => prev + 1);

        // Section 10 UX Requirement: When a DIFFERENT account logs in,
        // perform hard reset to Home top: reload page and start at scroll 0.
        // If this is the same account relogin or first login, do NOT trigger hard reload loop.
        if (previousUid && currentUid && previousUid !== currentUid) {
            if (typeof window !== 'undefined' && window.location) {
                window.location.assign('/');
                return;
            }
        }
    }, []);

    const handleLogout = useCallback(async () => {
        // 1. Clear persisted session
        try {
            localStorage.removeItem("isLogin");
            // NOTE (Prompt Section 11): Do NOT delete the UI-only 'mfilm_last_auth_uid'
            // fingerprint on logout so that the subsequent login can detect A -> B switch.
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
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
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
