import { PUBLIC_COLLECTIONS, publicCatalogRecord } from '../../src/utils/publicCatalogFields.js';

// Checkpoint is saved IN the Git snapshot. A failed push can safely replay edits;
// it never marks database changes as published before they are actually deployed.
export async function applyCatalogChanges(snapshot, { loadChanges, readRecord, maxChanges = 1000, pageSize = 100 }) {
    const maps = Object.fromEntries(PUBLIC_COLLECTIONS.map(name => [name, new Map((snapshot.catalog[name] || []).map(item => [item.id, item]))]));
    let cursor = snapshot.changeCursor || null, processed = 0, changed = 0, waiting = false;
    const apply = (name, id, record) => {
        if (record?.crawlImportState === 'pending') return;
        const previous = maps[name].get(id);
        if (!record) { if (maps[name].delete(id)) changed++; return; }
        const next = publicCatalogRecord({ ...record, id });
        if (JSON.stringify(previous) !== JSON.stringify(next)) { maps[name].set(id, next); changed++; }
    };
    try {
        while (processed < maxChanges) {
            const markers = await loadChanges(cursor, Math.min(pageSize, maxChanges - processed));
            if (!markers.length) break;
            for (const marker of markers) {
                if (PUBLIC_COLLECTIONS.includes(marker.collection) && typeof marker.recordID === 'string' && marker.recordID && !marker.recordID.includes('/')) {
                    apply(marker.collection, marker.recordID, await readRecord(marker.collection, marker.recordID));
                }
                cursor = marker.cursor;
                processed++;
            }
            if (markers.length < pageSize) break;
        }
    } catch (error) {
        if (!['background-quota', 'resource-exhausted'].includes(error.code)) throw error;
        waiting = true; // Already applied records can publish; the failed record keeps its old cursor.
    }
    return { catalog: Object.fromEntries(PUBLIC_COLLECTIONS.map(name => [name, [...maps[name].values()]])),
        changeCursor: cursor, processed, changed, waiting, apply,
        // Reconciliation calls apply() as well, so serialize only AFTER that finishes.
        materialize: () => Object.fromEntries(PUBLIC_COLLECTIONS.map(name => [name, [...maps[name].values()]])) };
}
