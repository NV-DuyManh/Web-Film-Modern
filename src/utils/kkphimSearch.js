export function searchResults(response) {
    if (response?.status === false || response?.status === 'error' || !Array.isArray(response?.data?.items)) {
        throw new Error('KKPhim returned an invalid search response. Please try again.');
    }
    const pagination = response.data.params?.pagination || {};
    return {
        items: response.data.items.filter(item => typeof item.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)),
        totalItems: Math.max(0, Number(pagination.totalItems) || 0),
        totalPages: Math.max(1, Number(pagination.totalPages) || 1),
        page: Math.max(1, Number(pagination.currentPage) || 1),
    };
}

export function existingSourceMovie(movies, item) {
    const names = [item.name, item.origin_name].map(value => String(value || '').trim().toLowerCase()).filter(Boolean);
    return movies.find(movie => movie.sourceSlug === item.slug || movie.slug === item.slug
        || [movie.name, movie.otherName].some(value => value && names.includes(String(value).trim().toLowerCase())));
}
