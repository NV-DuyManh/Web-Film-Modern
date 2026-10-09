export function nameSlug(name, fallback = 'noi-dung') {
    return String(name || '').normalize('NFKD').toLowerCase()
        .replace(/\p{M}/gu, '')
        .replace(/[đð]/g, 'd').replace(/ı/g, 'i').replace(/ł/g, 'l')
        .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || fallback;
}

// Index the full catalog before filtering/pagination, so duplicate names resolve consistently.
export function createNameRouteIndex(items = [], { preferSlug = false, fallback } = {}) {
    const groups = new Map(), byId = new Map(), bySlug = new Map(), aliases = new Map(), slugs = new Map();
    for (const item of items) {
        const base = item.routeSlug || (preferSlug && item.slug && item.slug !== item.id ? item.slug : nameSlug(item.name || item.title || item.otherName, fallback));
        if (!groups.has(base)) groups.set(base, []);
        groups.get(base).push(item);
        byId.set(item.id, item);
        for (const alias of [item.slug, item.name, item.title, item.otherName,
            ...[item.name, item.title, item.otherName].filter(Boolean).map(value => nameSlug(value))]) {
            if (alias && !aliases.has(alias)) aliases.set(alias, item);
        }
    }
    const reserved = new Set(groups.keys());
    for (const [base, group] of groups) {
        group.sort((a, b) => String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0);
        let suffix = 2;
        group.forEach((item, index) => {
            let slug = base;
            if (index) {
                do { slug = `${base}-${suffix++}`; } while (reserved.has(slug));
                reserved.add(slug);
            }
            slugs.set(item.id, slug);
            bySlug.set(slug, item);
        });
    }
    return {
        find: value => byId.get(value) || bySlug.get(value) || aliases.get(value),
        slug: item => slugs.get(item.id) || nameSlug(item.name || item.title || item.otherName, fallback),
        path: (prefix, item) => `${prefix}/${encodeURIComponent(slugs.get(item.id) || nameSlug(item.name || item.title || item.otherName, fallback))}`,
    };
}

export function withNameRoutes(items, options) {
    const routes = createNameRouteIndex(items, options);
    return items.map(item => ({ ...item, routeSlug: routes.slug(item) }));
}

// Routing metadata belongs to the client; saving an admin form keeps the original data schema.
export function stripRouteMetadata(item) {
    const { routeSlug: _routeSlug, _artworkSource: _artworkSource, ...values } = item;
    return values;
}

export function routeSegment(item) {
    return encodeURIComponent(item?.routeSlug || (item?.slug && item.slug !== item.id ? item.slug : nameSlug(item?.name || item?.title || item?.otherName)));
}

const indexes = new WeakMap();
export function findRouteEntity(items, value) {
    if (!indexes.has(items)) indexes.set(items, createNameRouteIndex(items, { preferSlug: true }));
    return indexes.get(items).find(value);
}

export function findMovieReference(items, value) {
    let decoded;
    try { decoded = decodeURIComponent(value); } catch { return undefined; }
    return findRouteEntity(items, decoded) || items.find(item =>
        [item.id, item.slug, item.routeSlug, decodeURIComponent(routeSegment(item))]
            .some(alias => alias && String(alias).toLowerCase() === decoded.toLowerCase())
    );
}
