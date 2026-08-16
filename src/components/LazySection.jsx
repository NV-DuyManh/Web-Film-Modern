import React, { useState, useEffect, useRef, Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';

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
        <div ref={ref} style={{
            minHeight: isVisible ? 'auto' : minHeight,
            contentVisibility: 'auto',
            containIntrinsicSize: `auto ${minHeight}`,
        }}>
            {isVisible ? (
                <ErrorBoundary>
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-500">Đang tải...</div>}>
                        {children}
                    </Suspense>
                </ErrorBoundary>
            ) : null}
        </div>
    );
}

