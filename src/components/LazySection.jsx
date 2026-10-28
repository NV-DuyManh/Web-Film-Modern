import React, { useState, useEffect, useRef, Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import PageLoadingSpinner from './common/PageLoadingSpinner';
import { SectionVisibilityContext } from '../contexts/SectionVisibilityContext';

export default function LazySection({ children, minHeight = '400px', rootMargin = '300px', eager = false }) {
    const [isVisible, setIsVisible] = useState(() => eager || typeof IntersectionObserver === 'undefined');
    const [isNearby, setIsNearby] = useState(() => eager || typeof IntersectionObserver === 'undefined');
    const ref = useRef(null);

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => {
            setIsNearby(entry.isIntersecting);
            if (entry.isIntersecting) {
                setIsVisible(true);
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
                <SectionVisibilityContext.Provider value={isNearby}>
                <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSpinner minHeight="min-h-[250px]" text="" />}>
                        {children}
                    </Suspense>
                </ErrorBoundary>
                </SectionVisibilityContext.Provider>
            ) : null}
        </div>
    );
}

