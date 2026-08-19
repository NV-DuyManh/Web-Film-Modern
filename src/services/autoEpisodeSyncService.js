import { db } from '../config/firebaseConfig';
import { collection, doc, setDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { fetchMovieDetails, mapMovieStatus, searchMovies } from './kkphimService';

// Helper slugify
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

// Khóa chống trùng lặp tiến trình
let isSyncingGlobal = false;
const syncLocks = new Set();

/**
 * Tự động đồng bộ tập mới cho 1 bộ phim cụ thể (hỗ trợ cả các phim cũ bị thiếu slug hoặc thiếu tập)
 * @param {Object} movie - Đối tượng phim từ database
 * @param {Array} existingEpisodes - Danh sách tập hiện tại của phim (nếu có)
 * @param {Boolean} forceCheck - Bỏ qua rate-limit để quét ngay
 */
export const syncSingleMovieEpisodes = async (movie, existingEpisodes = [], forceCheck = false) => {
    if (!movie || !movie.id) return { updated: false, newEpsCount: 0 };
    if (syncLocks.has(movie.id)) return { updated: false, newEpsCount: 0 };

    // Bỏ qua nếu phim đã hoàn thành từ lâu (trừ khi ép buộc quét lại)
    const currentStatus = (movie.status || '').toLowerCase();
    if (!forceCheck && (currentStatus === 'hoàn thành' || currentStatus === 'completed')) {
        return { updated: false, newEpsCount: 0 };
    }

    // Rate-limit kiểm tra lại 1 bộ phim trong 1 session (10 phút / lần)
    const movieLastSyncKey = `last_sync_movie_${movie.id}`;
    const lastSyncTime = Number(sessionStorage.getItem(movieLastSyncKey) || 0);
    const now = Date.now();
    if (!forceCheck && (now - lastSyncTime < 10 * 60 * 1000)) {
        return { updated: false, newEpsCount: 0 };
    }

    syncLocks.add(movie.id);
    sessionStorage.setItem(movieLastSyncKey, now.toString());

    try {
        let activeSlug = movie.slug;

        // Nếu phim cũ trong DB chưa có slug -> tự động tìm slug trên KKPhim
        if (!activeSlug) {
            const candidateSlug = slugify(movie.otherName || movie.name || '');
            if (candidateSlug) {
                try {
                    const testDetail = await fetchMovieDetails(candidateSlug);
                    if (testDetail?.movie) {
                        activeSlug = candidateSlug;
                        await updateDoc(doc(db, "Movies", movie.id), { slug: activeSlug });
                    }
                } catch {
                    // Thử tìm kiếm theo tên phim trên KKPhim
                    try {
                        const searchResult = await searchMovies(movie.otherName || movie.name, 1, 5);
                        const items = searchResult?.data?.items || [];
                        if (items.length > 0) {
                            activeSlug = items[0].slug;
                            await updateDoc(doc(db, "Movies", movie.id), { slug: activeSlug });
                        }
                    } catch { /* ignore search error */ }
                }
            }
        }

        if (!activeSlug) {
            return { updated: false, newEpsCount: 0 };
        }

        let detail;
        try {
            detail = await fetchMovieDetails(activeSlug);
        } catch {
            return { updated: false, newEpsCount: 0 };
        }

        const movieData = detail?.movie;
        const episodesData = detail?.episodes || [];
        if (!episodesData || episodesData.length === 0) {
            return { updated: false, newEpsCount: 0 };
        }

        // Lấy danh sách số tập hiện có trong database của phim này
        let currentEpMap = new Map();
        existingEpisodes.forEach(e => {
            if (e.numberEpisode) currentEpMap.set(Number(e.numberEpisode), e);
        });

        // Nếu danh sách tập hiện có chưa được truyền vào, query từ Firestore
        if (currentEpMap.size === 0) {
            const epSnap = await getDocs(query(collection(db, "Episodes"), where("movieID", "==", movie.id)));
            epSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.numberEpisode) currentEpMap.set(Number(data.numberEpisode), { id: docSnap.id, ...data });
            });
        }

        let newEpsCount = 0;
        let updatedEpsCount = 0;
        let highestEp = movie.endEpisode || 0;

        const firstServer = episodesData[0];
        const serverData = firstServer?.server_data || [];

        for (const ep of serverData) {
            const epNum = parseInt(ep.name.replace(/[^0-9]/g, '')) || 1;
            if (epNum > highestEp) highestEp = epNum;

            const existingEp = currentEpMap.get(epNum);

            if (!existingEp) {
                // 1. Tập chưa có -> Thêm tập mới với link chuẩn từ KKPhim
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
                currentEpMap.set(epNum, { id: epRef.id, numberEpisode: epNum, url: ep.link_embed, urlM3u8: ep.link_m3u8 });
                newEpsCount++;
            } else {
                // 2. Tập ĐÃ CÓ nhưng URL bị sai, link rác/placeholder ("vdvdfv") hoặc khác link chuẩn KKPhim -> SỬA LẠI LINK CHUẨN!
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
                    updatedEpsCount++;
                }
            }
        }

        if (newEpsCount > 0 || updatedEpsCount > 0) {
            const movieRef = doc(db, "Movies", movie.id);
            const newStatus = movieData?.status ? mapMovieStatus(movieData.status) : (movie.status || 'Đang chiếu');
            await updateDoc(movieRef, {
                endEpisode: Math.max(highestEp, movie.endEpisode || 1),
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            console.log(`[AutoEpisodeSync] 🎬 Đã cập nhật phim "${movie.otherName || movie.name}": +${newEpsCount} tập mới, sửa lại ${updatedEpsCount} link tập.`);
            return { updated: true, newEpsCount, updatedEpsCount };
        }

        return { updated: false, newEpsCount: 0, updatedEpsCount: 0 };
    } catch (err) {
        console.warn(`[AutoEpisodeSync] Lỗi kiểm tra tập mới cho "${movie.name}":`, err.message);
        return { updated: false, newEpsCount: 0 };
    } finally {
        syncLocks.delete(movie.id);
    }
};

