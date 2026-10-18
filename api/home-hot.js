import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { accountServices } from '../server/accounts/firebase.js';
import { prepareCatalog } from '../server/seo/catalog.js';
import { hotCatalogMovies } from '../src/utils/hotCatalog.js';

export const config = { maxDuration: 15 };

// Close the single-document listener after its first server snapshot. The REST
// get endpoint can be quota-limited while Listen still serves this document.
// Each warm function refreshes at most once a minute, not once per visitor.
export async function readHotControlSnapshot(reference, timeoutMs = 2500) {
    let unsubscribe, timer;
    try {
        const snapshot = await new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error('Hot controls snapshot timed out')), timeoutMs);
            unsubscribe = reference.onSnapshot(resolve, reject);
        });
        return snapshot.data()?.hot || {};
    } finally {
        clearTimeout(timer);
        unsubscribe?.();
    }
}

async function readLocalHotEdits() {
    const { localAdminDatabase } = await import('../scripts/lib/privateAdmin.mjs');
    const db = await localAdminDatabase();
    try {
        return await readHotControlSnapshot(db.collection('PublicCatalogControls').doc('home'));
    } finally { await db.terminate(); }
}

async function readRemoteHotEdits() {
    const { db } = accountServices();
    return readHotControlSnapshot(db.collection('PublicCatalogControls').doc('home'));
}

// Local development reuses the developer's Firebase CLI session. Deployment
// credentials stay mandatory on Vercel; placeholder local keys are never used.
export function createHotEditsReader({ local = process.env.NODE_ENV === 'development' && !process.env.VERCEL,
    readLocal = readLocalHotEdits, readRemote = readRemoteHotEdits } = {}) {
    return () => local ? readLocal() : readRemote();
}
const readHotEdits = createHotEditsReader();

export function createHomeHotHandler({ readSnapshot = () => readFile(new URL('../server/seo/catalog.json', import.meta.url), 'utf8'), readEdits = readHotEdits, now = Date.now } = {}) {
    let movies, cached, loading, retryAt = 0;
    return async (req, res) => {
        if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
        movies ||= prepareCatalog(JSON.parse(await readSnapshot()).catalog).catalog.Movies;
        if (!cached || (now() >= retryAt && now() - cached.at >= 60000)) {
            loading ||= readEdits().then(edits => { cached = { at: now(), items: hotCatalogMovies(movies, edits), stale: false }; retryAt = 0; })
                .catch(error => {
                    console.warn('Public Hot controls unavailable:', error.message);
                    cached = { ...(cached || { at: now(), items: hotCatalogMovies(movies) }), stale: true };
                    retryAt = now() + 300000;
                }).finally(() => { loading = null; });
            await loading;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', cached.stale ? 'no-store' : 'public, max-age=0, s-maxage=60, must-revalidate');
        res.setHeader('X-Robots-Tag', 'noindex');
        return res.status(200).end(req.method === 'HEAD' ? '' : JSON.stringify({ items: cached.items, stale: cached.stale }));
    };
}
export default createHomeHotHandler();
