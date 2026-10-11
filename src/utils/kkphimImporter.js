import { collection, doc, query, where, limit } from 'firebase/firestore';
import { kkphimDocumentID, randomMoviePlanID } from './movieMaintenance.js';
import { randomRentalPrice, rentalPriceRange } from './importRentalPricing.js';
import { resolveMovieImages } from './movieImages.js';
import { movieTime } from './movieRecency.js';
import { parseEpisode, highestEpisode, normalizeEpisodes } from './episodes.js';
import { episodeSyncChanges } from './episodeSync.js';
import { nameSlug } from './nameRoutes.js';
import { detectGender } from './genderDetect.js';
import { episodeSourceFingerprint } from './episodeSourceFingerprint.js';
import { importEpisodeBatches } from './importEpisodeBatches.js';
import { fetchMovieDetails, fetchMovieImages, getFullImageUrl,
    mapMovieType, mapMovieStatus, mapCountryName, parseDuration, stripHtml } from '../services/kkphimService.js';

const normalize = value => String(value || '').trim().toLowerCase();
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 24);

export function createKkphimImporter({ db, io, catalog, onChange = () => {} }) {
    const lookup = async (name, field, value) => {
        const found = await io.query(query(collection(db, name), where(field, '==', value), limit(1)), 1);
        return found.docs[0] ? { ...found.docs[0].data(), id: found.docs[0].id } : null;
    };
    return async (item, { jobId, page }) => {
        if (!kkphimDocumentID(item?.slug)) throw new Error('Invalid KKPhim movie slug.');
        const data = await catalog();
        const sourceTime = movieTime(item.modified?.time);
        const candidateNames = [item.name, item.origin_name].map(normalize).filter(Boolean);
        let existing = data.Movies.find(movie => movie.sourceSlug === item.slug || movie.slug === item.slug
            || [movie.name, movie.otherName].map(normalize).some(name => name && candidateNames.includes(name)));
        if (!existing) existing = await lookup('Movies', 'sourceSlug', item.slug) || await lookup('Movies', 'slug', item.slug) || await lookup('Movies', 'otherName', item.name) || (item.origin_name ? await lookup('Movies', 'name', item.origin_name) : null);
        const movieRef = doc(db, 'Movies', existing?.id || kkphimDocumentID(item.slug));
        let live = existing && !(data.Movies.includes(existing)) ? existing : (await io.read(movieRef)).data();
        if (live && live.crawlImportState !== 'pending') {
            if (sourceTime && movieTime(live.sourceUpdatedAt) !== sourceTime) { await io.update(movieRef, { sourceUpdatedAt: sourceTime }); live.sourceUpdatedAt = sourceTime; onChange(); }
            const cached = data.Movies.find(value => value.id === movieRef.id);
            if (cached) Object.assign(cached, live); else { data.Movies.push({ ...live, id: movieRef.id }); onChange(); }
            // A prior worker can finish saving a film before its cursor checkpoint.
            return live.crawlJobId === jobId ? { movieId: movieRef.id, movies: 1, episodes: live.crawlImportedEpisodes || 0 } : { skipped: 1 };
        }
        const detail = await fetchMovieDetails(item.slug);
        const source = detail?.movie;
        if (!source) throw new Error('KKPhim returned no movie details.');
        const stats = { movies: 1, episodes: 0, categories: 0, actors: 0, directors: 0 };
        const entity = async (name, label, values, stat) => {
            const old = data[name].find(value => normalize(value.name) === normalize(label));
            if (old) return old.id;
            const found = await lookup(name, 'name', label);
            if (found) { data[name].push(found); return found.id; }
            const id = `kkphim-${await hash(`${name}:${normalize(label)}`)}`;
            const record = { id, name: label, description: 'Đang cập nhật...', ...values };
            await io.set(doc(db, name, id), record);
            data[name].push(record);
            if (stat) stats[stat]++;
            return id;
        };
        const listCategory = [];
        for (const category of source.category || []) if (category.name) listCategory.push(await entity('Categories', category.name, {}, 'categories'));
        const categoryTypeID = await entity('CategoryTypes', mapMovieType(source.type), {});
        const countriesID = mapCountryName(source.country);
        const people = async (names, collectionName, counter) => {
            const ids = [];
            for (const name of names || []) if (name && name !== 'Đang cập nhật') ids.push(await entity(collectionName, name, { imgUrl: '', sexID: detectGender(name), countriesID }, counter));
            return ids;
        };
        const listActor = await people(source.actor, 'Actors', 'actors');
        const listAuthor = await people(source.director, 'Authors', 'directors');
        const servers = detail.episodes || [];
        const firstEpisodes = servers[0]?.server_data || [];
        const planID = live?.planID || randomMoviePlanID(data.Plans);
        const plan = data.Plans.find(value => value.id === planID);
        if (!rentalPriceRange(plan)) throw new Error('Movie plan is unavailable.');
        const sourceUpdatedAt = sourceTime || movieTime(source.modified?.time);
        const movie = live || {
            id: movieRef.id, slug: nameSlug(source.name || source.origin_name || item.name),
            name: source.origin_name || item.origin_name || item.name, otherName: source.name || '',
            description: stripHtml(source.content),
            ...resolveMovieImages({ imgUrl: getFullImageUrl(source.poster_url), bannerUrl: getFullImageUrl(source.thumb_url) }),
            listCategory, listActor, listAuthor, listCharacter: [], categoryTypeID, planID,
            countriesID, releaseYear: source.year || new Date().getFullYear(), duration: parseDuration(source.time),
            rent: randomRentalPrice(plan), status: mapMovieStatus(source.status), ageRating: 'T13',
            endEpisode: Math.max(parseEpisode(source.episode_total)?.end || 0, highestEpisode(firstEpisodes.map(ep => ({ nameEpisode: ep.name }))), 1),
            hasSub: String(source.lang || '').includes('Vietsub'), hasDub: String(source.lang || '').includes('Thuyết Minh'),
            hasVoice: String(source.lang || '').includes('Lồng Tiếng'), episodeSub: 0, episodeDub: 0, episodeVoice: 0,
            createdAt: new Date().toISOString(), importSource: 'kkphim', sourceSlug: item.slug,
            sourceUpdatedAt, sourcePage: page, crawlJobId: jobId, crawlImportState: 'pending',
        };
        if (!live) {
            await io.set(movieRef, movie);
            data.Movies.push(movie);
        }
        // Deterministic episode IDs make retry after a network failure safe.
        const changes = episodeSyncChanges(movie, firstEpisodes);
        const signature = await episodeSourceFingerprint(source, servers);
        await importEpisodeBatches({ episodes: changes.creates, signature, previous: movie,
            write: episodes => io.batch(episodes.map(episode => ({ ref: doc(db, 'Episodes', episode.id), values: episode, merge: true }))),
            saveProgress: async values => { await io.update(movieRef, values); Object.assign(movie, values); },
        });
        stats.episodes = changes.creates.length;
        const counts = { episodeSub: 0, episodeDub: 0, episodeVoice: 0 };
        for (const server of servers) {
            const count = normalizeEpisodes((server.server_data || []).map(ep => ({ nameEpisode: ep.name, url: ep.link_embed, urlM3u8: ep.link_m3u8 }))).length;
            const label = normalize(server.server_name);
            if (label.includes('thuyết minh')) counts.episodeDub += count;
            else if (label.includes('lồng tiếng')) counts.episodeVoice += count;
            else counts.episodeSub += count;
        }
        const gallery = await fetchMovieImages(item.slug);
        const completion = { ...counts, ...(gallery.length ? { gallery } : {}), sourceUpdatedAt, sourceEpisodesFingerprint: signature, crawlEpisodeCursor: 0,
            crawlImportState: 'complete', crawlJobId: jobId, crawlImportedEpisodes: stats.episodes };
        await io.update(movieRef, completion);
        Object.assign(movie, completion);
        const cachedMovie = data.Movies.find(value => value.id === movieRef.id);
        if (cachedMovie) Object.assign(cachedMovie, movie, { id: movieRef.id });
        else data.Movies.push({ ...movie, id: movieRef.id });
        onChange();
        return { ...stats, movieId: movieRef.id };
    };
}
