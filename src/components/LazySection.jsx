import React, { useState, useEffect, useRef, Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import PageLoadingSpinner from './common/PageLoadingSpinner';

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
            minHeight: isVisible ? undefined : minHeight,
        }}>
            {isVisible ? (
                <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSpinner minHeight="min-h-[250px]" text="" />}>
                        {children}
                    </Suspense>
                </ErrorBoundary>
            ) : null}
        </div>
    );
}

