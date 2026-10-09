import { getAuth, signInWithCustomToken } from 'firebase/auth';

export async function authorizeCloud(app) {
    if (!process.env.CLOUD_WORKER_TOKEN) {
        if (process.env.SECURE_ACCOUNTS_ENABLED === 'true') throw new Error('Authenticated cloud worker required');
        return;
    }
    const response = await fetch(`${process.env.MFILM_ORIGIN || 'https://www.mfilm.online'}/api/accounts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Mfilm-Worker': process.env.CLOUD_WORKER_TOKEN },
        body: JSON.stringify({ action: 'worker-token' }),
    });
    const result = await response.json();
    if (!response.ok || !result.data?.customToken) throw new Error(`Cloud worker authentication failed (${response.status})`);
    await signInWithCustomToken(getAuth(app), result.data.customToken);
}
