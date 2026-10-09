import { readFile } from 'node:fs/promises';
import { accountServices } from '../server/accounts/firebase.js';
import { prepareCatalog } from '../server/seo/catalog.js';
import { hotCatalogMovies } from '../src/utils/hotCatalog.js';

export const config = { maxDuration: 15 };

async function readHotEdits() {
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

export function createHomeHotHandler({ readSnapshot = () => readFile(new URL('../server/seo/catalog.json', import.meta.url), 'utf8'), readEdits = readHotEdits, now = Date.now } = {}) {
    let movies, cached, loading, retryAt = 0;
    return async (req, res) => {
        if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
        movies ||= prepareCatalog(JSON.parse(await readSnapshot()).catalog).catalog.Movies;
        if (!cached || (now() >= retryAt && now() - cached.at >= 60000)) {
            loading ||= readEdits().then(edits => { cached = { at: now(), items: hotCatalogMovies(movies, edits) }; })
                .catch(error => {
                    console.warn('Public Hot controls unavailable:', error.message);
                    cached ||= { at: now(), items: hotCatalogMovies(movies) };
                    retryAt = now() + 300000;
                }).finally(() => { loading = null; });
            await loading;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, must-revalidate');
        res.setHeader('X-Robots-Tag', 'noindex');
        return res.status(200).end(req.method === 'HEAD' ? '' : JSON.stringify({ items: cached.items }));
    };
}
export default createHomeHotHandler();
