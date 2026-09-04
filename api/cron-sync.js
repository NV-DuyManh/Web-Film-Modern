import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined;

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    } catch (error) {
        console.error('Firebase admin initialization error', error.stack);
    }
}

const db = admin.firestore();
const BASE_URL = 'https://phimapi.com';

const fetchJson = async (url) => {
    const res = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
};

const mapMovieStatus = (status) => {
    const statusMap = {
        'ongoing': 'Đang chiếu',
        'completed': 'Hoàn thành',
        'trailer': 'Sắp chiếu',
    };
    return statusMap[status] || 'Đang chiếu';
};

const slugify = (text) => {
    if (!text) return '';
    const vietnameseMap = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd',
        'À': 'a', 'Á': 'a', 'Ả': 'a', 'Ã': 'a', 'Ạ': 'a', 'Ă': 'a', 'Ằ': 'a', 'Ắ': 'a', 'Ẳ': 'a', 'Ẵ': 'a', 'Ặ': 'a', 'Â': 'a', 'Ầ': 'a', 'Ấ': 'a', 'Ẩ': 'a', 'Ẫ': 'a', 'Ậ': 'a',
        'È': 'e', 'É': 'e', 'Ẻ': 'e', 'Ẽ': 'e', 'Ẹ': 'e', 'Ê': 'e', 'Ề': 'e', 'Ế': 'e', 'Ể': 'e', 'Ễ': 'e', 'Ệ': 'e',
        'Ì': 'i', 'Í': 'i', 'Ỉ': 'i', 'Ĩ': 'i',
        'Ò': 'o', 'Ó': 'o', 'Ỏ': 'o', 'Õ': 'o', 'Ọ': 'o', 'Ô': 'o', 'Ồ': 'o', 'Ố': 'o', 'Ổ': 'o', 'Ỗ': 'o', 'Ộ': 'o', 'Ơ': 'o', 'Ờ': 'o', 'Ớ': 'o', 'Ở': 'o', 'Ỡ': 'o', 'Ợ': 'o',
        'Ù': 'u', 'Ú': 'u', 'Ủ': 'u', 'Ũ': 'u', 'Ụ': 'u', 'Ư': 'u', 'Ừ': 'u', 'Ứ': 'u', 'Ử': 'u', 'Ữ': 'u', 'Ự': 'u',
        'Ỳ': 'y', 'Ý': 'y', 'Ỷ': 'y', 'Ỹ': 'y', 'Ỵ': 'y',
        'Đ': 'd'
    };
    return text.split('').map(c => vietnameseMap[c] || c).join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const normalizeStr = (str) => {
    if (!str) return '';
    return str.toString().trim().toLowerCase();
};

const isSameMovie = (m1, m2) => {
    if (!m1 || !m2) return false;
    if (m1.id && m2.id && m1.id === m2.id) return true;

    const s1 = slugify(m1.slug || m1.otherName || m1.name || '');
    const s2 = slugify(m2.slug || m2.otherName || m2.name || m2.origin_name || '');
    if (s1 && s2 && s1 === s2) return true;

    const n1 = normalizeStr(m1.name);
    const o1 = normalizeStr(m1.otherName);
    const n2 = normalizeStr(m2.name);
    const o2 = normalizeStr(m2.otherName || m2.origin_name);

    if (n1 && (n1 === n2 || n1 === o2)) return true;
    if (o1 && (o1 === n2 || o1 === o2)) return true;
    if (n2 && (n2 === n1 || n2 === o1)) return true;
    if (o2 && (o2 === n1 || o2 === o1)) return true;

    return false;
};

