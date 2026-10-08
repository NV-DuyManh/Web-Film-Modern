// Anchor both arrows to the poster, independently of titles, badges and row height.
export function observeMovieNavigation(wrapper) {
    if (!wrapper) return () => {};
    const document = wrapper.ownerDocument;
    const view = document.defaultView;
    let image;
    let imageHeight;
    let visible = !view.IntersectionObserver;
    let frameId = null;
    let disposed = false;

    const schedule = () => {
        if (disposed || !visible || document.hidden || frameId !== null) return;
        frameId = view.requestAnimationFrame(() => {
            frameId = null;
            if (disposed || !visible || document.hidden || !image?.isConnected) return;
            // Use resting layout so hovering a poster never makes its arrows jump.
            // offsetTop is relative to the parent's padding edge, so include nested borders.
            let top = 0;
            for (let node = image; node && node !== wrapper; node = node.offsetParent) {
                top += node.offsetTop;
                const parent = node.offsetParent;
                if (parent && parent !== wrapper) top += parseFloat(view.getComputedStyle(parent).borderTopWidth) || 0;
            }
            const height = imageHeight ?? image.getBoundingClientRect().height;
            if (!height) return;
            const value = `${top + height / 2}px`;
            if (wrapper.style.getPropertyValue('--movie-nav-center') !== value) {
                wrapper.style.setProperty('--movie-nav-center', value);
            }
        });
    };
    const resize = new view.ResizeObserver(entries => {
        const entry = entries.find(item => item.target === image);
        if (entry) imageHeight = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        schedule();
    });
    const attachImage = () => {
        const next = wrapper.querySelector('img');
        if (next !== image) {
            if (image) resize.unobserve(image);
            image = next;
            imageHeight = undefined;
            if (image) resize.observe(image);
        }
        schedule();
    };
    const mutation = new view.MutationObserver(attachImage);
    mutation.observe(wrapper, { childList: true, subtree: true });
    resize.observe(wrapper);
    const intersection = view.IntersectionObserver && new view.IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        schedule();
    }, { rootMargin: '300px' });
    intersection?.observe(wrapper);
    document.addEventListener('visibilitychange', schedule);
    attachImage();

    return () => {
        disposed = true;
        if (frameId !== null) view.cancelAnimationFrame(frameId);
        resize.disconnect();
        mutation.disconnect();
        intersection?.disconnect();
        document.removeEventListener('visibilitychange', schedule);
        wrapper.style.removeProperty('--movie-nav-center');
    };
}
