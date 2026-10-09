import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

// Enable only after the server credentials, migration and secured rules are ready.
export const SECURE_ACCOUNTS_ENABLED = import.meta.env.VITE_SECURE_ACCOUNTS_ENABLED === 'true';

export async function accountRequest(action, values = {}, authenticated = true) {
    const token = authenticated ? await auth.currentUser?.getIdToken() : null;
    const response = await fetch('/api/accounts', {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...values, action }),
    });
    const json = await response.json();
    if (!response.ok) throw Object.assign(new Error(json.error || 'Account request failed'), { status: response.status });
    return json.data;
}

export async function accountSession(action, values) {
    const result = await accountRequest(action, values, !['login', 'register', 'google'].includes(action));
    const credential = await signInWithCustomToken(auth, result.customToken);
    return { user: result.user, firebaseUser: credential.user };
}

export function accountChanged() { window.dispatchEvent(new Event('mfilm_account_changed')); }
