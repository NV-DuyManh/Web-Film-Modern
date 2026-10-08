import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, getCountFromServer, query, where, orderBy, documentId, startAfter, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { scanAdminPage } from '../utils/adminPaging';
import { movieMatchesFilters } from '../utils/adminData';
import { withNameRoutes, findRouteEntity } from '../utils/nameRoutes';

export async function findAdminMovie(value) {
    if (!value) return null;
    const bySlug = await getDocs(query(collection(db, 'Movies'), where('slug', '==', value), limit(20)));
    if (!bySlug.empty) return findRouteEntity(withNameRoutes(bySlug.docs.map(item => ({ ...item.data(), id: item.id })), { preferSlug: true }), value);
    const direct = await getDoc(doc(db, 'Movies', value));
    if (direct.exists()) return { ...direct.data(), id: direct.id };
    // Preserve legacy named/de-duplicated deep links; this fallback runs only
    // when opening such a link, never for the normal paged movie list.
    const catalog = await getDocs(collection(db, 'Movies'));
    return findRouteEntity(withNameRoutes(catalog.docs.map(item => ({ ...item.data(), id: item.id })), { preferSlug: true }), value) || null;
}

export default function useAdminMovies(keyword, filters, freePlanIDs, size, revision, collectionName = "Movies") {
    const [search, setSearch] = useState(keyword);
    useEffect(() => { const timer = setTimeout(() => setSearch(keyword), 350); return () => clearTimeout(timer); }, [keyword]);
    const key = JSON.stringify({ search, filters, freePlanIDs, size, revision, collectionName });
    const [navigation, setNavigation] = useState({ key: '', cursor: null, history: [], page: 1 });
    const current = navigation.key === key ? navigation : { key, cursor: null, history: [], page: 1 };
    const [result, setResult] = useState({ rows: [], loading: true, error: '', hasNext: false, cursor: null, total: null });
    const constraints = useMemo(() => {
        if (filters.planID) return [where('planID', '==', filters.planID)];
        if (filters.status) return [where('status', '==', filters.status)];
        if (filters.year) return [where('releaseYear', '==', Number(filters.year))];
        if (filters.category) return [where('listCategory', 'array-contains', filters.category)];
        return [];
    }, [filters.planID, filters.status, filters.year, filters.category]);
    useEffect(() => {
        let active = true;
        setResult(previous => ({ ...previous, loading: true, error: '', rows: [] }));
        const fetchChunk = async cursor => (await getDocs(query(collection(db, collectionName), ...constraints, orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(50)))).docs;
        const matches = async item => {
            const movie = { ...item.data(), id: item.id };
            // A metadata episode count is not proof that a playable episode exists.
            if (filters.quality === 'episodes') {
                if (!movieMatchesFilters(movie, { ...filters, quality: '' }, search, freePlanIDs)) return false;
                return (await getDocs(query(collection(db, 'Episodes'), where('movieID', '==', item.id), limit(1)))).empty;
            }
            return movieMatchesFilters(movie, filters, search, freePlanIDs);
        };
        scanAdminPage(fetchChunk, matches, current.cursor, size, () => !active).then(page => {
            if (active) setResult(previous => ({ ...previous, ...page, rows: page.rows.map(item => ({ ...item.data(), id: item.id })), loading: false }));
        }).catch(error => { if (active) setResult(previous => ({ ...previous, loading: false, error: error.message || 'Không tải được danh sách phim.' })); });
        return () => { active = false; };
        // The serialized key includes all filters and pagination reset values.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, current.cursor, constraints]);
    useEffect(() => {
        let active = true;
        setResult(previous => ({ ...previous, total: null }));
        if (!search && !Object.values(filters).some(Boolean)) getCountFromServer(collection(db, collectionName)).then(snapshot => { if (active) setResult(previous => ({ ...previous, total: snapshot.data().count })); }).catch(() => {});
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return { ...result, page: current.page,
        next: () => { if (!result.loading && result.hasNext) setNavigation({ key, cursor: result.cursor, history: [...current.history, current.cursor], page: current.page + 1 }); },
        previous: () => { if (current.page > 1) setNavigation({ key, cursor: current.history.at(-1), history: current.history.slice(0, -1), page: current.page - 1 }); },
    };
}
