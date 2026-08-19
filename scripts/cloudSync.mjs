import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, query, where } from "firebase/firestore";

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

const BASE_URL = 'https://phimapi.com';

const slugify = (text) => {
    if (!text) return '';
    const vietnameseMap = {
        'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a','â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
        'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
        'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
        'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
        'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u','ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
        'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
        'đ':'d',
        'À':'a','Á':'a','Ả':'a','Ã':'a','Ạ':'a','Ă':'a','Ằ':'a','Ắ':'a','Ẳ':'a','Ẵ':'a','Ặ':'a','Â':'a','Ầ':'a','Ấ':'a','Ẩ':'a','Ẫ':'a','Ậ':'a',
        'È':'e','É':'e','Ẻ':'e','Ẽ':'e','Ẹ':'e','Ê':'e','Ề':'e','Ế':'e','Ể':'e','Ễ':'e','Ệ':'e',
        'Ì':'i','Í':'i','Ỉ':'i','Ĩ':'i','Ị':'i',
        'Ò':'o','Ó':'o','Ỏ':'o','Õ':'o','Ọ':'o','Ô':'o','Ồ':'o','Ố':'o','Ổ':'o','Ỗ':'o','Ộ':'o','Ơ':'o','Ờ':'o','Ớ':'o','Ở':'o','Ỡ':'o','Ợ':'o',
        'Ù':'u','Ú':'u','Ủ':'u','Ũ':'u','Ụ':'u','Ư':'u','Ừ':'u','Ứ':'u','Ử':'u','Ữ':'u','Ự':'u',
        'Ỳ':'y','Ý':'y','Ỷ':'y','Ỹ':'y','Ỵ':'y',
        'Đ':'d'
    };
    return text.split('').map(c => vietnameseMap[c] || c).join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const mapMovieStatus = (status) => {
    if (!status) return "Đang chiếu";
    const s = status.toLowerCase();
    if (s === "completed" || s.includes("hoàn tất") || s.includes("full") || s.includes("hoàn thành")) return "Hoàn thành";
    if (s === "trailer" || s.includes("sắp chiếu")) return "Sắp chiếu";
    return "Đang chiếu";
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runCloudSync() {
    console.log(`[CloudSync] 🚀 Bắt đầu quét và đồng bộ tập mới trên Cloud...`);
    const moviesSnap = await getDocs(collection(db, "Movies"));
    const allMovies = [];
    moviesSnap.forEach(d => allMovies.push({ id: d.id, ...d.data() }));

    const targetMovies = allMovies.filter(m => {
        const status = (m.status || '').toLowerCase();
        return status !== 'hoàn thành' && status !== 'completed';
    });

    console.log(`[CloudSync] 🔍 Tìm thấy ${targetMovies.length}/${allMovies.length} phim đang chiếu cần kiểm tra.`);

    let totalNew = 0;
    let totalFixed = 0;
    let totalUpdatedMovies = 0;

    for (let i = 0; i < targetMovies.length; i++) {
        const movie = targetMovies[i];
        let activeSlug = movie.slug || slugify(movie.otherName || movie.name);
        if (!activeSlug) continue;

        try {
            const res = await fetch(`${BASE_URL}/phim/${activeSlug}`, { headers: { 'accept': 'application/json' } });
            if (!res.ok) continue;
            const detail = await res.json();
            const movieData = detail?.movie;
            const episodesData = detail?.episodes || [];
            if (!episodesData || episodesData.length === 0) continue;

            // Lấy danh sách tập hiện có của phim trong Firestore
            const epSnap = await getDocs(query(collection(db, "Episodes"), where("movieID", "==", movie.id)));
            const currentEpMap = new Map();
            epSnap.forEach(d => {
                const data = d.data();
                if (data.numberEpisode) currentEpMap.set(Number(data.numberEpisode), { id: d.id, ...data });
            });

            const firstServer = episodesData[0];
            const serverData = firstServer?.server_data || [];
            let movieNewEps = 0;
            let movieFixedEps = 0;
            let highestEp = movie.endEpisode || 0;

            for (const ep of serverData) {
                const epNum = parseInt(ep.name.replace(/[^0-9]/g, '')) || 1;
                if (epNum > highestEp) highestEp = epNum;

                const existingEp = currentEpMap.get(epNum);

                if (!existingEp) {
                    const epRef = doc(collection(db, "Episodes"));
                    await setDoc(epRef, {
                        id: epRef.id,
                        movieID: movie.id,
                        title: movie.name || movie.otherName || '',
                        numberEpisode: epNum,
                        nameEpisode: ep.name || `Tập ${epNum}`,
                        url: ep.link_embed || '',
                        urlM3u8: ep.link_m3u8 || '',
                        description: "Đang cập nhật...",
                        createdAt: new Date().toISOString(),
                    });
                    currentEpMap.set(epNum, { id: epRef.id, numberEpisode: epNum });
                    movieNewEps++;
                    totalNew++;
                } else {
                    const isDummyOrBroken = !existingEp.url || 
                                            !existingEp.url.startsWith('http') || 
                                            existingEp.url !== ep.link_embed || 
                                            existingEp.urlM3u8 !== ep.link_m3u8;
                    if (isDummyOrBroken && (ep.link_embed || ep.link_m3u8)) {
                        const epRef = doc(db, "Episodes", existingEp.id);
                        await updateDoc(epRef, {
                            url: ep.link_embed || existingEp.url || '',
                            urlM3u8: ep.link_m3u8 || existingEp.urlM3u8 || '',
                            nameEpisode: ep.name || existingEp.nameEpisode || `Tập ${epNum}`,
                            title: movie.name || movie.otherName || existingEp.title || '',
                            updatedAt: new Date().toISOString()
                        });
                        movieFixedEps++;
                        totalFixed++;
                    }
                }
            }

            if (movieNewEps > 0 || movieFixedEps > 0) {
                const movieRef = doc(db, "Movies", movie.id);
                const newStatus = movieData?.status ? mapMovieStatus(movieData.status) : (movie.status || 'Đang chiếu');
                await updateDoc(movieRef, {
                    endEpisode: Math.max(highestEp, movie.endEpisode || 1),
                    status: newStatus,
                    slug: activeSlug,
                    updatedAt: new Date().toISOString()
                });
                totalUpdatedMovies++;
                console.log(`[CloudSync] ✅ "${movie.otherName || movie.name}": +${movieNewEps} tập mới, sửa ${movieFixedEps} link tập.`);
            }
        } catch (e) {
            console.error(`[CloudSync] ❌ Lỗi xử lý "${movie.name}":`, e.message);
        }
        await sleep(350);
    }

    console.log(`[CloudSync] 🏁 Hoàn tất! Cập nhật ${totalUpdatedMovies} phim (+${totalNew} tập mới, sửa ${totalFixed} link).`);
}

runCloudSync().catch(err => {
    console.error("[CloudSync] Fatal error:", err);
    process.exit(1);
});
