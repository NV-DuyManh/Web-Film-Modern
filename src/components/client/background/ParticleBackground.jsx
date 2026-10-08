import React, { useState } from 'react';
import './ParticleBackground.css';

function ParticleBackground() {
    const [particles] = useState(() => {
        return [...Array(150)].map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            duration: Math.random() * 10 + 10,
            delay: -(Math.random() * 20),
            size: i % 4 === 0 ? 'w-2 h-2' : i % 3 === 0 ? 'w-1.5 h-1.5' : 'w-1 h-1',
            color: i % 4 === 0 ? 'bg-amber-400/80' : i % 3 === 0 ? 'bg-purple-400' : 'bg-cyan-400',
            drift: (Math.random() * 100) - 50,
        }));
    });

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">


            {particles.map((p) => (
                <div
                    key={p.id}
                    className={`mfilm-background-particle absolute rounded-full shadow-[0_0_10px_2px_rgba(34,211,238,0.8)] ${p.color} ${p.size}`}
                    style={{
                        left: `${p.left}%`,
                        bottom: '-5%',
                        '--particle-drift': `${p.drift}px`,
                        '--particle-duration': `${p.duration}s`,
                        '--particle-delay': `${p.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}

export default ParticleBackground;
