import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function accountServices() {
    const name = 'mfilm-private-accounts';
    let app = getApps().find(item => item.name === name);
    const emulator = process.env.MFILM_TEST_PROJECT?.startsWith('demo-') && process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
    if (!app && emulator) {
        if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8089' || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') throw new Error('Local emulators required for account test mode');
        app = initializeApp({ projectId: process.env.MFILM_TEST_PROJECT }, name);
    }
    if (!app) {
        if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
            const error = new Error('Account service has not been configured');
            error.status = 503;
            throw error;
        }
        app = initializeApp({ credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'manhfilm-105b3',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }) }, name);
    }
    return { db: getFirestore(app), auth: getAuth(app) };
}
