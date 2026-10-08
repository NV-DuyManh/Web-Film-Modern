import { nameSlug, createNameRouteIndex } from './nameRoutes.js';

export const actorNameSlug = name => nameSlug(name, 'dien-vien');

export function createActorRouteIndex(actors = []) {
    const routes = createNameRouteIndex(actors, { fallback: 'dien-vien' });
    return { find: routes.find, path: actor => routes.path('/dien-vien', actor) };
}