const findMatchingMovie = (movieList, candidate) => {
    if (!candidate || !movieList) return null;
    return movieList.find(m => isSameMovie(m, candidate)) || null;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 1. Check if Firebase is initialized correctly
        if (!admin.apps.length) {
            return res.status(500).json({ error: 'Firebase Admin not initialized. Check Env Vars.' });
        }

        // 2. Check Settings/AutoSync
        const docRef = db.collection("Settings").doc("AutoSync");
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return res.status(200).json({ message: 'AutoSync disabled or settings not found.' });
        }
        const data = docSnap.data();
        const autoCronInterval = Number(data.interval) || 0;
        const syncPages = Number(data.syncPages) || 2;

        if (autoCronInterval <= 0) {
            return res.status(200).json({ message: 'AutoSync is disabled (interval = 0).' });
        }

        // Distributed Lock Check
        if (data.lastSyncTime) {
            const lastSyncDate = new Date(data.lastSyncTime);
            const now = new Date();
            const diffMins = (now - lastSyncDate) / (1000 * 60);
            if (diffMins < (autoCronInterval - 2)) {
                return res.status(200).json({ message: 'Skipped. Ran recently.', diffMins });
            }
        }

        const nowISO = new Date().toISOString();
        await docRef.set({ lastSyncTime: nowISO }, { merge: true });

        const stats = { checked: 0, moviesUpdated: 0, newEpisodes: 0, errors: 0 };
        const updatedMoviesList = [];

        for (let page = 1; page <= syncPages; page++) {
            let listData;
            try {
                listData = await fetchJson(`${BASE_URL}/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`);
            } catch (err) {
                stats.errors++;
                continue;
            }

            const items = listData?.data?.items || [];
            if (items.length === 0) continue;

            const kkphimSlugs = items.map(item => item.slug).filter(Boolean);
            if (kkphimSlugs.length === 0) continue;

            // Fetch candidate movies from Firestore
            let candidateMovies = [];
            for (let i = 0; i < kkphimSlugs.length; i += 10) {
                const chunkSlugs = kkphimSlugs.slice(i, i + 10);
                const snapshot = await db.collection("Movies").where("slug", "in", chunkSlugs).get();
                snapshot.forEach(doc => {
                    candidateMovies.push({ id: doc.id, ...doc.data() });
                });
            }

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                stats.checked++;

                const matchedMovie = findMatchingMovie(candidateMovies, {
                    name: item.origin_name || item.name,
                    otherName: item.name,
                    slug: item.slug
                });

                if (!matchedMovie) continue;

                let detail;
                try {
                    detail = await fetchJson(`${BASE_URL}/phim/${item.slug}`);
                    await sleep(300);
                } catch (err) {
                    stats.errors++;
                    continue;
                }

                const movieData = detail?.movie;
                const episodesData = detail?.episodes || [];
                if (!episodesData || episodesData.length === 0) continue;

                const currentMovieEpsSnapshot = await db.collection("Episodes").where("movieID", "==", matchedMovie.id).get();
                const currentMovieEps = [];
                currentMovieEpsSnapshot.forEach(doc => currentMovieEps.push({ id: doc.id, ...doc.data() }));
                const currentEpMap = new Map(currentMovieEps.map(e => [Number(e.numberEpisode), e]));

                let newEpsCountForThisMovie = 0;
                let fixedEpsCountForThisMovie = 0;
                let highestEp = matchedMovie.endEpisode || 0;

                const firstServer = episodesData[0];
                const serverData = firstServer?.server_data || [];

                for (const ep of serverData) {
                    const epNum = parseInt(ep.name.replace(/[^0-9]/g, '')) || 1;
                    if (epNum > highestEp) highestEp = epNum;

                    const existingEp = currentEpMap.get(epNum);

                    if (!existingEp) {
                        const epRef = db.collection("Episodes").doc();
                        await epRef.set({
                            id: epRef.id,
                            movieID: matchedMovie.id,
                            title: matchedMovie.name,
                            numberEpisode: epNum,
                            nameEpisode: ep.name || `Tập ${epNum}`,
                            url: ep.link_embed || '',
                            urlM3u8: ep.link_m3u8 || '',
                            description: "Đang cập nhật...",
                            createdAt: new Date().toISOString(),
                        });
                        currentEpMap.set(epNum, { id: epRef.id, numberEpisode: epNum, url: ep.link_embed, urlM3u8: ep.link_m3u8 });
                        newEpsCountForThisMovie++;
                        stats.newEpisodes++;
                    } else {
                        const isDummyOrBroken = !existingEp.url ||
                            !existingEp.url.startsWith('http') ||
                            existingEp.url !== ep.link_embed ||
                            existingEp.urlM3u8 !== ep.link_m3u8;

                        if (isDummyOrBroken && (ep.link_embed || ep.link_m3u8)) {
                            const epRef = db.collection("Episodes").doc(existingEp.id);
                            await epRef.update({
                                url: ep.link_embed || existingEp.url || '',
                                urlM3u8: ep.link_m3u8 || existingEp.urlM3u8 || '',
                                nameEpisode: ep.name || existingEp.nameEpisode || `Tập ${epNum}`,
                                title: matchedMovie.name || existingEp.title || '',
                                updatedAt: new Date().toISOString()
                            });
                            fixedEpsCountForThisMovie++;
                        }
                    }
                }

                if (newEpsCountForThisMovie > 0 || fixedEpsCountForThisMovie > 0) {
                    const movieRef = db.collection("Movies").doc(matchedMovie.id);
                    await movieRef.update({
                        endEpisode: Math.max(highestEp, matchedMovie.endEpisode || 1),
                        status: movieData?.status ? mapMovieStatus(movieData.status) : (matchedMovie.status || 'Đang chiếu'),
                        updatedAt: new Date().toISOString()
                    });
                    stats.moviesUpdated++;
                    updatedMoviesList.push(`${matchedMovie.otherName || matchedMovie.name} (+${newEpsCountForThisMovie} tập mới)`);
                }
            }
        }

        const runLog = `[CRON JOB API] ${nowISO} - Quét ${syncPages} trang: ${stats.checked} phim, cập nhật ${stats.moviesUpdated} phim, ${stats.newEpisodes} tập mới. Lỗi: ${stats.errors}. Cập nhật: ${updatedMoviesList.join(', ')}`;
        console.log(runLog);

        return res.status(200).json({
            message: 'Auto-Sync Cron Job Hoàn Tất',
            stats,
            runLog,
            updatedMoviesList
        });
    } catch (error) {
        console.error("Lỗi Cron Job:", error);
        return res.status(500).json({ error: error.message });
    }
}
