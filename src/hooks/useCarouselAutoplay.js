import { useEffect } from 'react';

export default function useCarouselAutoplay(swiper, paused = false) {
    useEffect(() => {
        if (!swiper || swiper.destroyed || !swiper.autoplay) return;
        const root = swiper.el.closest('[data-carousel-autoplay]') || swiper.el;
        const document = root.ownerDocument;
        const view = document.defaultView;
        let visible = !view.IntersectionObserver;
        let hovering = root.matches(':hover');
        let disposed = false;
        const update = () => {
            if (disposed || swiper.destroyed) return;
            const shouldRun = visible && !document.hidden && !hovering && !paused && !root.contains(document.activeElement);
            if (shouldRun && !swiper.autoplay.running) swiper.autoplay.start();
            else if (!shouldRun && swiper.autoplay.running) swiper.autoplay.stop();
        };
        const enter = () => { hovering = true; update(); };
        const leave = () => { hovering = false; update(); };
        const focusOut = () => { queueMicrotask(update); };
        const observer = view.IntersectionObserver && new view.IntersectionObserver(entries => {
            visible = entries.some(entry => entry.isIntersecting);
            update();
        });
        observer?.observe(root);
        root.addEventListener('mouseenter', enter);
        root.addEventListener('mouseleave', leave);
        root.addEventListener('focusin', update);
        root.addEventListener('focusout', focusOut);
        document.addEventListener('visibilitychange', update);
        update();
        return () => {
            disposed = true;
            observer?.disconnect();
            root.removeEventListener('mouseenter', enter);
            root.removeEventListener('mouseleave', leave);
            root.removeEventListener('focusin', update);
            root.removeEventListener('focusout', focusOut);
            document.removeEventListener('visibilitychange', update);
            if (!swiper.destroyed) swiper.autoplay.stop();
        };
    }, [swiper, paused]);
}
