import { writeBatch, serverTimestamp } from 'firebase/firestore';
import { changesPublicCatalog } from '../utils/publicCatalogFields.js';
import { doc } from 'firebase/firestore';
import { publicCatalogCache } from './publicCatalogCache.js';
import { publicCatalogRecord, PUBLIC_COLLECTIONS } from '../utils/publicCatalogFields.js';

export function catalogChange(reference, values) {
    const name = reference.parent.id;
    if (!changesPublicCatalog(name, values)) return null;
    return { ref: doc(reference.firestore, 'CatalogChanges', `${encodeURIComponent(name)}:${encodeURIComponent(reference.id)}`),
        values: { collection: name, recordID: reference.id, changedAt: serverTimestamp() } };
}

// The change marker and the actual edit commit together, including deletes.
// One marker per entity bounds storage even when the same film changes repeatedly.
export async function trackedWrite(reference, values, { operation = 'set', merge = false } = {}) {
    const batch = writeBatch(reference.firestore);
    if (operation === 'delete') batch.delete(reference);
    else if (operation === 'update') batch.update(reference, values);
    else batch.set(reference, values, { merge });
    const change = catalogChange(reference, operation === 'delete' ? null : values);
    if (change) batch.set(change.ref, change.values);
    await batch.commit();
    if (PUBLIC_COLLECTIONS.includes(reference.parent.id)) {
        publicCatalogCache.patch(reference.parent.id, publicCatalogRecord({ ...values, id: reference.id }), operation === 'delete');
    }
}
export const trackedSetDoc = (reference, values, options) => trackedWrite(reference, values, options);
export const trackedUpdateDoc = (reference, values) => trackedWrite(reference, values, { operation: 'update' });
export const trackedDeleteDoc = reference => trackedWrite(reference, null, { operation: 'delete' });
