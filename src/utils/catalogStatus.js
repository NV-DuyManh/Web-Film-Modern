const states = new Map();
const listeners = new Set();
const idle = Object.freeze({ status: 'idle', error: null });
export function getCatalogStatus(collection) { return states.get(collection) || idle; }
export function subscribeCatalogStatus(callback) { listeners.add(callback); return () => listeners.delete(callback); }
export function reportCatalogStatus(collection, status, error = null) {
    const previous = getCatalogStatus(collection);
    if (previous.status === status && previous.error?.code === error?.code) return;
    states.set(collection, { status, error });
    listeners.forEach(callback => callback());
}
