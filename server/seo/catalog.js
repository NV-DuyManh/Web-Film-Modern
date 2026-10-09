import { createNameRouteIndex, withNameRoutes } from '../../src/utils/nameRoutes.js';
import { STATIC_SEO, canonicalUrl, descriptionText, movieDescription, movieSchema, plainText, publicImage, breadcrumbSchema, isPrivatePath, robotsForPath, pageTitle } from '../../src/utils/seo.js';

export const PREFIXES = { Movies: '/phim', Actors: '/dien-vien', Authors: '/tac-gia', Characters: '/nhan-vat', Topics: '/topic' };
const list = value => Array.isArray(value) ? value : value ? [value] : [];
const timestamp = value => value?.seconds ? value.seconds * 1000 : Date.parse(value) || 0;
const label = item => plainText(item.otherName || item.title || item.name);
const hasBio = item => plainText(item.description).length > 25 && !/^đang cập nhật/i.test(plainText(item.description));

export function prepareCatalog(raw) {
    const catalog = { ...raw }, routes = {}, maps = {}, related = {};
    for (const [key, prefix] of Object.entries(PREFIXES)) {
        catalog[key] = withNameRoutes(raw[key] || [], { preferSlug: key === 'Movies', fallback: key === 'Actors' ? 'dien-vien' : 'noi-dung' });
        routes[key] = createNameRouteIndex(catalog[key]);
        maps[key] = new Map(catalog[key].map(item => [item.id, item]));
        related[key] = new Map();
        for (const item of catalog[key]) item.publicPath = routes[key].path(prefix, item);
    }
    for (const movie of catalog.Movies) {
        const references = {
            Actors: movie.actor || movie.actors || movie.listActor,
            Authors: [...list(movie.author), ...list(movie.listAuthor)],
            Characters: movie.character || movie.characters || movie.listCharacter,
        };
        for (const [key, ids] of Object.entries(references)) for (const id of new Set(list(ids))) {
            if (!related[key].has(id)) related[key].set(id, []);
            related[key].get(id).push(movie);
        }
    }
    return { catalog, routes, maps, related };
}

function smartTopic(topic, catalog) {
    const movies = catalog.Movies;
    const hot = items => [...items].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 20);
    const country = name => hot(movies.filter(movie => movie.countriesID?.toLowerCase() === name));
    switch (topic.smartID) {
        case 'phim-hot': return hot(movies);
        case 'phim-moi': return [...movies].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0)).slice(0, 20);
        case 'anime-hay': return country('japan');
        case 'phim-han': return country('south korea');
        case 'phim-trung': return country('china');
        case 'phim-viet': return hot(movies.filter(movie => ['vietnam', 'việt nam'].includes(movie.countriesID?.toLowerCase())));
        case 'phim-bo-dai-tap': return [...movies].filter(movie => Number(movie.totalEpisodes) > 15).sort((a, b) => Number(b.totalEpisodes) - Number(a.totalEpisodes)).slice(0, 20);
        case 'phim-le': return hot(movies.filter(movie => movie.categoryTypeID === catalog.CategoryTypes?.find(type => type.name?.toLowerCase().includes('lẻ'))?.id));
        default: return [];
    }
}

export function listingMovies(path, prepared) {
    const { catalog } = prepared;
    const movies = catalog.Movies;
    const typeId = text => catalog.CategoryTypes?.find(type => type.name?.toLowerCase().includes(text))?.id;
    const expand = items => items.length < 15 ? [...items, ...movies.filter(movie => !items.includes(movie))] : items;
    switch (path) {
        case '/': case '/film-new': return [...movies].sort((a, b) => timestamp(b.updatedAt || b.createdAt) - timestamp(a.updatedAt || a.createdAt));
        case '/singleMovies': return movies.filter(movie => typeId('lẻ') && movie.categoryTypeID === typeId('lẻ') && (!movie.endEpisode || Number(movie.endEpisode) < 2));
        case '/series': return movies.filter(movie => movie.categoryTypeID === typeId('bộ') || Number(movie.endEpisode) >= 2);
        case '/anime': return movies.filter(movie => movie.categoryTypeID === (typeId('anime') || typeId('hoạt hình')));
        case '/cinema-movies': return expand(movies.filter(movie => movie.categoryTypeID === typeId('chiếu rạp')));
        case '/film-coming': return expand(movies.filter(movie => ['Sắp chiếu', 'trailer'].includes(movie.status)));
        case '/film-hongkong': return expand(movies.filter(movie => ['hồng kông', 'hong kong', 'hongkong'].includes(movie.countriesID?.toLowerCase())));
        default: return movies;
    }
}

