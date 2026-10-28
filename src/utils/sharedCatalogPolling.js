// One scheduler per resource, regardless of how many page sections consume it.
export function createSharedCatalogPolling({ load, subscribe, startPolling }) {
    const resources = new Map();
    return (name, callback, onError, intervalMs) => {
        let entry = resources.get(name);
        if (!entry) {
            entry = { consumers: new Set(), value: undefined, pending: null };
            resources.set(name, entry);
            entry.publish = value => {
                entry.value = value;
                for (const consumer of entry.consumers) consumer.callback(value);
            };
            entry.update = () => {
                if (entry.pending) return entry.pending;
                entry.pending = Promise.resolve().then(() => load(name)).then(entry.publish).catch(error => {
                    for (const consumer of entry.consumers) consumer.onError?.(error);
                }).finally(() => { entry.pending = null; });
                return entry.pending;
            };
        }
        const consumer = { callback, onError };
        entry.consumers.add(consumer);
        if (!entry.stop) {
            entry.unsubscribe = subscribe(name, entry.publish);
            entry.stop = startPolling(entry.update, { intervalMs });
        } else if (entry.value !== undefined) callback(entry.value);
        return () => {
            entry.consumers.delete(consumer);
            if (!entry.consumers.size) {
                entry.stop?.(); entry.unsubscribe?.();
                resources.delete(name);
            }
        };
    };
}
