import { useEffect, useState } from 'react';
import { collection, query, orderBy, documentId, limit, startAfter, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export default function useAdminCursor(collectionName, size = 20, revision = 0) {
    const [retry, setRetry] = useState(0);
    const key = `${collectionName}:${size}:${revision}:${retry}`;
    const [navigation, setNavigation] = useState({ key: '', cursor: null, history: [], page: 1 });
    const current = navigation.key === key ? navigation : { key, cursor: null, history: [], page: 1 };
    const requestKey = `${key}:${current.cursor?.id || ''}`;
    const [result, setResult] = useState({ key: '', rows: [], error: '', hasNext: false, last: null });
    const [count, setCount] = useState({ key: '', total: null });
    useEffect(() => {
        let active = true;
        const sort = collectionName === 'AdminTrashGroups' ? orderBy('deletedAt', 'desc') : collectionName === 'AdminActivity' ? orderBy('createdAt', 'desc') : orderBy(documentId());
        getDocs(query(collection(db, collectionName), sort, ...(current.cursor ? [startAfter(current.cursor)] : []), limit(size + 1))).then(snapshot => {
            if (!active) return;
            const page = snapshot.docs.slice(0, size);
            setResult({ key: requestKey, rows: page.map(item => ({ ...item.data(), id: item.id })), error: '', hasNext: snapshot.size > size, last: page.at(-1) || null });
        }).catch(error => { if (active) setResult({ key: requestKey, rows: [], hasNext: false, error: error.message || 'Không tải được dữ liệu.' }); });
        return () => { active = false; };
    }, [collectionName, size, current.cursor, requestKey]);
    useEffect(() => {
        let active = true;
        getCountFromServer(collection(db, collectionName)).then(snapshot => { if (active) setCount({ key, total: snapshot.data().count }); }).catch(() => {});
        return () => { active = false; };
    }, [collectionName, key]);
    const loading = result.key !== requestKey;
    return { ...result, rows: loading ? [] : result.rows, error: loading ? '' : result.error, loading, total: count.key === key ? count.total : null, page: current.page,
        next: () => { if (result.hasNext && !loading) setNavigation({ key, cursor: result.last, history: [...current.history, current.cursor], page: current.page + 1 }); },
        previous: () => { if (current.page > 1) setNavigation({ key, cursor: current.history.at(-1), history: current.history.slice(0, -1), page: current.page - 1 }); },
        reload: () => setRetry(p => p + 1),
    };
}
