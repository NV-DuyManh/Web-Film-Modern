import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, query, where, getDoc, runTransaction } from "firebase/firestore";

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
    if (settings.enabled === false) {
        console.log('[CloudSync] Tự động đồng bộ tập phim đang tắt.');
        return;
    }
    const runId = `${Date.now()}_${process.env.GITHUB_RUN_ID || 'manual'}`;
    const acquired = dryRun || await runTransaction(db, async tx => {
        const state = (await tx.get(lock)).data() || {};
        const now = Date.now();
        if (Number(state.lockUntil) > now || now - Number(state.lastSuccessAt || 0) < Math.max(30, Number(settings.intervalMinutes) || 30) * 60000) return false;
        tx.set(lock, { runId, lockUntil: now + 30 * 60000 }, { merge: true });
        return true;
    });
    if (!acquired) { console.log('[CloudSync] Đã chạy gần đây hoặc đang chạy ở nơi khác.'); return; }
    try {
        let targetMovies = [];
        if (process.argv.includes('--full')) {
            const snapshot = await getDocs(collection(db, 'Movies'));
            targetMovies = snapshot.docs.map(item => ({ ...item.data(), id: item.id }))
                .filter(movie => !['hoàn thành', 'completed'].includes(String(movie.status || '').toLowerCase()));
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
            for (let i = 0; i < slugList.length; i += 10) {
                const snapshot = await getDocs(query(collection(db, 'Movies'), where('slug', 'in', slugList.slice(i, i + 10))));
                for (const item of snapshot.docs) targetMovies.push({ ...item.data(), id: item.id });
            }
        }
        console.log(`[CloudSync] 🔍 Tìm thấy ${targetMovies.length} phim đang chiếu cần kiểm tra.`);

        let totalNew = 0;
        let totalFixed = 0;
        let totalUpdatedMovies = 0;
        let errors = 0;

        for (let i = 0; i < targetMovies.length; i++) {
            const movie = targetMovies[i];
            let activeSlug = movie.slug || nameSlug(movie.otherName || movie.name);
            if (!activeSlug) continue;

            try {
                const res = await fetch(`${BASE_URL}/phim/${activeSlug}`, { headers: { 'accept': 'application/json' }, signal: AbortSignal.timeout(15000) });
                if (!res.ok) throw new Error(`Chi tiết phim: HTTP ${res.status}`);
                const detail = await res.json();
                const movieData = detail?.movie;
                const episodesData = detail?.episodes || [];
                if (!episodesData || episodesData.length === 0) continue;

                // Lấy danh sách tập hiện có của phim trong Firestore
                const epSnap = await getDocs(query(collection(db, "Episodes"), where("movieID", "==", movie.id)));
                const currentEpisodes = epSnap.docs.map(item => ({ ...item.data(), id: item.id }));
                const changes = episodeSyncChanges(movie, episodesData[0]?.server_data || [], currentEpisodes);
                const movieNewEps = changes.creates.length;
                const movieFixedEps = changes.updates.length;
                const highestEp = changes.highest;
                for (const ep of changes.creates) if (!dryRun) await setDoc(doc(db, 'Episodes', ep.id), { ...ep, createdAt: new Date().toISOString() });
                for (const ep of changes.updates) {
                    const { id, ...values } = ep;
                    if (!dryRun) await updateDoc(doc(db, 'Episodes', id), { ...values, updatedAt: new Date().toISOString() });
                }
                totalNew += movieNewEps;
                totalFixed += movieFixedEps;
                const newStatus = movieData?.status ? mapMovieStatus(movieData.status) : movie.status;
                if (movieNewEps > 0 || movieFixedEps > 0 || movie.status !== newStatus || highestEp !== Number(movie.endEpisode)) {
                    const movieRef = doc(db, "Movies", movie.id);
                    if (!dryRun) await updateDoc(movieRef, {
                        endEpisode: Math.max(highestEp, Number(movie.endEpisode) || 1),
                        status: newStatus,
                        slug: activeSlug,
                        updatedAt: new Date().toISOString()
                    });
                    totalUpdatedMovies++;
                    console.log(`[CloudSync] ✅ "${movie.otherName || movie.name}": +${movieNewEps} tập mới, sửa ${movieFixedEps} link tập.`);
                }
            } catch (e) {
                errors++;
                if (e.code === 'resource-exhausted') throw e;
                console.error(`[CloudSync] ❌ Lỗi xử lý "${movie.name}":`, e.message);
            }
            await sleep(350);
        }

        if (errors) throw new Error(`Có ${errors} phim chưa đồng bộ được; sẽ thử lại ở lần chạy sau.`);
        if (!dryRun) await setDoc(lock, { lastSuccessAt: Date.now() }, { merge: true });
        console.log(`[CloudSync] 🏁 Hoàn tất! Cập nhật ${totalUpdatedMovies} phim (+${totalNew} tập mới, sửa ${totalFixed} link).`);
    } finally {
        if (!dryRun) await runTransaction(db, async tx => {
            const state = (await tx.get(lock)).data();
            if (state?.runId === runId) tx.set(lock, { lockUntil: 0 }, { merge: true });
        });
    }
}

runCloudSync().catch(err => {
    console.error("[CloudSync] Fatal error:", err);
    process.exit(1);
});
