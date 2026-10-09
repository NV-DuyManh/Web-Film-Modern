import { backgroundFirestore } from './lib/backgroundFirestore.mjs';
import { episodeSourceFingerprint } from '../src/utils/episodeSourceFingerprint.js';
import { nextQuotaReset } from '../src/utils/backgroundQuota.js';
import { movieTime } from '../src/utils/movieRecency.js';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, query, where, getDoc, runTransaction, terminate, limit, orderBy, documentId, startAfter } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk",
    authDomain: "manhfilm-105b3.firebaseapp.com",
    projectId: "manhfilm-105b3",
    storageBucket: "manhfilm-105b3.firebasestorage.app",
    messagingSenderId: "812294175210",
    appId: "1:812294175210:web:9f8795c9cbfa2b486ada93",
    measurementId: "G-NWLLNRS8LZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let io;

import { episodeSyncChanges } from '../src/utils/episodeSync.js';
import { nameSlug } from '../src/utils/nameRoutes.js';

const BASE_URL = 'https://phimapi.com';

const mapMovieStatus = (status) => {
    if (!status) return "Đang chiếu";
    const s = status.toLowerCase();
    if (s === "completed" || s.includes("hoàn tất") || s.includes("full") || s.includes("hoàn thành")) return "Hoàn thành";
    if (s === "trailer" || s.includes("sắp chiếu")) return "Sắp chiếu";
    return "Đang chiếu";
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runCloudSync() {
    const dryRun = process.argv.includes('--dry-run');
    console.log(`[CloudSync] 🚀 Bắt đầu quét và đồng bộ tập mới trên Cloud...`);
    const lock = doc(db, 'Settings', 'CloudEpisodeSync');
    const settings = (await getDoc(lock)).data() || {};
    const legacy = (await getDoc(doc(db, 'Settings', 'AutoSync'))).data();
    if (legacy && Object.hasOwn(legacy, 'interval')) { settings.enabled = Number(legacy.interval) > 0; settings.intervalMinutes = Math.max(30, Number(legacy.interval) || 30); }
    if (legacy?.syncPages) settings.syncPages = Number(legacy.syncPages);
    if (Number(settings.resumeAt) > Date.now()) { console.log('[CloudSync] Waiting for daily background budget reset.'); return; }
    if (settings.enabled === false) {
        console.log('[CloudSync] Tự động đồng bộ tập phim đang tắt.');
        return;
    }
    const runId = `${Date.now()}_${process.env.GITHUB_RUN_ID || 'manual'}`;
    // GitHub's concurrency group serializes every scheduled/manual workflow run.
    // Use the SDK stream there: the public transaction RPC currently returns RESOURCE_EXHAUSTED.
    // Direct local writes still require an atomic transaction; --dry-run never writes.
    const serializedRunner = process.env.GITHUB_ACTIONS === 'true';
    const force = process.argv.includes('--force');
    const claim = async (read, write) => {
        const state = (await read()).data() || {};
        const now = Date.now();
        if (Number(state.lockUntil) > now || (!force && now - Number(state.lastStartedAt || state.lastSuccessAt || 0) < Math.max(30, Number(settings.intervalMinutes) || 30) * 60000)) return false;
        await write({ runId, lastStartedAt: now, lockUntil: now + 30 * 60000 });
        return true;
    };
    if (!dryRun && serializedRunner) {
        io = await backgroundFirestore(db, { initialReads: 2 });
        const budget = io.counter.snapshot();
        if (budget.reads + 8 >= budget.readLimit || budget.writes + 8 >= budget.writeLimit) {
            await io.update(lock, { resumeAt: nextQuotaReset() }, true);
            console.log('[CloudSync] Waiting for daily background budget reset.');
            return;
        }
    }
    const acquired = dryRun || (serializedRunner
        ? await claim(() => io ? io.read(lock, true) : getDoc(lock), values => io ? io.set(lock, values, { merge: true }) : setDoc(lock, values, { merge: true }))
        : await runTransaction(db, tx => claim(() => tx.get(lock), values => tx.set(lock, values, { merge: true }))));
    if (!acquired) { console.log('[CloudSync] Đã chạy gần đây hoặc đang chạy ở nơi khác.'); return; }
    try {
        let targetMovies = [];
        if (process.argv.includes('--full')) {
            let cursor;
            while (true) {
                const request = query(collection(db, 'Movies'), orderBy(documentId()), limit(250), ...(cursor ? [startAfter(cursor)] : []));
                const snapshot = io ? await io.query(request, 250) : await getDocs(request);
                targetMovies.push(...snapshot.docs.map(item => ({ ...item.data(), id: item.id })).filter(movie => !['hoàn thành', 'completed'].includes(String(movie.status || '').toLowerCase())));
                if (snapshot.size < 250) break; cursor = snapshot.docs.at(-1);
            }
        } else {
            const slugs = new Set();
            const pages = Math.min(10, Math.max(1, Number(settings?.syncPages) || 2));
            for (let page = 1; page <= pages; page++) {
                const response = await fetch(`${BASE_URL}/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`, { signal: AbortSignal.timeout(15000) });
                if (!response.ok) throw new Error(`Danh sách cập nhật: HTTP ${response.status}`);
                const data = await response.json();
                for (const item of data.data?.items || data.items || []) if (item.slug) slugs.add(item.slug);
            }
            const slugList = [...slugs];
            const found = new Map();
            for (let i = 0; i < slugList.length; i += 10) {
                for (const field of ['slug', 'sourceSlug']) {
                    const request = query(collection(db, 'Movies'), where(field, 'in', slugList.slice(i, i + 10)), limit(30));
                    const snapshot = io ? await io.query(request, 30) : await getDocs(request);
                    for (const item of snapshot.docs) found.set(item.id, { ...item.data(), id: item.id });
                }
            }
            targetMovies = [...found.values()];
        }
        console.log(`[CloudSync] 🔍 Tìm thấy ${targetMovies.length} phim đang chiếu cần kiểm tra.`);

        let totalNew = 0;
        let totalFixed = 0;
        let totalUpdatedMovies = 0;
        let errors = 0;

        for (let i = 0; i < targetMovies.length; i++) {
            const movie = targetMovies[i];
            let activeSlug = movie.sourceSlug || movie.slug || nameSlug(movie.otherName || movie.name);
            if (!activeSlug) continue;

            try {
                const res = await fetch(`${BASE_URL}/phim/${activeSlug}`, { headers: { 'accept': 'application/json' }, signal: AbortSignal.timeout(15000) });
                if (!res.ok) throw new Error(`Chi tiết phim: HTTP ${res.status}`);
                const detail = await res.json();
                const movieData = detail?.movie;
                const episodesData = detail?.episodes || [];
                if (!episodesData || episodesData.length === 0) continue;

                const sourceFingerprint = await episodeSourceFingerprint(movieData, episodesData);
                if (movie.sourceEpisodesFingerprint === sourceFingerprint) continue;
                // Lấy danh sách tập chỉ khi nguồn thực sự đổi.
                const currentEpisodes = []; let cursor;
                while (true) {
                    const episodeRequest = query(collection(db, 'Episodes'), where('movieID', '==', movie.id), orderBy(documentId()), limit(250), ...(cursor ? [startAfter(cursor)] : []));
                    const epSnap = io ? await io.query(episodeRequest, 250) : await getDocs(episodeRequest);
                    currentEpisodes.push(...epSnap.docs.map(item => ({ ...item.data(), id: item.id })));
                    if (epSnap.size < 250) break; cursor = epSnap.docs.at(-1);
                }
                const changes = episodeSyncChanges(movie, episodesData[0]?.server_data || [], currentEpisodes);
                const movieNewEps = changes.creates.length;
                const movieFixedEps = changes.updates.length;
                const highestEp = changes.highest;
                for (const ep of changes.creates) if (!dryRun) { const ref = doc(db, 'Episodes', ep.id), values = { ...ep, createdAt: new Date().toISOString() }; if (io) await io.set(ref, values); else await setDoc(ref, values); }
                for (const ep of changes.updates) {
                    const { id, ...values } = ep;
                    if (!dryRun) { const ref = doc(db, 'Episodes', id), patch = { ...values, updatedAt: new Date().toISOString() }; if (io) await io.update(ref, patch); else await updateDoc(ref, patch); }
                }
                totalNew += movieNewEps;
                totalFixed += movieFixedEps;
                const newStatus = movieData?.status ? mapMovieStatus(movieData.status) : movie.status;
                const newEndEpisode = Math.max(highestEp, Number(movie.endEpisode) || 1);
                if (sourceFingerprint !== movie.sourceEpisodesFingerprint || movieNewEps > 0 || movieFixedEps > 0 || movie.status !== newStatus || newEndEpisode !== Number(movie.endEpisode)) {
                    const movieRef = doc(db, "Movies", movie.id);
                    const patch = {
                        sourceEpisodesFingerprint: sourceFingerprint,
                        endEpisode: newEndEpisode,
                        status: newStatus,
                        ...(movieTime(movieData.modified?.time) ? { sourceUpdatedAt: movieTime(movieData.modified.time) } : {}),
                        sourceSlug: activeSlug,
                        updatedAt: new Date().toISOString()
                    };
                    if (!dryRun) { if (io) await io.update(movieRef, patch); else await updateDoc(movieRef, patch); }
                    totalUpdatedMovies++;
                    console.log(`[CloudSync] ${dryRun ? 'Dự kiến' : 'Đã cập nhật'} "${movie.otherName || movie.name}": +${movieNewEps} tập mới, sửa ${movieFixedEps} link tập.`);
                }
            } catch (e) {
                errors++;
                if (e.code === 'resource-exhausted' || e.code === 'background-quota') throw e;
                console.error(`[CloudSync] ❌ Lỗi xử lý "${movie.name}":`, e.message);
            }
            await sleep(350);
        }

        if (errors) throw new Error(`Có ${errors} phim chưa đồng bộ được; sẽ thử lại ở lần chạy sau.`);
        if (!dryRun) await (io ? io.set.bind(io) : setDoc)(lock, { resumeAt: 0, lastSuccessAt: Date.now(), lastSummary: { movies: totalUpdatedMovies, added: totalNew, fixed: totalFixed }, commit: process.env.GITHUB_SHA || '' }, { merge: true });
        if (!dryRun) await (io ? io.set.bind(io) : setDoc)(doc(db, 'Settings', 'AutoSync'), { lastSyncTime: new Date().toISOString() }, { merge: true });
        console.log(`[CloudSync] 🏁 Hoàn tất! Cập nhật ${totalUpdatedMovies} phim (+${totalNew} tập mới, sửa ${totalFixed} link).`);
    } catch (error) {
        if (error.code === 'background-quota' || error.code === 'resource-exhausted') {
            const values = { resumeAt: error.resumeAt || nextQuotaReset(), lastError: error.message };
            if (io) await io.update(lock, values, true); else await updateDoc(lock, values);
            console.log('[CloudSync] Daily budget reached; unchanged source signatures keep the next run incremental.');
            return;
        }
        throw error;
    } finally {
        if (!dryRun && serializedRunner) {
            const state = (await (io ? io.read(lock, true) : getDoc(lock))).data();
            if (state?.runId === runId) {
                if (io) await io.update(lock, { lockUntil: 0 }, true);
                else await setDoc(lock, { lockUntil: 0 }, { merge: true });
            }
        } else if (!dryRun) await runTransaction(db, async tx => {
            const state = (await tx.get(lock)).data();
            if (state?.runId === runId) tx.set(lock, { lockUntil: 0 }, { merge: true });
        });
    }
}

runCloudSync().catch(err => {
    console.error("[CloudSync] Fatal error:", err);
    process.exitCode = 1;
}).finally(async () => { try { await io?.flush(); } finally { await terminate(db); } });
