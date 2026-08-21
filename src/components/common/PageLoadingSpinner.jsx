import React from 'react';

/**
 * PageLoadingSpinner
 * Renders a centered, cinematic dual-ring spinner in the middle of the main content area
 * without blocking the Header or Footer.
 */
export default function PageLoadingSpinner({ 
    text = 'Đang tải dữ liệu...', 
    minHeight = 'min-h-[65vh]',
    className = '' 
}) {
    return (
        <div className={`w-full ${minHeight} flex flex-col items-center justify-center py-12 px-4 select-none ${className}`}>
            {/* Cinematic Dual Spinner Container */}
            <div className="relative w-14 h-14 flex items-center justify-center">
                {/* Outer Glow Ring (Amber/Gold) */}
                <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-amber-400 border-r-amber-500 animate-spin drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]"></div>
                
                {/* Inner Counter-Rotating Ring (Sky/Cyan) */}
                <div className="absolute inset-2 rounded-full border-3 border-transparent border-b-sky-400 border-l-cyan-400 animate-[spin_1.2s_linear_infinite_reverse] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"></div>
                
                {/* Center Core Glow Dot */}
                <div className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
            </div>

            {/* Loading text with subtle breathing effect */}
            {text && (
                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    <span className="bg-linear-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent animate-pulse">
                        {text}
                    </span>
                </div>
            )}
        </div>
    );
}
