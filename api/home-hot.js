import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { accountServices } from '../server/accounts/firebase.js';
import { prepareCatalog } from '../server/seo/catalog.js';
import { hotCatalogMovies } from '../src/utils/hotCatalog.js';

export const config = { maxDuration: 15 };

async function readLocalHotEdits() {
    const { localAdminDatabase, readAdminSnapshot } = await import('../scripts/lib/privateAdmin.mjs');
    const db = await localAdminDatabase();
    try {
        const snapshot = await readAdminSnapshot(db.collection('PublicCatalogControls').doc('home'), 2500);
        return snapshot.data()?.hot || {};
    } finally { await db.terminate(); }
}

async function readRemoteHotEdits() {
    // One small shared control document, not a Movies query/listener per visitor.
    // REST bounds quota-error latency without the SDK's long automatic retries.
    const { auth } = accountServices();
    const token = await auth.app.options.credential.getAccessToken();
    const response = await fetch('https://firestore.googleapis.com/v1/projects/manhfilm-105b3/databases/(default)/documents/PublicCatalogControls/home', {
        headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(2500),
    });
    if (response.status === 404) return {};
    if (!response.ok) throw new Error(`Public Hot controls HTTP ${response.status}`);
    const data = await response.json();
    return Object.fromEntries(Object.entries(data.fields?.hot?.mapValue?.fields || {}).map(([id, value]) => [id, {
        isHot: value.mapValue?.fields?.isHot?.booleanValue,
        movieJson: value.mapValue?.fields?.movieJson?.stringValue,
    }]));
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
