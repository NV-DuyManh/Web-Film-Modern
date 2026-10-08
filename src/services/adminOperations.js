import { collection, doc, getDoc, getDocs, query, where, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig.js';
import { safeAuditFields } from '../utils/adminData.js';

export function adminActor() {
    try {
        const user = JSON.parse(localStorage.getItem('isLogin') || 'null');
        return user?.role === 'admin' ? { id: user.id || '', name: user.name || 'Admin' } : null;
    } catch { return null; }
}

export function notifyAdmin(message, severity = 'success') {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mfilm-admin-notice', { detail: { message, severity } }));
}

export function adminAlert(message) {
    notifyAdmin(message, /thành công|success|hoàn tất/i.test(message) ? 'success' : 'error');
}

export async function recordAdminAction(action, collectionName, values) {
    const actor = adminActor();
    if (!actor) return;
    window.dispatchEvent(new CustomEvent('mfilm-admin-data-change', { detail: { collectionName } }));
    const ref = doc(collection(db, 'AdminActivity'));
    try {
        await setDoc(ref, { action, collectionName, entityID: values.id || '', entityName: values.name || values.title || '', fields: safeAuditFields(values), actor, createdAt: Date.now() });
    } catch {
        notifyAdmin('Đã lưu dữ liệu, nhưng chưa ghi được nhật ký thao tác.', 'warning');
    }
}

// Each original document and its archive are moved atomically. If a large movie
// needs several batches, completed parts remain recoverable under the same group.
export async function moveToAdminTrash(collectionName, values) {
    const root = await getDoc(doc(db, collectionName, values.id));
    if (!root.exists()) throw new Error('Dữ liệu không còn tồn tại. Vui lòng tải lại.');
    const groupID = doc(collection(db, 'AdminTrash')).id;
    const entries = [{ ref: root.ref, data: root.data(), collectionName, id: root.id }];
    if (collectionName === 'Movies') {
        for (const related of ['Episodes', 'ShowTimes', 'Comments', 'Reviews']) {
            const found = await getDocs(query(collection(db, related), where('movieID', '==', root.id)));
            for (const item of found.docs) entries.push({ ref: item.ref, data: item.data(), collectionName: related, id: item.id });
        }
    }
    // Root is moved last so an interrupted operation does not hide the movie first.
    const ordered = [...entries.slice(1), entries[0]];
    const actor = adminActor() || { id: '', name: 'Admin' };
    const groupRef = doc(db, 'AdminTrashGroups', groupID);
    await setDoc(groupRef, { collectionName, originalID: root.id, name: root.data().name || root.data().title || root.id, deletedAt: Date.now(), updatedAt: Date.now(), actor, total: entries.length, archived: 0, status: 'moving' });
    try {
    for (let start = 0; start < ordered.length; start += 200) {
        const batch = writeBatch(db);
        for (const entry of ordered.slice(start, start + 200)) {
            batch.set(doc(db, 'AdminTrash', `${groupID}_${entry.collectionName}_${entry.id}`), {
                groupID, collectionName: entry.collectionName, originalID: entry.id,
                rootCollection: collectionName, rootID: root.id, rootName: root.data().name || root.data().title || '',
                data: entry.data, deletedAt: Date.now(), actor,
            });
            batch.delete(entry.ref);
        }
        batch.set(groupRef, { archived: Math.min(start + 200, ordered.length), updatedAt: Date.now(), status: start + 200 >= ordered.length ? 'ready' : 'moving' }, { merge: true });
        await batch.commit();
    }
    } catch (error) {
        await setDoc(groupRef, { status: 'partial', error: 'Tác vụ bị gián đoạn; phần đã lưu vẫn có thể khôi phục.' }, { merge: true }).catch(() => {});
        throw error;
    }
    await recordAdminAction('trash', collectionName, { ...values, relatedCount: entries.length - 1 });
    notifyAdmin('Đã chuyển vào thùng rác. Bạn có thể khôi phục trong mục Vận hành.');
    return groupID;
}

export async function restoreAdminTrash(groupID) {
    const snapshot = await getDocs(query(collection(db, 'AdminTrash'), where('groupID', '==', groupID)));
    if (snapshot.empty) throw new Error('Mục này đã được khôi phục hoặc không còn tồn tại.');
    const entries = snapshot.docs.map(item => ({ ref: item.ref, ...item.data() }));
    // Check conflicts before restoring, including records recreated by a crawler.
    for (const entry of entries) {
        if ((await getDoc(doc(db, entry.collectionName, entry.originalID))).exists()) throw new Error('Trùng dữ liệu đang tồn tại. Chưa khôi phục để tránh ghi đè.');
    }
    const ordered = [...entries].sort((a, b) => Number(a.collectionName === a.rootCollection) - Number(b.collectionName === b.rootCollection));
    for (let start = 0; start < ordered.length; start += 200) {
        const batch = writeBatch(db);
        for (const entry of ordered.slice(start, start + 200)) {
            batch.set(doc(db, entry.collectionName, entry.originalID), entry.data);
            batch.delete(entry.ref);
        }
        await batch.commit();
    }
    const finish = writeBatch(db);
    finish.delete(doc(db, 'AdminTrashGroups', groupID));
    await finish.commit();
    await recordAdminAction('restore', entries[0].rootCollection, { id: entries[0].rootID, name: entries[0].rootName });
    notifyAdmin(`Đã khôi phục ${entries.length} bản ghi.`);
}
