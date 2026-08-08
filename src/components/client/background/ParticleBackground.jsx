import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

function ParticleBackground() {
    const particles = useMemo(() => {
        return [...Array(150)].map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            duration: Math.random() * 10 + 10,
            delay: -(Math.random() * 20),
            size: i % 4 === 0 ? 'w-2 h-2' : i % 3 === 0 ? 'w-1.5 h-1.5' : 'w-1 h-1',
            color: i % 4 === 0 ? 'bg-amber-400/80' : i % 3 === 0 ? 'bg-purple-400' : 'bg-cyan-400',
            drift: (Math.random() * 100) - 50,
        }));
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">


            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className={`absolute rounded-full shadow-[0_0_10px_2px_rgba(34,211,238,0.8)] ${p.color} ${p.size}`}
                    style={{ left: `${p.left}%`, bottom: '-5%' }}
                    animate={{
                        y: [0, -1000],
                        x: [0, p.drift, -p.drift, p.drift],
                        opacity: [0, 0.8, 0.8, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: p.delay
                    }}
                />
            ))}
        </div>
    );
}

export default ParticleBackground;
