import React from 'react';
import { GiCrown } from 'react-icons/gi';
import { FaGem } from 'react-icons/fa';

export function WingedFrame({ children, theme, size = 48 }) {

    let primaryColor, secondaryColor, accentColor, glowColor, gemColor;

    switch (theme) {
        case 'admin':
            primaryColor = '#9333ea';
            accentColor = '#fbbf24';
            glowColor = 'rgba(147, 51, 234, 0.9)';
            gemColor = '#f59e0b';
            break;
        case 'red':
        case 'blue':
            primaryColor = '#3b82f6';
            accentColor = '#60a5fa';
            glowColor = 'rgba(59, 130, 246, 0.6)';
            gemColor = '#bfdbfe';
            break;
        case 'cyan':
            primaryColor = '#06b6d4';
            accentColor = '#67e8f9';
            glowColor = 'rgba(6, 182, 212, 0.6)';
            gemColor = '#a5f3fc';
            break;
        case 'yellow':
            primaryColor = '#eab308';
            accentColor = '#fef08a';
            glowColor = 'rgba(234, 179, 8, 0.6)';
            gemColor = '#eab308';
            break;
        case 'red':
            primaryColor = '#ef4444';
            accentColor = '#fca5a5';
            glowColor = 'rgba(239, 68, 68, 0.8)';
            gemColor = '#b91c1c';
            break;
        case 'rose':
            primaryColor = '#f43f5e';
            accentColor = '#fda4af';
            glowColor = 'rgba(251, 113, 133, 0.8)';
            gemColor = '#f43f5e';
            break;
        case 'cyberpunk':
        case 'cyber_radar':
        case 'cyber_pulse':
            primaryColor = '#06b6d4'; secondaryColor = '#0891b2'; accentColor = '#22d3ee'; glowColor = 'rgba(6,182,212,0.8)'; gemColor = '#06b6d4'; break;
        default:
            primaryColor = '#64748b'; secondaryColor = '#1e293b'; accentColor = '#cbd5e1'; glowColor = 'rgba(100,116,139,0)'; gemColor = '#64748b';
    }

    const isTopTier = ['rose', 'admin'].includes(theme);
    const isPremium = ['red', 'yellow', 'rose', 'cyan', 'blue', 'admin'].includes(theme);
    const isUltra = ['red', 'yellow', 'rose', 'admin'].includes(theme);

    return (
        <div className="relative inline-flex justify-center items-center group" style={{ width: size, height: size }}>

            {isTopTier && (
                <>
                    <div className="absolute -inset-1.5 rounded-full z-0 pointer-events-none animate-pulse"
                        style={{
                            background: theme === 'admin' 
                                ? 'conic-gradient(from 0deg, #4c1d95, #9333ea, #c084fc, #9333ea, #4c1d95)'
                                : 'conic-gradient(from 0deg, #9f1239, #f43f5e, #f97316, #f59e0b, #9f1239)',
                            filter: 'blur(18px)',
                            WebkitMask: 'radial-gradient(closest-side, transparent 70%, black 85%)',
                            mask: 'radial-gradient(closest-side, transparent 70%, black 85%)',
                            opacity: 0.9
                        }}></div>

                    <div className="absolute -inset-4 rounded-full z-0 pointer-events-none"
                        style={{
                            WebkitMask: 'radial-gradient(closest-side, transparent 92%, black 97%)',
                            mask: 'radial-gradient(closest-side, transparent 92%, black 97%)',
                            filter: theme === 'admin' ? 'drop-shadow(0 0 10px #fbbf24)' : 'drop-shadow(0 0 6px #f43f5e)'
                        }}>
                        <div className="w-full h-full animate-[spin_10s_linear_infinite_reverse]"
                            style={{
                                background: theme === 'admin'
                                    ? 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #4c1d95, #f59e0b, #fbbf24)'
                                    : 'conic-gradient(from 0deg, #f59e0b, #f43f5e, #9f1239, #f59e0b)',
                                WebkitMask: 'repeating-conic-gradient(from 0deg, black 0deg 10deg, transparent 10deg 20deg, black 20deg 22deg, transparent 22deg 40deg)',
                                mask: 'repeating-conic-gradient(from 0deg, black 0deg 10deg, transparent 10deg 20deg, black 20deg 22deg, transparent 22deg 40deg)'
                            }}></div>
                    </div>

                    {theme === 'admin' && (
                        <div className="absolute -inset-3.5 rounded-full z-0 pointer-events-none"
                            style={{
                                WebkitMask: 'radial-gradient(closest-side, transparent 94%, black 98%)',
                                mask: 'radial-gradient(closest-side, transparent 94%, black 98%)',
                                filter: 'drop-shadow(0 0 10px #fbbf24)'
                            }}>
                            <div className="w-full h-full animate-[spin_3s_linear_infinite]"
                                style={{
                                    background: 'repeating-conic-gradient(from 0deg, #fbbf24 0deg 5deg, transparent 5deg 15deg)',
                                    opacity: 0.9
                                }}></div>
                        </div>
                    )}

                    <div className="absolute -inset-2.5 rounded-full z-0 pointer-events-none"
                        style={{
                            WebkitMask: 'radial-gradient(closest-side, transparent 91%, black 95%)',
                            mask: 'radial-gradient(closest-side, transparent 91%, black 95%)',
                        }}>
                        <div className={`w-full h-full ${theme === 'admin' ? 'animate-[spin_2s_linear_infinite_reverse]' : 'animate-[spin_2s_linear_infinite]'}`}
                            style={{
                                background: theme === 'admin'
                                    ? 'repeating-conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #fef3c7 115deg, #fef3c7 120deg)'
                                    : 'repeating-conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #ffffff 115deg, #ffffff 120deg)',
                                filter: 'blur(1px)'
                            }}></div>
                    </div>

                    <div className="absolute -inset-1.5 rounded-full z-0 pointer-events-none"
                        style={{
                            WebkitMask: 'radial-gradient(closest-side, transparent 89%, black 94%)',
                            mask: 'radial-gradient(closest-side, transparent 89%, black 94%)',
                            filter: theme === 'admin' ? 'drop-shadow(0 0 8px #fbbf24)' : 'drop-shadow(0 0 6px #f97316)'
                        }}>
                        <div className={`w-full h-full ${theme === 'rose' ? 'animate-[spin_6s_linear_infinite_reverse]' : 'animate-[spin_6s_linear_infinite]'}`}
                            style={{
                                background: theme === 'admin' 
                                    ? 'conic-gradient(from 0deg, #fef08a, #fbbf24, #fef08a)'
                                    : 'conic-gradient(from 0deg, #f97316, #f43f5e, #f97316)',
                                WebkitMask: 'repeating-conic-gradient(from 0deg, black 0deg 4deg, transparent 4deg 8deg)',
                                mask: 'repeating-conic-gradient(from 0deg, black 0deg 4deg, transparent 4deg 8deg)'
                            }}></div>
                    </div>
                </>
            )}

            {theme === 'yellow' && (
                <div className="absolute -inset-1.5 rounded-full z-0 pointer-events-none animate-[spin_5s_linear_infinite_reverse]"
                    style={{
                        border: `2px solid ${accentColor}`,
                        borderTopColor: 'transparent',
                        borderBottomColor: 'transparent',
                        opacity: 0.8,
                        boxShadow: `0 0 5px ${glowColor}`
                    }}>
                </div>
            )}

            {isPremium && !isUltra && (
                <>
                    {theme === 'blue' && (
                        <div className="absolute -inset-1 rounded-full z-0 pointer-events-none animate-[spin_5s_linear_infinite]"
                            style={{
                                border: `2px dashed ${primaryColor}`,
                                boxShadow: `0 0 10px ${glowColor}, inset 0 0 10px ${glowColor}`
                            }}>
                        </div>
                    )}
                    {theme === 'cyan' && (
                        <>

                            <div className="absolute -inset-1 rounded-full z-0 pointer-events-none animate-[spin_3s_linear_infinite]"
                                style={{
                                    border: `2px dotted ${primaryColor}`,
                                    boxShadow: `0 0 12px ${glowColor}`
                                }}>
                            </div>
                            <div className="absolute -inset-2 rounded-full z-0 pointer-events-none animate-[spin_4s_linear_infinite_reverse]"
                                style={{
                                    border: `1px dashed ${accentColor}`,
                                    opacity: 0.6
                                }}>
                            </div>
                        </>
                    )}
                </>
            )}

            {isUltra && !isTopTier && (
                <div className="absolute -inset-1 rounded-full z-0 pointer-events-none animate-[spin_4s_linear_infinite]"
                    style={{
                        border: `2px dashed ${primaryColor}`,
                        boxShadow: `0 0 10px ${glowColor}, inset 0 0 10px ${glowColor}`
                    }}>
                </div>
            )}

            <div className="relative z-10 w-full h-full rounded-full overflow-hidden"
                style={{
                    border: isPremium ? `2px solid ${accentColor}` : '2px solid #475569',
                    boxShadow: isPremium ? `0 0 15px ${glowColor}` : 'none'
                }}>
                {children}

                {isPremium && (
                    <div className="absolute inset-0 z-20 pointer-events-none rounded-full overflow-hidden">
                        <div className="absolute top-0 bottom-0 w-[150%] bg-linear-to-r from-transparent via-white/40 to-transparent animate-avatar-shine" />
                    </div>
                )}
            </div>

            {isPremium && (
                <>

                    {isUltra && (
                        <>

                            <div className="absolute z-20 pointer-events-none"
                                style={{
                                    top: isTopTier ? '-45%' : '-38%',
                                    color: accentColor,
                                    fontSize: isTopTier ? size * 0.7 : size * 0.6,
                                    filter: `drop-shadow(0 1px 1px rgba(0,0,0,0.8)) drop-shadow(0 0 8px ${primaryColor})`
                                }}>
                                <GiCrown />
                            </div>
                        </>
                    )}

                    {isUltra && (
                        <div className="absolute z-20 pointer-events-none"
                            style={{
                                bottom: isTopTier ? '-45%' : '-38%',
                                color: gemColor,
                                fontSize: isTopTier ? size * 0.6 : size * 0.5,
                                filter: `drop-shadow(0 1px 1px rgba(0,0,0,0.8)) drop-shadow(0 0 8px ${glowColor})`
                            }}>
                            <FaGem />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