export function resolvePublicPage(input, prepared) {
    const url = new URL(input, 'https://www.mfilm.online');
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const { catalog, routes, maps, related } = prepared;
    const page = { status: 200, path, title: '', description: '', bodyDescription: '', items: [], links: [], schemas: [], kind: 'listing', pageNumber: 1, totalPages: 1 };
    if (isPrivatePath(path) || path.startsWith('/xem-phim/')) {
        return { ...page, kind: 'private', title: 'MFILM', canonical: canonicalUrl(path.startsWith('/xem-phim/') ? path.replace('/xem-phim/', '/phim/') : path), robots: 'noindex, follow' };
    }
    if (STATIC_SEO[path]) {
        [page.title, page.description] = STATIC_SEO[path];
        if (path === '/actors') page.items = catalog.Actors;
        else if (path === '/topic') page.items = catalog.Topics;
        else if (!['/ho-tro', '/showtimes'].includes(path)) page.items = listingMovies(path, prepared);
        if (path === '/') {
            page.kind = 'home';
            page.schemas.push({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${canonicalUrl('/')}#website`, name: 'MFILM', alternateName: ['MFilm', 'ManhFilm'], url: canonicalUrl('/'), inLanguage: 'vi' });
            page.links = publicCategoryLinks(prepared);
        }
        if (path === '/ho-tro') page.kind = 'help';
        if (path === '/showtimes') page.kind = 'schedule';
    } else {
        const match = path.match(/^\/(phim|dien-vien|tac-gia|nhan-vat|topic|category|country)\/([^/]+)$/);
        let segment;
        try { segment = match && decodeURIComponent(match[2]); } catch { /* Invalid URL encoding is a missing page. */ }
        if (!match || !segment) return missingPage(path);
        const prefix = `/${match[1]}`;
        if (['/category', '/country'].includes(prefix)) {
            const item = prefix === '/category'
                ? catalog.Categories?.find(item => item.name?.toLowerCase() === segment.toLowerCase())
                : [...new Set(catalog.Movies.map(item => item.countriesID).filter(Boolean))].find(name => name.toLowerCase() === segment.toLowerCase());
            if (!item) return missingPage(path);
            const name = prefix === '/category' ? item.name : item;
            page.path = `${prefix}/${encodeURIComponent(name)}`;
            page.title = `Phim ${name} - Danh sách phim`;
            page.description = `Khám phá phim ${name} tại MFILM. Xem thông tin nội dung, diễn viên và danh sách tập trong từng trang phim.`;
            page.items = moviesByGroup(prefix, item, catalog);
        } else {
            const key = Object.keys(PREFIXES).find(key => PREFIXES[key] === prefix);
            const item = routes[key].find(segment);
            if (!item) return missingPage(path);
            page.path = item.publicPath;
            page.entity = item;
            page.image = publicImage(item.bannerUrl || item.imgUrl || item.avatar);
            if (key === 'Movies') {
                page.kind = 'movie';
                const year = /^\d{4}$/.test(String(item.releaseYear || item.year || '')) ? ` (${item.releaseYear || item.year})` : '';
                page.title = `${label(item)}${year}${item.hasSub ? ' Vietsub' : ''}`;
                page.description = movieDescription(item);
                page.bodyDescription = plainText(item.description);
                page.credits = Object.fromEntries(['Actors', 'Authors', 'Characters'].map(key => [key, [...related[key]].filter(([, movies]) => movies.includes(item)).map(([id]) => maps[key].get(id)).filter(Boolean)]));
                const genres = list(item.listCategory).map(id => catalog.Categories?.find(category => category.id === id)).filter(Boolean);
                page.links = genres.map(category => ({ name: category.name, path: `/category/${encodeURIComponent(category.name)}` }));
                if (item.countriesID) page.links.push({ name: `Phim ${item.countriesID}`, path: `/country/${encodeURIComponent(item.countriesID)}` });
                page.schemas.push(movieSchema(item, { actors: page.credits.Actors, authors: page.credits.Authors, categories: genres }));
            } else if (key === 'Topics') {
                page.title = `${label(item)} - Chủ đề phim`;
                page.description = descriptionText(item.description || `Khám phá bộ sưu tập ${label(item)} tại MFILM.`);
                page.items = item.isSmart ? smartTopic(item, catalog) : list(item.movieID).map(id => maps.Movies.get(id)).filter(Boolean);
            } else {
                page.kind = 'entity';
                const role = key === 'Actors' ? 'Diễn viên' : key === 'Authors' ? 'Tác giả' : 'Nhân vật';
                page.title = `${label(item)} - ${role} và phim tham gia`;
                page.items = related[key].get(item.id) || [];
                page.description = descriptionText(`Thông tin ${role.toLowerCase()} ${label(item)} và danh sách phim đã tham gia tại MFILM. ${hasBio(item) ? item.description : ''}`);
                page.bodyDescription = hasBio(item) ? plainText(item.description) : '';
                page.noindex = !hasBio(item) && page.items.length === 0;
                page.schemas.push({ '@context': 'https://schema.org', '@type': key === 'Characters' ? 'Thing' : 'Person', '@id': `${canonicalUrl(page.path)}#entity`, name: label(item), url: canonicalUrl(page.path), ...(page.bodyDescription && { description: page.bodyDescription }) });
            }
        }
        // Legacy IDs and alternate names converge on the name URL with an HTTP redirect.
        if (path !== page.path) page.redirect = page.path + (url.searchParams.get('page') ? `?page=${encodeURIComponent(url.searchParams.get('page'))}` : '');
    }
    const paginated = page.kind === 'listing';
    const size = path === '/actors' ? 36 : 28;
    page.totalPages = paginated ? Math.max(1, Math.ceil(page.items.length / size)) : 1;
    const rawPage = url.searchParams.get('page');
    page.pageNumber = paginated && /^[1-9]\d*$/.test(rawPage || '') ? Number(rawPage) : 1;
    if (page.pageNumber > page.totalPages) return missingPage(path);
    if (rawPage && (!paginated || rawPage === '1' || !/^[1-9]\d*$/.test(rawPage))) page.redirect = page.path;
    page.canonical = canonicalUrl(`${page.path}${page.pageNumber > 1 ? `?page=${page.pageNumber}` : ''}`);
    page.robots = robotsForPath(page.path, { noindex: page.noindex, search: url.search });
    page.title = pageTitle(`${page.title}${page.pageNumber > 1 ? ` - Trang ${page.pageNumber}` : ''}`);
    page.description = descriptionText(`${page.description}${page.pageNumber > 1 ? ` Trang ${page.pageNumber}.` : ''}`);
    page.visibleItems = page.items.slice(paginated ? (page.pageNumber - 1) * size : 0, paginated ? page.pageNumber * size : page.kind === 'entity' ? page.items.length : size);
    if (page.path !== '/') page.schemas.push(breadcrumbSchema([['MFILM', '/'], [plainText(page.entity ? label(page.entity) : page.title.replace(/ \| MFILM$/, '')), page.canonical]]));
    if (page.visibleItems.length) page.schemas.push({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: page.visibleItems.map((item, i) => ({ '@type': 'ListItem', position: (page.pageNumber - 1) * size + i + 1, name: label(item), url: canonicalUrl(item.publicPath) })) });
    return page;
}
function moviesByGroup(prefix, item, catalog) {
    return catalog.Movies.filter(movie => prefix === '/category' ? list(movie.listCategory).some(id => String(id) === String(item.id)) : movie.countriesID?.toLowerCase() === item.toLowerCase());
}
export function publicCategoryLinks(prepared) {
    const { catalog } = prepared;
    return [
        ...(catalog.Categories || []).filter(item => moviesByGroup('/category', item, catalog).length).map(item => ({ name: `Phim ${item.name}`, path: `/category/${encodeURIComponent(item.name)}` })),
        ...[...new Set(catalog.Movies.map(movie => movie.countriesID).filter(Boolean))].map(name => ({ name: `Phim ${name}`, path: `/country/${encodeURIComponent(name)}` })),
    ];
}
function missingPage(path) {
    return { status: 404, path, title: 'Không tìm thấy trang | MFILM', description: 'Đường dẫn không tồn tại. Khám phá phim mới và tìm phim tại MFILM.', kind: 'missing', canonical: canonicalUrl(path), robots: 'noindex, follow', schemas: [], visibleItems: [], links: [] };
}
export function indexableCatalogPaths(prepared) {
    const paths = new Set(Object.keys(STATIC_SEO));
    for (const [key] of Object.entries(PREFIXES)) for (const item of prepared.catalog[key]) {
        if (!label(item)) continue;
        if (['Actors', 'Authors', 'Characters'].includes(key) && !hasBio(item) && !prepared.related[key].get(item.id)?.length) continue;
        paths.add(item.publicPath);
    }
    for (const link of publicCategoryLinks(prepared)) paths.add(link.path);
    return [...paths];
}
