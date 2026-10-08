import { notifyAdmin } from '../services/adminOperations';
import { useEffect, useState } from 'react';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export default function useAdminEntities(collectionName, ids = []) {
    const key = JSON.stringify([...new Set(ids)].filter(Boolean).sort());
    const [items, setItems] = useState([]);
    useEffect(() => {
        let active = true;
        const unique = JSON.parse(key);
        if (!unique.length) return;
        const load = async () => {
            const result = [];
            for (let index = 0; index < unique.length; index += 30) {
                const snapshot = await getDocs(query(collection(db, collectionName), where(documentId(), 'in', unique.slice(index, index + 30))));
                result.push(...snapshot.docs.map(item => ({ ...item.data(), id: item.id })));
            }
            if (active) setItems(result);
        };
        load().catch(() => { if (active) { setItems([]); notifyAdmin('Không tải được thông tin liên quan. Vui lòng kiểm tra kết nối rồi tải lại.', 'warning'); } });
        return () => { active = false; };
    }, [collectionName, key]);
    return key === '[]' ? [] : items.filter(item => JSON.parse(key).includes(item.id));
}
