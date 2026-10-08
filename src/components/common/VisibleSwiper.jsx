import { useCallback, useEffect, useRef } from 'react';
import { Swiper as BaseSwiper } from 'swiper/react';
import { observeVisibleSwiperResize } from '../../utils/visibleSwiperResize';

export { SwiperSlide } from 'swiper/react';

export function Swiper({ onSwiper, ...props }) {
    const cleanupRef = useRef(null);
    const handleSwiper = useCallback(swiper => {
        cleanupRef.current?.();
        cleanupRef.current = observeVisibleSwiperResize(swiper);
        onSwiper?.(swiper);
    }, [onSwiper]);
    useEffect(() => () => cleanupRef.current?.(), []);
    return <BaseSwiper {...props} resizeObserver={false} updateOnWindowResize={false} onSwiper={handleSwiper} />;
}
