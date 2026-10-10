import { useEffect } from 'react';

export default function useCarouselAutoplay(swiper, paused = false) {
    useEffect(() => {
        if (!swiper || swiper.destroyed || !swiper.autoplay) return;
        const root = swiper.el.closest('[data-carousel-autoplay]') || swiper.el;
        const document = root.ownerDocument;
        const view = document.defaultView;
        let visible = !view.IntersectionObserver;
        let interacting = false;
        let disposed = false;
        const update = () => {
            if (disposed || swiper.destroyed) return;
            const shouldRun = visible && !document.hidden && !interacting && !paused && !root.contains(document.activeElement);
            if (shouldRun && !swiper.autoplay.running) swiper.autoplay.start();
            else if (!shouldRun && swiper.autoplay.running) swiper.autoplay.stop();
        };
        const beginInteraction = () => { interacting = true; update(); };
        const endInteraction = () => { interacting = false; update(); };
        const focusOut = () => { queueMicrotask(update); };
        const observer = view.IntersectionObserver && new view.IntersectionObserver(entries => {
            visible = entries.some(entry => entry.isIntersecting);
            update();
        });
        observer?.observe(root);
        root.addEventListener('pointerdown', beginInteraction);
        document.addEventListener('pointerup', endInteraction);
        document.addEventListener('pointercancel', endInteraction);
        root.addEventListener('focusin', update);
        root.addEventListener('focusout', focusOut);
        document.addEventListener('visibilitychange', update);
        update();
        return () => {
            disposed = true;
            observer?.disconnect();
            root.removeEventListener('pointerdown', beginInteraction);
            document.removeEventListener('pointerup', endInteraction);
            document.removeEventListener('pointercancel', endInteraction);
            root.removeEventListener('focusin', update);
            root.removeEventListener('focusout', focusOut);
            document.removeEventListener('visibilitychange', update);
            if (!swiper.destroyed) swiper.autoplay.stop();
        };
    }, [swiper, paused]);
}
