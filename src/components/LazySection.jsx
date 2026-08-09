import React, { useState, useEffect, useRef } from 'react';

export default function LazySection({ children, minHeight = '400px', rootMargin = '300px' }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { rootMargin });
        
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <div ref={ref} style={{ minHeight: isVisible ? 'auto' : minHeight }} className={!isVisible ? "w-full bg-[#111827]" : ""}>
            {isVisible ? children : null}
        </div>
    );
}
