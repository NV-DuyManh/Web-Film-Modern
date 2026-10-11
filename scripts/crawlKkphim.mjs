import { authorizeCloud } from './lib/cloudAuth.mjs';
import { readFile, appendFile } from 'node:fs/promises';
import { backgroundFirestore } from './lib/backgroundFirestore.mjs';
import { publishCatalog } from './lib/publishCatalog.mjs';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocFromServer, query, limit, terminate } from 'firebase/firestore';
import { runCrawlerJob } from './lib/crawlerRunner.mjs';
import { DAILY_CRAWLER_SETTINGS_ID, nextDailyCrawlerJob } from '../src/utils/dailyCrawler.js';
import { rentalPriceRange } from '../src/utils/importRentalPricing.js';
import { nextQuotaReset } from '../src/utils/backgroundQuota.js';
import { fetchMoviesList } from '../src/services/kkphimService.js';
import { createKkphimImporter } from '../src/utils/kkphimImporter.js';


export async function crawlOnCloud({ dryRun = false, daily = false } = {}) {
    const app = initializeApp({ projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk' }, 'kkphim-cloud-crawler');
await authorizeCloud(app);
const db = getFirestore(app);
    const ref = doc(db, 'Settings', DAILY_CRAWLER_SETTINGS_ID);
    let io;
    const read = async () => (await (io ? io.read(ref, true) : getDocFromServer(ref))).data();
    try {
        let initial = await read();
        if (dryRun) {
            console.log(JSON.stringify({ dryRun: true, status: initial?.status || 'idle', options: initial?.options || null }));
            return;
        }
        if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Use the serialized cloud workflow for writes, or --dry-run locally.');
        if (daily) {
            const scheduled = nextDailyCrawlerJob(initial);
            if (scheduled) {
                io = await backgroundFirestore(db, { initialReads: 1 });
                await io.set(ref, scheduled);
                initial = scheduled;
                console.log('Daily discovery started: newest KKPhim pages 1–5.');
            }
        }
        if (!initial || !['queued', 'running', 'paused'].includes(initial.status)) { console.log('No queued KKPhim crawl.'); return; }
        if (Number(initial.resumeAt) > Date.now()) { console.log('Daily background budget reached; waiting for reset.'); return; }
        io ||= await backgroundFirestore(db, { initialReads: 1 });
        // This process must run within the same GitHub concurrency group as episode sync.
        // Scheduled discovery is independent of immediate admin imports.
        const store = { read, patch: async (id, values) => {
            if ((await read())?.jobId !== id) return false;
            await io.update(ref, values, true);
            return true;
        } };
        let caches;
        let catalogChanged = false;
        const catalog = async () => {
            if (!caches) {
                const snapshot = JSON.parse(await readFile(new URL('../server/seo/catalog.json', import.meta.url), 'utf8')).catalog;
                const plans = await io.query(query(collection(db, 'Plans'), limit(30)), 30);
                caches = { ...snapshot, Plans: plans.docs.map(value => ({ ...value.data(), id: value.id })) };
                for (const name of ['Movies', 'Categories', 'CategoryTypes', 'Actors', 'Authors']) caches[name] = [...(caches[name] || [])];
                if (!caches.Plans.length || caches.Plans.some(plan => !rentalPriceRange(plan))) throw new Error('Valid movie plans and rental prices are required.');
            }
            return caches;
        };
        const importer = createKkphimImporter({ db, io, catalog, onChange: () => { catalogChanged = true; } });
        const result = await runCrawlerJob({ store, importMovie: importer,
            budgetPauseAt: () => {
                const budget = io.counter.snapshot();
                return budget.reads + 8 >= budget.readLimit || budget.writes + 8 >= budget.writeLimit ? nextQuotaReset() : 0;
            },
            fetchPage: async page => {
                const response = await fetchMoviesList(page);
                const items = response?.data?.items || response?.items;
                if (!Array.isArray(items)) throw new Error('KKPhim returned an invalid movie list.');
                // Store only the small source identity/timestamp snapshot, not full API responses.
                return items.map(({ slug, name, origin_name, modified }) => ({ slug, name: name || '', origin_name: origin_name || '', modified: { time: modified?.time || '' } }));
            }, owner: process.env.GITHUB_RUN_ID || 'cloud' });
        console.log(JSON.stringify(result));
        if (catalogChanged) {
            await publishCatalog(caches);
            if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, 'publish=true\n');
        }
    } finally { try { await io?.flush(); } finally { await terminate(db); } }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    crawlOnCloud({ dryRun: process.argv.includes('--dry-run'), daily: process.argv.includes('--daily') }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
