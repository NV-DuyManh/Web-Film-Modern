import { validRentalPrice } from './rentalPolicy.js';

const PRICE_STEP = 1000;

// The plan level determines whether a movie is free; its current price sets the range.
export function rentalPriceRange(plan) {
    if (!plan || plan.level === '' || plan.level == null) return null;
    const level = Number(plan.level);
    if (!Number.isInteger(level) || level < 0) return null;
    if (level === 0) return { min: 0, max: 0, step: PRICE_STEP };
    const price = Number(plan.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    const min = Math.max(PRICE_STEP, Math.round(price * 0.1 / PRICE_STEP) * PRICE_STEP);
    const max = Math.max(min, Math.round(price * 0.2 / PRICE_STEP) * PRICE_STEP);
    if (!Number.isSafeInteger(max)) return null;
    return { min, max, step: PRICE_STEP };
}

export function randomRentalPrice(plan, random = Math.random) {
    const range = rentalPriceRange(plan);
    if (!range) return null;
    if (range.max === 0) return 0;
    const draw = random();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new RangeError('Random value must be in [0, 1).');
    const choices = (range.max - range.min) / range.step + 1;
    return range.min + Math.floor(draw * choices) * range.step;
}

// This patch never changes the movie's plan or an existing payable rental price.
export function missingRentalPricePatch(movie, plans, random = Math.random) {
    const plan = plans.find(item => item.id === movie.planID);
    const range = rentalPriceRange(plan);
    if (!range) return null;
    if (range.max === 0) return Number(movie.rent || 0) === 0 ? null : { rent: 0 };
    if (validRentalPrice(movie.rent)) return null;
    return { rent: randomRentalPrice(plan, random) };
}
