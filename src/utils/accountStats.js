/**
 * Canonical logic for account statistics in MFILM:
 * 1. ĐÃ XEM: Unique movies in user's watch history
 * 2. ĐÁNH GIÁ: Unique movies reviewed/rated by user
 * 3. WATCHLIST: Unique movies saved in user's playlists/watchlist
 * 4. THEO DÕI: Unique followed/favorited items by user
 */
import { getWatchedMoviesCount } from './watchHistory.js';

export { getWatchedMoviesCount };

export function getUniqueReviewsCount(userId, reviews = []) {
    if (!userId || !Array.isArray(reviews)) return 0;
    const userReviews = reviews.filter(r => String(r.userID) === String(userId));
    const uniqueMovieIds = new Set();
    userReviews.forEach(r => {
        if (r.movieID) {
            uniqueMovieIds.add(String(r.movieID));
        }
    });
    return uniqueMovieIds.size;
}

export function getWatchlistCount(user) {
    if (!user) return 0;
    const uniqueMovieIds = new Set();
    if (Array.isArray(user.watchlist)) {
        user.watchlist.forEach(id => {
            if (id) uniqueMovieIds.add(String(id));
        });
    }
    if (Array.isArray(user.listFilm)) {
        user.listFilm.forEach(list => {
            if (Array.isArray(list?.movies)) {
                list.movies.forEach(mId => {
                    if (mId) uniqueMovieIds.add(String(mId));
                });
            }
        });
    }
    return uniqueMovieIds.size;
}

export function getFollowingCount(user) {
    if (!user) return 0;
    // Strictly count actual follow/following entities only.
    // Do NOT count listFavorite here because listFavorite represents "Yêu thích", not "Theo dõi".
    if (Array.isArray(user.following)) {
        return new Set(user.following.filter(Boolean).map(String)).size;
    }
    if (Array.isArray(user.listFollow)) {
        return new Set(user.listFollow.filter(Boolean).map(String)).size;
    }
    if (Array.isArray(user.theoDoi)) {
        return new Set(user.theoDoi.filter(Boolean).map(String)).size;
    }
    return 0;
}
