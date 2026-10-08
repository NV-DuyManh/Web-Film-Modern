export const COUNTRY_OVERSCAN = 2;

export function countryCardLayout(width) {
    const count = width < 400 ? 1 : width < 900 ? 2 : width < 1280 ? 3 : 4;
    const gap = count === 1 ? 10 : count === 2 ? 12 : count === 3 ? 15 : 20;
    const cardWidth = Math.max(100, (width - (count - 1) * gap) / count);
    return { width, count, gap, cardWidth, step: cardWidth + gap };
}

export function wrapCountryPosition(position, cycleWidth) {
    return cycleWidth > 0 ? ((position % cycleWidth) + cycleWidth) % cycleWidth : 0;
}

// Keep the original padded cycle for small catalogs, without mounting both copies.
export function countryCycleCount(movieCount) {
    return movieCount ? Math.max(1, Math.ceil(12 / movieCount)) * movieCount : 0;
}

export function countryWindowStart(position, step) {
    return Math.floor(position / step) - COUNTRY_OVERSCAN;
}

export function countryWindow(movies, start, visibleCount) {
    if (!movies.length) return [];
    const length = visibleCount + COUNTRY_OVERSCAN * 2 + 1;
    return Array.from({ length }, (_, offset) => {
        const index = start + offset;
        const movieIndex = ((index % movies.length) + movies.length) % movies.length;
        return { ...movies[movieIndex], _slideKey: index };
    });
}
