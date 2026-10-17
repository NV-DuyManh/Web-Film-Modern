// One short burst every 3–8 seconds; no background animation loop.
export function startHalloweenMeteors(layer) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let timer;
    const schedule = () => {
        timer = setTimeout(() => {
            const bounds = layer.getBoundingClientRect();
            const dx = bounds.width * .6, dy = bounds.height * .55;
            layer.style.setProperty('--meteor-distance', `${Math.hypot(dx, dy)}px`);
            layer.style.setProperty('--meteor-angle', `${Math.atan2(dy, dx)}rad`);
            const streaks = Array.from({ length: Math.random() < .55 ? 1 : 2 }, (_, index) => {
                const flight = document.createElement('span');
                flight.className = 'mfilm-meteor-flight';
                flight.style.left = `${4 + Math.random() * 24}%`;
                flight.style.top = `${3 + Math.random() * 19}%`;
                flight.style.setProperty('--meteor-delay', `${index * (140 + Math.random() * 140)}ms`);
                const streak = document.createElement('span');
                streak.className = 'mfilm-meteor-streak';
                flight.appendChild(streak);
                return flight;
            });
            layer.replaceChildren(...streaks);
            schedule();
        }, 3000 + Math.random() * 5000);
    };
    const sync = () => {
        clearTimeout(timer);
        layer.replaceChildren();
        if (!document.hidden && !reduced.matches) schedule();
    };
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    sync();
    return () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', sync);
        reduced.removeEventListener('change', sync);
        layer.replaceChildren();
    };
}
