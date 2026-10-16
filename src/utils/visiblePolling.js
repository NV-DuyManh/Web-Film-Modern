// Public catalog refreshes can wait while a tab is hidden or offline.
export function startVisiblePolling(update, { intervalMs = 60000, immediate = true,
    page = document, win = window, network = navigator, now = Date.now } = {}) {
    let stopped = false, pending = false;
    let lastAttempt = immediate ? -Infinity : now();
    const refresh = async () => {
        if (stopped || pending || page.visibilityState === 'hidden' || network.onLine === false || now() - lastAttempt < intervalMs) return;
        lastAttempt = now();
        pending = true;
        try { await update(); }
        catch { /* Each subscriber reports its own failures; retry at the next interval. */ }
        finally { pending = false; }
    };
    const timer = win.setInterval(refresh, intervalMs);
    page.addEventListener('visibilitychange', refresh);
    win.addEventListener('online', refresh);
    if (immediate) void refresh();
    return () => {
        stopped = true;
        win.clearInterval(timer);
        page.removeEventListener('visibilitychange', refresh);
        win.removeEventListener('online', refresh);
    };
}
