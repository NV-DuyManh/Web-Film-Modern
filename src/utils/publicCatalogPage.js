import { listingMovies } from '../../server/seo/catalog.js';

const paths = { new: '/film-new', single: '/singleMovies', series: '/series', anime: '/anime', cinema: '/cinema-movies', coming: '/film-coming', hongkong: '/film-hongkong' };
const searchable = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();

export function catalogPage(prepared, params) {
    const kind = params.get('kind') || 'new';
    if (!Object.hasOwn(paths, kind) && !['category', 'country'].includes(kind)) throw new Error('Invalid public listing.');
    const size = Math.min(100, Math.max(1, Number(params.get('limit')) || 28));
    let items = listingMovies(paths[kind] || '/film-new', prepared);
    if (kind === 'category') {
        const name = (params.get('name') || '').toLowerCase();
        const category = prepared.catalog.Categories?.find(value => value.name?.toLowerCase() === name);
        items = category ? items.filter(value => value.listCategory?.includes(category.id)) : [];
    }
    if (kind === 'country') items = items.filter(value => value.countriesID?.toLowerCase() === (params.get('name') || '').toLowerCase());
    const search = searchable(params.get('q')).slice(0, 200);
    if (search) items = items.filter(value => searchable(value.name).includes(search) || searchable(value.otherName).includes(search));
    const total = items.length, totalPages = Math.max(1, Math.ceil(total / size));
    const page = Math.min(totalPages, Math.max(1, Math.floor(Number(params.get('page')) || 1)));
    return { items: items.slice((page - 1) * size, page * size), total, page, totalPages };
}
