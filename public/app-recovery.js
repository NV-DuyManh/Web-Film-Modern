/* This classic script must not depend on the application's module bundle. */
(() => {
    const retryKey = 'mfilm_asset_recovery';
    const retryParam = '__mfilm_reload';
    let recovering = false;

    function showRecovery(retry) {
        const root = document.getElementById('root');
        if (!root || root.hasChildNodes()) return;
        const panel = document.createElement('div');
        panel.style.cssText = 'min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;background:#111827;color:#fff;font:16px system-ui;text-align:center';
        const text = document.createElement('p');
        text.textContent = retry ? 'Đang tải lại phiên bản mới của MFILM…' : 'Không tải được MFILM. Vui lòng kiểm tra kết nối và thử lại.';
        panel.append(text);
        if (!retry) {
            const button = document.createElement('button');
            button.textContent = 'Tải lại trang';
            button.style.cssText = 'padding:12px 24px;border:0;border-radius:12px;background:#facc15;color:#111827;font:600 14px system-ui;cursor:pointer';
            button.onclick = () => {
                try { sessionStorage.removeItem(retryKey); } catch { /* Storage may be unavailable. */ }
                reload();
            };
            panel.append(button);
        }
        root.append(panel);
    }

    function reload() {
        const url = new URL(location.href);
        url.searchParams.set(retryParam, String(Date.now()));
        location.replace(url.href);
    }

    async function recover(entry) {
        if (recovering) return;
        recovering = true;
        let tried = new URL(location.href).searchParams.has(retryParam);
        try {
            const previous = Number(sessionStorage.getItem(retryKey));
            tried ||= previous > 0 && Date.now() - previous < 60000;
            sessionStorage.setItem(retryKey, String(Date.now()));
        } catch { /* The URL guard also prevents reload loops. */ }
        showRecovery(!tried);
        if (tried) return;

        try {
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.filter(name => name === 'assets-cache' || name.startsWith('workbox-precache')).map(async name => {
                    const cache = await caches.open(name);
                    const requests = await cache.keys();
                    await Promise.all(requests.filter(request => new URL(request.url).pathname.startsWith('/assets/') && /\.(js|css)$/i.test(new URL(request.url).pathname)).map(async request => {
                        const response = await cache.match(request);
                        if (response?.headers.get('content-type')?.includes('text/html')) await cache.delete(request);
                    }));
                }));
            }
            // Refresh the browser HTTP cache as well as any service-worker cache.
            const sources = [entry.src, ...Array.from(document.querySelectorAll('link[rel="modulepreload"]'), link => link.href)];
            await Promise.all(sources.filter(src => new URL(src, location.href).origin === location.origin).map(src => fetch(src, { cache: 'reload', signal: AbortSignal.timeout(5000) }).catch(() => {})));
        } catch { /* A fresh navigation is still useful if cache access fails. */ }
        reload();
    }

    window.addEventListener('error', event => {
        const script = event.target;
        if (script?.tagName !== 'SCRIPT' || script.type !== 'module' || !script.src) return;
        const url = new URL(script.src, location.href);
        if (url.origin === location.origin && url.pathname.startsWith('/assets/')) void recover(script);
    }, true);

    window.addEventListener('load', () => {
        if (recovering) return;
        if (document.getElementById('root')?.hasChildNodes()) {
            try { sessionStorage.removeItem(retryKey); } catch { /* Optional storage. */ }
            const url = new URL(location.href);
            if (url.searchParams.has(retryParam)) {
                url.searchParams.delete(retryParam);
                history.replaceState(history.state, '', url.href);
            }
        }
    });
})();
