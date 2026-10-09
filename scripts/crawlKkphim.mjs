import { createHash } from 'node:crypto';
import { readFile, appendFile } from 'node:fs/promises';
import { backgroundFirestore } from './lib/backgroundFirestore.mjs';
import { publishCatalog } from './lib/publishCatalog.mjs';
import { importEpisodeBatches } from './lib/crawlerEpisodes.mjs';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDocFromServer, query, where, limit, terminate } from 'firebase/firestore';
import { runCrawlerJob } from './lib/crawlerRunner.mjs';
import { CRAWLER_SETTINGS_ID } from '../src/utils/crawlerJob.js';
import { DAILY_CRAWLER_SETTINGS_ID, nextDailyCrawlerJob } from '../src/utils/dailyCrawler.js';
import { kkphimDocumentID, randomMoviePlanID } from '../src/utils/movieMaintenance.js';
import { randomRentalPrice, rentalPriceRange } from '../src/utils/importRentalPricing.js';
import { resolveMovieImages } from '../src/utils/movieImages.js';
import { movieTime } from '../src/utils/movieRecency.js';
import { parseEpisode, highestEpisode, normalizeEpisodes } from '../src/utils/episodes.js';
import { episodeSyncChanges } from '../src/utils/episodeSync.js';
import { nameSlug } from '../src/utils/nameRoutes.js';
import { detectGender } from '../src/utils/genderDetect.js';
import { episodeSourceFingerprint } from '../src/utils/episodeSourceFingerprint.js';
import { nextQuotaReset } from '../src/utils/backgroundQuota.js';
import { fetchMoviesList, fetchMovieDetails, fetchMovieImages, getFullImageUrl,
    mapMovieType, mapMovieStatus, mapCountryName, parseDuration, stripHtml } from '../src/services/kkphimService.js';

const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 24);
const normalize = value => String(value || '').trim().toLowerCase();