/**
 * Tự động chạy ngầm quét toàn bộ các phim đang chiếu trong Database của bạn
 * (Chạy tự động hoàn toàn bằng bộ nhớ RAM - KHÔNG tốn lượt đọc Firestore)
 * @param {Array} movies - Danh sách toàn bộ phim từ database
 * @param {Array} existingEpisodes - Danh sách toàn bộ tập phim từ cache bộ nhớ
 */
export const autoSyncAllOngoingMovies = async (movies = [], existingEpisodes = []) => {
    if (isSyncingGlobal) return;
    if (!movies || movies.length === 0) return;

    // Khoảng cách tối thiểu giữa 2 lần quét toàn bộ ngầm (mặc định 30 phút)
    const lastGlobalSync = Number(localStorage.getItem('last_auto_sync_all_movies') || 0);
    const now = Date.now();
    const SYNC_INTERVAL = 30 * 60 * 1000; // 30 phút

    if (now - lastGlobalSync < SYNC_INTERVAL) {
        return;
    }

    // Lọc ra các bộ phim có slug và chưa hoàn thành trong kho phim của bạn
    const targetMovies = movies.filter(m => {
        if (!m.slug) return false;
        const status = (m.status || '').toLowerCase();
        return status !== 'hoàn thành' && status !== 'completed';
    });

    if (targetMovies.length === 0) return;

    isSyncingGlobal = true;
    localStorage.setItem('last_auto_sync_all_movies', now.toString());
    console.log(`[AutoEpisodeSync] 🚀 Đang tự động kiểm tra tập mới cho ${targetMovies.length} phim đang chiếu trong kho phim...`);

    let totalNewEps = 0;
    let totalUpdatedMovies = 0;

    for (let i = 0; i < targetMovies.length; i++) {
        const movie = targetMovies[i];
        try {
            const movieEpisodes = existingEpisodes.filter(e => e.movieID === movie.id);
            const res = await syncSingleMovieEpisodes(movie, movieEpisodes);
            if (res.updated) {
                totalNewEps += res.newEpsCount;
                totalUpdatedMovies++;
            }
        } catch (e) {
            /* ignore individual errors */
        }
        // Delay nhẹ 350ms giữa các phim để tránh nghẽn API KKPhim
        await new Promise(r => setTimeout(r, 350));
    }

    isSyncingGlobal = false;
    if (totalUpdatedMovies > 0) {
        console.log(`[AutoEpisodeSync] 🎉 Hoàn tất: Đã tự động cập nhật ${totalUpdatedMovies} bộ phim (+${totalNewEps} tập mới)!`);
    } else {
        console.log(`[AutoEpisodeSync] ✔️ Toàn bộ ${targetMovies.length} phim đang chiếu trong kho phim đều đã có đủ các tập mới nhất.`);
    }
};
