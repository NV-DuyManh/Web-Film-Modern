import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, query, where, limit, getDocs, getDocFromServer, updateDoc, setDoc, writeBatch, terminate } from 'firebase/firestore';
import { movieMaintenancePatch, exactDuplicateMovieGroups, canRetireEmptyImport } from '../src/utils/movieMaintenance.js';

const db = getFirestore(initializeApp({ projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk' }, 'catalog-maintenance'));
const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');
const settingsRef = doc(db, 'Settings', 'CatalogMaintenance');
const summary = { checked: 0, repaired: 0, archivedDuplicates: 0, protectedDuplicates: 0 };
const containsID = (value, id) => value === id || (value && typeof value === 'object' && Object.values(value).some(item => containsID(item, id)));

async function hasReferences(movieID) {
    const relations = ['Episodes', 'ShowTimes', 'RentMovies', 'Comments', 'Reviews', 'Favorites', 'MoviesSave', 'WatchHistory']
        .flatMap(name => [[name, 'movieID'], [name, 'movieId']]);
    relations.push(['Folders', 'movies']);
    for (const [name, field] of relations) {
        const snapshot = await getDocs(query(collection(db, name), where(field, field === 'movies' ? 'array-contains' : '==', movieID), limit(1)));
        if (!snapshot.empty) return true;
    }
    // Favorites and custom lists are also stored inside user documents.
    const users = await getDocs(collection(db, 'Users'));
    return users.docs.some(item => containsID(item.data(), movieID));
}

async function maintain() {
    const settings = (await getDocFromServer(settingsRef)).data() || {};
    const vietnamDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const lastSuccessAt = Number(settings.lastSuccessAt || 0);
    if (!force && lastSuccessAt > 0 && vietnamDay.format(lastSuccessAt) === vietnamDay.format(Date.now())) {
        console.log('[CatalogMaintenance] Chưa đến lần kiểm tra tiếp theo.');
        return;
    }
    if (apply) await setDoc(settingsRef, { lastStartedAt: Date.now(), lockUntil: Date.now() + 30 * 60000 }, { merge: true });
    const plans = (await getDocs(collection(db, 'Plans'))).docs.map(item => ({ ...item.data(), id: item.id }));
    if (!plans.length) throw new Error('Chưa tải được gói; không cập nhật dữ liệu.');
    const movies = (await getDocs(collection(db, 'Movies'))).docs.map(item => ({ ...item.data(), id: item.id }));
    summary.checked = movies.length;
    for (const movie of movies) {
        if (!movieMaintenancePatch(movie, plans, () => 0)) continue;
        if (!apply) { summary.repaired++; continue; }
        const ref = doc(db, 'Movies', movie.id);
        const live = await getDocFromServer(ref);
        if (!live.exists()) continue;
        const patch = movieMaintenancePatch(live.data(), plans);
        if (!patch) continue;
        await updateDoc(ref, patch);
        Object.assign(movie, patch);
        summary.repaired++;
    }

    for (const group of exactDuplicateMovieGroups(movies)) {
        // Automatically retire only empty abandoned import copies. Copies containing
        // episodes, payments, user data or distinct metadata are preserved.
        const primary = [...group].sort((a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0) || a.id.localeCompare(b.id))[0];
        for (const duplicate of group.filter(item => item.id !== primary.id)) {
            if (!canRetireEmptyImport(duplicate, false) || !canRetireEmptyImport(duplicate, await hasReferences(duplicate.id))) {
                summary.protectedDuplicates++;
                continue;
            }
            if (!apply) { summary.archivedDuplicates++; continue; }
            const ref = doc(db, 'Movies', duplicate.id);
            const [current, canonical] = await Promise.all([getDocFromServer(ref), getDocFromServer(doc(db, 'Movies', primary.id))]);
            if (!current.exists() || !canonical.exists() || !exactDuplicateMovieGroups([{ ...current.data(), id: duplicate.id }, { ...canonical.data(), id: primary.id }]).length) continue;
            const batch = writeBatch(db);
            // Archive and remove atomically; no episode or user record is deleted.
            batch.set(doc(db, 'MovieMaintenanceArchive', `${duplicate.id}-${Date.now()}`), {
                movie: current.data(), originalID: duplicate.id, canonicalID: primary.id, archivedAt: Date.now(),
            });
            batch.delete(ref);
            await batch.commit();
            summary.archivedDuplicates++;
        }
    }
    if (apply) await setDoc(settingsRef, { lockUntil: 0, lastSuccessAt: Date.now(), lastSummary: summary, commit: process.env.GITHUB_SHA || '' }, { merge: true });
    console.log('[CatalogMaintenance]', JSON.stringify({ ...summary, apply }));
}

maintain().catch(async error => {
    if (apply) await setDoc(settingsRef, { lockUntil: 0, lastErrorAt: Date.now(), lastError: String(error.code || error.message).slice(0, 300) }, { merge: true }).catch(() => {});
    console.error('[CatalogMaintenance]', error.code || '', error.message);
    process.exitCode = 1;
}).finally(() => terminate(db));
