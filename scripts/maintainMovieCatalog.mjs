import { backgroundFirestore } from './lib/backgroundFirestore.mjs';
import { nextQuotaReset } from '../src/utils/backgroundQuota.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, query, where, limit, getDocs, getDocFromServer, setDoc, terminate, orderBy, documentId, startAfter } from 'firebase/firestore';
import { movieMaintenancePatch, exactDuplicateMovieGroups, canRetireEmptyImport } from '../src/utils/movieMaintenance.js';

const db = getFirestore(initializeApp({ projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk' }, 'catalog-maintenance'));
const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');
const settingsRef = doc(db, 'Settings', 'CatalogMaintenance');
let io;
let usersCache;
const readAll = async name => {
    const items = []; let cursor;
    while (true) {
        const request = query(collection(db, name), orderBy(documentId()), limit(250), ...(cursor ? [startAfter(cursor)] : []));
        const snapshot = io ? await io.query(request, 250) : await getDocs(request);
        items.push(...snapshot.docs.map(value => ({ ...value.data(), id: value.id })));
        if (snapshot.size < 250) return items; cursor = snapshot.docs.at(-1);
    }
};
const read = reference => io ? io.read(reference) : getDocFromServer(reference);
const summary = { checked: 0, repaired: 0, archivedDuplicates: 0, protectedDuplicates: 0 };
const containsID = (value, id) => value === id || (value && typeof value === 'object' && Object.values(value).some(item => containsID(item, id)));

async function hasReferences(movieID) {
    const relations = ['Episodes', 'ShowTimes', 'RentMovies', 'Comments', 'Reviews', 'Favorites', 'MoviesSave', 'WatchHistory']
        .flatMap(name => [[name, 'movieID'], [name, 'movieId']]);
    relations.push(['Folders', 'movies']);
    for (const [name, field] of relations) {
        const request = query(collection(db, name), where(field, field === 'movies' ? 'array-contains' : '==', movieID), limit(1));
        const snapshot = io ? await io.query(request, 1) : await getDocs(request);
        if (!snapshot.empty) return true;
    }
    // Do not scan every account to decide whether an import can be retired.
    for (const field of ['listFavorite', 'listSave']) {
        const request = query(collection(db, 'Users'), where(field, 'array-contains', movieID), limit(1));
        const snapshot = io ? await io.query(request, 1) : await getDocs(request);
        if (!snapshot.empty) return true;
    }
    // Legacy custom lists can contain nested references. Inspect at most 250
    // accounts, once per run; preserve the duplicate if the check is incomplete.
    if (!usersCache) {
        const request = query(collection(db, 'Users'), orderBy(documentId()), limit(250));
        const snapshot = io ? await io.query(request, 250) : await getDocs(request);
        usersCache = { complete: snapshot.size < 250, items: snapshot.docs.map(item => item.data()) };
    }
    return !usersCache.complete || usersCache.items.some(item => containsID(item, movieID));
}

async function maintain() {
    const settings = (await getDocFromServer(settingsRef)).data() || {};
    if (Number(settings.resumeAt) > Date.now()) { console.log('Waiting for daily background budget reset.'); return; }
    const vietnamDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const lastSuccessAt = Number(settings.lastSuccessAt || 0);
    if (!force && lastSuccessAt > 0 && vietnamDay.format(lastSuccessAt) === vietnamDay.format(Date.now())) {
        console.log('[CatalogMaintenance] Chưa đến lần kiểm tra tiếp theo.');
        return;
    }
    if (apply) io = await backgroundFirestore(db);
    const plans = await readAll('Plans');
    if (!plans.length) throw new Error('Chưa tải được gói; không cập nhật dữ liệu.');
    const constraints = [orderBy(documentId()), limit(250)];
    if (settings.auditCursor) constraints.push(startAfter(settings.auditCursor));
    const request = query(collection(db, 'Movies'), ...constraints);
    const page = io ? await io.query(request, 250) : await getDocs(request);
    const movies = page.docs.map(item => ({ ...item.data(), id: item.id }));
    const auditCursor = page.size < 250 ? '' : page.docs.at(-1).id;
    summary.checked = movies.length;
    for (const movie of movies) {
        if (!movieMaintenancePatch(movie, plans, () => 0)) continue;
        if (!apply) { summary.repaired++; continue; }
        const ref = doc(db, 'Movies', movie.id);
        const live = await read(ref);
        if (!live.exists()) continue;
        const patch = movieMaintenancePatch(live.data(), plans);
        if (!patch) continue;
        await io.update(ref, patch);
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
            const [current, canonical] = await Promise.all([getDocFromServer(ref), read(doc(db, 'Movies', primary.id))]);
            if (!current.exists() || !canonical.exists() || !exactDuplicateMovieGroups([{ ...current.data(), id: duplicate.id }, { ...canonical.data(), id: primary.id }]).length) continue;
            await io.archiveAndRemove(doc(db, 'MovieMaintenanceArchive', `${duplicate.id}-${Date.now()}`), ref, {
                movie: current.data(), originalID: duplicate.id, canonicalID: primary.id, archivedAt: Date.now(),
            });
            summary.archivedDuplicates++;
        }
    }
    if (apply) await io.set(settingsRef, { auditCursor, resumeAt: 0, lastSuccessAt: Date.now(), lastSummary: summary, commit: process.env.GITHUB_SHA || '' }, { merge: true });
    console.log('[CatalogMaintenance]', JSON.stringify({ ...summary, apply }));
}

maintain().catch(async error => {
    if (error.code === 'background-quota' || error.code === 'resource-exhausted') {
        await setDoc(settingsRef, { resumeAt: error.resumeAt || nextQuotaReset(), lastError: error.message }, { merge: true });
        console.log('[CatalogMaintenance] Daily budget reached; remaining work waits for reset.'); return;
    }
    console.error('[CatalogMaintenance]', error.code || '', error.message);
    process.exitCode = 1;
}).finally(async () => { try { await io?.flush(); } finally { await terminate(db); } });
