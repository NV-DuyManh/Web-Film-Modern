// Preserve Swiper's own resize handling, but defer it while a section is offscreen.
export function observeVisibleSwiperResize(swiper) {
    const element = swiper.el;
    const document = element.ownerDocument;
    const view = document.defaultView;
    let visible = !view.IntersectionObserver;
    let dirty = true;
    let disposed = false;
    let frameId = null;

    const schedule = () => {
        if (disposed || swiper.destroyed || !visible || document.hidden || !dirty || frameId !== null) return;
        frameId = view.requestAnimationFrame(() => {
            frameId = null;
            if (disposed || swiper.destroyed || !visible || document.hidden) return;
            dirty = false;
            // updateOnWindowResize=false still attaches Swiper's core onResize to this event.
            // This retains breakpoint, loop and active-slide behavior from the library.
            swiper.emit('observerUpdate');
        });
    };
    const resized = () => { dirty = true; schedule(); };
    const intersection = view.IntersectionObserver && new view.IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        schedule();
    }, { rootMargin: '300px' });
    const resize = view.ResizeObserver && new view.ResizeObserver(resized);
    intersection?.observe(element);
    resize?.observe(element);
    view.addEventListener('resize', resized);
    document.addEventListener('visibilitychange', schedule);
    schedule();

    const cleanup = () => {
        if (disposed) return;
        disposed = true;
        if (frameId !== null) view.cancelAnimationFrame(frameId);
        intersection?.disconnect();
        resize?.disconnect();
        view.removeEventListener('resize', resized);
        document.removeEventListener('visibilitychange', schedule);
        swiper.off('destroy', cleanup);
    };
    swiper.on('destroy', cleanup);
    return cleanup;
}
