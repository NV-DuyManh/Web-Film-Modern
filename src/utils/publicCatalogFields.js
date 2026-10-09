export const PUBLIC_COLLECTIONS = ['Movies', 'Actors', 'Authors', 'Characters', 'Topics', 'Categories', 'CategoryTypes'];
const fields = ['name', 'otherName', 'title', 'slug', 'createdAt', 'updatedAt', 'sourceUpdatedAt', 'description',
    'imgUrl', 'bannerUrl', 'avatar', 'releaseYear', 'year', 'duration', 'time', 'endEpisode',
    'hasSub', 'hasDub', 'hasVoice', 'episodeSub', 'episodeDub', 'episodeVoice', 'countriesID', 'listCategory', 'categoryTypeID', 'status',
    'actor', 'actors', 'listActor', 'author', 'listAuthor', 'character', 'characters', 'listCharacter', 'sexID',
    'movieID', 'isSmart', 'smartID', 'views', 'totalEpisodes', 'planID', 'rent', 'ageRating', 'isHot', 'hot',
    'gallery', 'images', 'trailer_url', 'trailerUrl', 'sourceSlug', 'importSource'];
export function publicCatalogRecord(data) {
    return { id: data.id, ...Object.fromEntries(fields.filter(key => data[key] !== undefined).map(key => [key, data[key]])) };
}
export function changesPublicCatalog(collectionName, values) {
    return PUBLIC_COLLECTIONS.includes(collectionName) && (!values || Object.keys(values).some(key => fields.includes(key) && key !== 'views'));
}

// Selectors need identity, artwork and access labels, not entire plots and galleries.
export function movieSummary(movie) {
    const { description, gallery: _gallery, images: _images, trailer_url: _trailer, trailerUrl: _trailerUrl, ...summary } = movie;
    return { ...summary, ...(description ? { description: String(description).slice(0, 400) } : {}) };
}
export function movieIndexRecord(movie) {
    return Object.fromEntries(['id', 'name', 'otherName', 'slug', 'routeSlug'].filter(key => movie[key] !== undefined).map(key => [key, movie[key]]));
}