export async function crawlOnCloud({ dryRun = false, daily = false } = {}) {
    const db = getFirestore(initializeApp({ projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk' }, 'kkphim-cloud-crawler'));
    let ref = doc(db, 'Settings', CRAWLER_SETTINGS_ID);
    let io;
    const read = async () => (await (io ? io.read(ref, true) : getDocFromServer(ref))).data();
    try {
        let initial = await read();
        if (dryRun) {
            console.log(JSON.stringify({ dryRun: true, status: initial?.status || 'idle', options: initial?.options || null }));
            return;
        }
        if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Use the serialized cloud workflow for writes, or --dry-run locally.');
        const adminActive = initial && ['queued', 'running', 'paused'].includes(initial.status);
        if (daily || !adminActive) {
            const dailyRef = doc(db, 'Settings', DAILY_CRAWLER_SETTINGS_ID);
            const previous = (await getDocFromServer(dailyRef)).data();
            const queued = daily ? nextDailyCrawlerJob(previous) : null;
            if (queued) {
                io = await backgroundFirestore(db, { initialReads: 2 });
                await io.set(dailyRef, queued);
                console.log('Daily check queued: newest KKPhim pages 1–5.');
            }
            if (!adminActive) { ref = dailyRef; initial = queued || previous; }
        }
        if (!initial || !['queued', 'running', 'paused'].includes(initial.status)) { console.log('No queued KKPhim crawl.'); return; }
        if (Number(initial.resumeAt) > Date.now()) { console.log('Daily background budget reached; waiting for reset.'); return; }
        io ||= await backgroundFirestore(db, { initialReads: adminActive ? 1 : 2 });
        // This process must run within the same GitHub concurrency group as episode sync.
        // A browser never performs any import work or supplies a GitHub credential.
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
        const lookup = async (name, field, value) => {
            const found = await io.query(query(collection(db, name), where(field, '==', value), limit(1)), 1);
            return found.docs[0] ? { ...found.docs[0].data(), id: found.docs[0].id } : null;
        };
        const importer = async (item, { jobId, page }) => {
            const data = await catalog();
            const sourceTime = movieTime(item.modified?.time);
            const candidateNames = [item.name, item.origin_name].map(normalize).filter(Boolean);
            let existing = data.Movies.find(movie => movie.sourceSlug === item.slug || movie.slug === item.slug
                || [movie.name, movie.otherName].map(normalize).some(name => name && candidateNames.includes(name)));
            if (!existing) existing = await lookup('Movies', 'sourceSlug', item.slug) || await lookup('Movies', 'slug', item.slug) || await lookup('Movies', 'otherName', item.name) || (item.origin_name ? await lookup('Movies', 'name', item.origin_name) : null);
            const movieRef = doc(db, 'Movies', existing?.id || kkphimDocumentID(item.slug));
            let live = existing && !(data.Movies.includes(existing)) ? existing : (await io.read(movieRef)).data();
            if (live && live.crawlImportState !== 'pending') {
                if (sourceTime && movieTime(live.sourceUpdatedAt) !== sourceTime) { await io.update(movieRef, { sourceUpdatedAt: sourceTime }); live.sourceUpdatedAt = sourceTime; catalogChanged = true; }
                const cached = data.Movies.find(value => value.id === movieRef.id);
                if (cached) Object.assign(cached, live); else { data.Movies.push({ ...live, id: movieRef.id }); catalogChanged = true; }
                // A prior worker can finish saving a film before its cursor checkpoint.
                return live.crawlJobId === jobId ? { movieId: movieRef.id, movies: 1, episodes: live.crawlImportedEpisodes || 0 } : { skipped: 1 };
            }
            const detail = await fetchMovieDetails(item.slug);
            const source = detail?.movie;
            if (!source) throw new Error('KKPhim returned no movie details.');
            const stats = { movies: 1, episodes: 0, categories: 0, actors: 0, directors: 0 };
            const entity = async (name, label, values, stat) => {
                const old = data[name].find(value => normalize(value.name) === normalize(label));
                if (old) return old.id;
                const found = await lookup(name, 'name', label);
                if (found) { data[name].push(found); return found.id; }
                const id = `kkphim-${hash(`${name}:${normalize(label)}`)}`;
                const record = { id, name: label, description: 'Đang cập nhật...', ...values };
                await io.set(doc(db, name, id), record);
                data[name].push(record);
                if (stat) stats[stat]++;
                return id;
            };
            const listCategory = [];
            for (const category of source.category || []) if (category.name) listCategory.push(await entity('Categories', category.name, {}, 'categories'));
            const categoryTypeID = await entity('CategoryTypes', mapMovieType(source.type), {});
            const countriesID = mapCountryName(source.country);
            const people = async (names, collectionName, counter) => {
                const ids = [];
                for (const name of names || []) if (name && name !== 'Đang cập nhật') ids.push(await entity(collectionName, name, { imgUrl: '', sexID: detectGender(name), countriesID }, counter));
                return ids;
            };
            const listActor = await people(source.actor, 'Actors', 'actors');
            const listAuthor = await people(source.director, 'Authors', 'directors');
            const servers = detail.episodes || [];
            const firstEpisodes = servers[0]?.server_data || [];
            const planID = live?.planID || randomMoviePlanID(data.Plans);
            const plan = data.Plans.find(value => value.id === planID);
            if (!rentalPriceRange(plan)) throw new Error('Movie plan is unavailable.');
            const sourceUpdatedAt = sourceTime || movieTime(source.modified?.time);
            const movie = live || {
                id: movieRef.id, slug: nameSlug(source.name || source.origin_name || item.name),
                name: source.origin_name || item.origin_name || item.name, otherName: source.name || '',
                description: stripHtml(source.content),
                ...resolveMovieImages({ imgUrl: getFullImageUrl(source.poster_url), bannerUrl: getFullImageUrl(source.thumb_url) }),
                listCategory, listActor, listAuthor, listCharacter: [], categoryTypeID, planID,
                countriesID, releaseYear: source.year || new Date().getFullYear(), duration: parseDuration(source.time),
                rent: randomRentalPrice(plan), status: mapMovieStatus(source.status), ageRating: 'T13',
                endEpisode: Math.max(parseEpisode(source.episode_total)?.end || 0, highestEpisode(firstEpisodes.map(ep => ({ nameEpisode: ep.name }))), 1),
                hasSub: String(source.lang || '').includes('Vietsub'), hasDub: String(source.lang || '').includes('Thuyết Minh'),
                hasVoice: String(source.lang || '').includes('Lồng Tiếng'), episodeSub: 0, episodeDub: 0, episodeVoice: 0,
                createdAt: new Date().toISOString(), importSource: 'kkphim', sourceSlug: item.slug,
                sourceUpdatedAt, sourcePage: page, crawlJobId: jobId, crawlImportState: 'pending',
            };
            if (!live) {
                await io.set(movieRef, movie);
                data.Movies.push(movie);
            }
            // Deterministic episode IDs make retry after a network failure safe.
            const changes = episodeSyncChanges(movie, firstEpisodes);
            const signature = await episodeSourceFingerprint(source, servers);
            await importEpisodeBatches({ episodes: changes.creates, signature, previous: movie,
                write: episodes => io.batch(episodes.map(episode => ({ ref: doc(db, 'Episodes', episode.id), values: episode, merge: true }))),
                saveProgress: async values => { await io.update(movieRef, values); Object.assign(movie, values); },
            });
            stats.episodes = changes.creates.length;
            const counts = { episodeSub: 0, episodeDub: 0, episodeVoice: 0 };
            for (const server of servers) {
                const count = normalizeEpisodes((server.server_data || []).map(ep => ({ nameEpisode: ep.name, url: ep.link_embed, urlM3u8: ep.link_m3u8 }))).length;
                const label = normalize(server.server_name);
                if (label.includes('thuyết minh')) counts.episodeDub += count;
                else if (label.includes('lồng tiếng')) counts.episodeVoice += count;
                else counts.episodeSub += count;
            }
            const gallery = await fetchMovieImages(item.slug);
            const completion = { ...counts, ...(gallery.length ? { gallery } : {}), sourceUpdatedAt, sourceEpisodesFingerprint: signature, crawlEpisodeCursor: 0,
                crawlImportState: 'complete', crawlJobId: jobId, crawlImportedEpisodes: stats.episodes };
            await io.update(movieRef, completion);
            Object.assign(movie, completion);
            const cachedMovie = data.Movies.find(value => value.id === movieRef.id);
            if (cachedMovie) Object.assign(cachedMovie, movie, { id: movieRef.id });
            else data.Movies.push({ ...movie, id: movieRef.id });
            catalogChanged = true;
            return { ...stats, movieId: movieRef.id };
        };
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
