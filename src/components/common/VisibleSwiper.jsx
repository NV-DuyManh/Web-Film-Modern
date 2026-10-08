import { useCallback, useEffect, useRef } from 'react';
import { Swiper as BaseSwiper } from 'swiper/react';
import { observeVisibleSwiperResize } from '../../utils/visibleSwiperResize';
import { observeMovieNavigation } from '../../utils/movieNavigation';

export { SwiperSlide } from 'swiper/react';

export function Swiper({ onSwiper, ...props }) {
    const cleanupRef = useRef(null);
    const handleSwiper = useCallback(swiper => {
        cleanupRef.current?.();
        const stopResize = observeVisibleSwiperResize(swiper);
        const stopNavigation = observeMovieNavigation(swiper.el.closest('.movie-slider-wrapper'));
        cleanupRef.current = () => { stopResize(); stopNavigation(); };
        onSwiper?.(swiper);
    }, [onSwiper]);
    useEffect(() => () => cleanupRef.current?.(), []);
    return <BaseSwiper {...props} resizeObserver={false} updateOnWindowResize={false} onSwiper={handleSwiper} />;
}
