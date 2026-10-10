import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Firestore } from '@google-cloud/firestore';
import { OAuth2Client } from 'google-auth-library';

// Local administrative tools reuse the user's authorized Firebase CLI session.
// No OAuth token or service-account private key is copied into the repository.
export async function localAdminDatabase() {
    if (process.env.CI || process.env.VERCEL) throw new Error('Local administrator session required');
    {
        const path = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
            const config = JSON.parse(await readFile(path, 'utf8'));
            const tokens = config.tokens || {};
            const seconds = Math.floor((Number(tokens.expires_at) - Date.now()) / 1000);
            if (!config.user?.email || !tokens.access_token || seconds < 120) throw new Error('Refresh the Firebase CLI login before continuing');
            const client = new OAuth2Client();
            client.setCredentials({ access_token: tokens.access_token, expiry_date: tokens.expires_at });
            return new Firestore({ projectId: 'manhfilm-105b3', authClient: client });
    }
}

// Admin Listen reads a fresh server snapshot without the RunQuery RPC. Close
// each listener after the first snapshot; it must not become a persistent feed.
export async function readAdminSnapshot(reference, timeoutMs = 15000) {
    let unsubscribe;
    let timer;
    try {
        return await new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error('Administrator snapshot timed out')), timeoutMs);
            unsubscribe = reference.onSnapshot(resolve, reject);
        });
    } finally {
        clearTimeout(timer);
        unsubscribe?.();
    }
}
