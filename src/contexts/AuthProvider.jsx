import React, { createContext, useEffect, useState, useCallback } from 'react';
import { SECURE_ACCOUNTS_ENABLED, accountRequest } from '../services/accountService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { rotateSessionId } from '../services/eventTracker';
import { startProtectedResumeSync, flushActiveResumeSync } from '../services/resumeSyncService';

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

    const navigate = useNavigate();
    useEffect(() => {
        if (!isLogin?.id || !firebaseUser?.uid || !firebaseUser.email || firebaseUser.email.toLowerCase() !== isLogin.email?.toLowerCase()) return;
        return startProtectedResumeSync(isLogin.id, firebaseUser.uid);
    }, [isLogin?.id, isLogin?.email, firebaseUser?.uid, firebaseUser?.email]);

    useEffect(() => {
        let generation = 0;
        const load = async user => {
            const current = ++generation;
            setFirebaseUser(user);
            if (SECURE_ACCOUNTS_ENABLED) {
                let profile = null;
                if (user) {
                    try { profile = await accountRequest('me');
                        const { resolveAccountAvatar } = await import('../utils/accountAvatar');
                        profile = resolveAccountAvatar(profile); }
                    catch { /* An unverified or revoked session must never restore an admin role. */ }
                }
                if (current !== generation) return;
                setIsLogin(profile);
                if (profile) localStorage.setItem('isLogin', JSON.stringify(profile));
                else localStorage.removeItem('isLogin');
            }
            setFirebaseAuthReady(true);
        };
        const unsubscribe = onAuthStateChanged(getAuth(), load);
        const reload = () => load(getAuth().currentUser);
        window.addEventListener('mfilm_account_changed', reload);
        return () => { generation++; unsubscribe(); window.removeEventListener('mfilm_account_changed', reload); };
    }, []);

    useEffect(() => {
        if (SECURE_ACCOUNTS_ENABLED) { localStorage.removeItem('isLogin'); return; }
        try { setIsLogin(JSON.parse(localStorage.getItem('isLogin'))); }
        catch { localStorage.removeItem('isLogin'); }
    }, []);

    useEffect(() => {
        if (SECURE_ACCOUNTS_ENABLED || !isLogin?.id) return;
        return onSnapshot(doc(db, 'Users', isLogin.id), snapshot => {
            if (!snapshot.exists()) return;
            const profile = { ...snapshot.data(), id: snapshot.id };
            setIsLogin(profile);
            localStorage.setItem('isLogin', JSON.stringify(profile));
        });
    }, [isLogin?.id]);

    const loginByUser = useCallback((data, fbUser = null) => {
        if (SECURE_ACCOUNTS_ENABLED) data = { ...data };
        if (SECURE_ACCOUNTS_ENABLED) delete data.password;
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
        await flushActiveResumeSync();
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
