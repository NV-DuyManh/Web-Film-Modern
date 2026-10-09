import { missingRentalPricePatch, rentalPriceRange } from './importRentalPricing.js';
import { missingMovieArtworkPatch } from './movieImages.js';

export function randomMoviePlanID(plans, random = Math.random) {
    const eligible = plans.filter(plan => rentalPriceRange(plan));
    if (!eligible.length) return '';
    const draw = random();
    const level = draw < 0.3 ? 0 : draw < 0.6 ? 1 : draw < 0.8 ? 2 : 3;
    const matching = eligible.filter(plan => Number(plan.level) === level);
    return matching.length ? matching[Math.floor(random() * matching.length)].id : eligible[0].id;
}

export function movieMaintenancePatch(movie, plans, random = Math.random) {
    const patch = missingMovieArtworkPatch(movie);
    // Assign only missing/invalid plans; repeated maintenance never rerolls a valid plan.
    const currentPlan = plans.find(plan => plan.id === movie.planID);
    if (currentPlan && !rentalPriceRange(currentPlan)) return Object.keys(patch).length ? patch : null;
    if (!currentPlan) {
        const planID = randomMoviePlanID(plans, random);
        if (!planID) return Object.keys(patch).length ? patch : null;
        patch.planID = planID;
    }
    const rent = missingRentalPricePatch({ ...movie, ...patch }, plans, random);
    return Object.keys(patch).length || rent ? { ...patch, ...rent } : null;
}

export function kkphimDocumentID(slug) {
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 300) return null;
    return `kkphim-${slug}`;
}

export function canRetireEmptyImport(movie, referenced, now = Date.now()) {
    const createdAt = Date.parse(movie.createdAt);
    return movie.importSource === 'kkphim' && Number.isFinite(createdAt)
        && now - createdAt >= 60 * 60 * 1000 && !referenced;
}

function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
    }
    return value;
}

// An exact content match is required; matching a title alone can confuse remakes/seasons.
export function exactDuplicateMovieGroups(movies) {
    const groups = new Map();
    for (const movie of movies) {
        if (!movie.id || !movie.slug || !(movie.name || movie.otherName)) continue;
        const content = Object.fromEntries(Object.entries(movie).filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key)));
        const signature = JSON.stringify(stableValue(content));
        if (!groups.has(signature)) groups.set(signature, []);
        groups.get(signature).push(movie);
    }
    return [...groups.values()].filter(group => group.length > 1).map(group => group.sort((a, b) => a.id.localeCompare(b.id)));
}
