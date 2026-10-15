export function createChatCatalogGate() {
    let snapshot = {};
    const listeners = new Set();
    return {
        update(value) { snapshot = value; listeners.forEach(check => check()); },
        wait({ signal, timeoutMs = 25000 } = {}) {
            return new Promise((resolve, reject) => {
                let timer;
                const finish = (error, value) => {
                    clearTimeout(timer);
                    listeners.delete(check);
                    signal?.removeEventListener('abort', abort);
                    if (error) reject(error); else resolve(value);
                };
                const abort = () => finish(new DOMException('Chat cancelled', 'AbortError'));
                const check = () => {
                    if (signal?.aborted) abort();
                    else if (snapshot.ready) finish(null, snapshot);
                    else if (snapshot.error) finish(snapshot.error);
                };
                listeners.add(check);
                signal?.addEventListener('abort', abort, { once: true });
                timer = setTimeout(() => finish(new Error('catalog-timeout')), timeoutMs);
                check();
            });
        },
    };
}
