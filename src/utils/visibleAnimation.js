// Schedule work only while the element and the browser tab are visible.
export function observeVisibleAnimation(element, onFrame, onResume = () => {}) {
    const document = element.ownerDocument;
    const view = document.defaultView;
    let visible = !view.IntersectionObserver;
    let running = false;
    let disposed = false;
    let frameId = null;
    let lastTime = 0;
    let pausedAt = null;

    const tick = time => {
        frameId = null;
        if (!running) return;
        onFrame(time, time - lastTime);
        lastTime = time;
        if (running) frameId = view.requestAnimationFrame(tick);
    };

    const stop = () => {
        if (!running) return;
        running = false;
        if (frameId !== null) view.cancelAnimationFrame(frameId);
        frameId = null;
        pausedAt = view.performance.now();
    };

    const update = () => {
        if (disposed) return;
        if (!visible || document.hidden) {
            stop();
        } else if (!running) {
            lastTime = view.performance.now();
            if (pausedAt !== null) onResume(lastTime - pausedAt);
            pausedAt = null;
            running = true;
            frameId = view.requestAnimationFrame(tick);
        }
    };

    const observer = view.IntersectionObserver && new view.IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        update();
    });
    observer?.observe(element);
    document.addEventListener('visibilitychange', update);
    update();

    return () => {
        disposed = true;
        stop();
        observer?.disconnect();
        document.removeEventListener('visibilitychange', update);
    };
}
