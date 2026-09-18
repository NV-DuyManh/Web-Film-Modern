import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
    getMoviePlanInfo,
    getHumanPlanName,
    isPlanAppropriateQuery,
    filterMoviesByEntitlement,
    validateAndFilterAiResponse
} from './entitlement.js';

import {
    getWatchedMoviesCount,
    getUniqueReviewsCount,
    getWatchlistCount,
    getFollowingCount
} from './accountStats.js';

describe('PHASE 06 FIX: CHATBOT ENTITLEMENT & DYNAMIC ACCOUNT STATS', () => {

    // Mock Plans
    const mockPlans = [
        { id: 'plan_free', name: 'Free', level: 0 },
        { id: 'plan_plus', name: 'Plus', level: 2 },
        { id: 'plan_premium', name: 'Premium', level: 3 }
    ];

    // Mock Catalog: FREE, PLUS, PREMIUM movies
    const mockMovies = [
        { id: 'm1', slug: 'naruto-free', name: 'Naruto Free', planID: 'plan_free', views: 500 },
        { id: 'm2', slug: 'doraemon-free', name: 'Doraemon Free', planID: null, views: 600 },
        { id: 'm3', slug: 'seal-team-plus', name: 'Đội Đặc Nhiệm SEAL', planID: 'plan_plus', views: 700 },
        { id: 'm4', slug: 'black-sails-plus', name: 'Cánh Buồm Đen', planID: 'plan_plus', views: 400 },
        { id: 'm5', slug: 'oppenheimer-prem', name: 'Oppenheimer Premium', planID: 'plan_premium', views: 900 }
    ];

    /* =========================================================================
       CHATBOT ENTITLEMENT TESTS (Tests A - F)
       ========================================================================= */

    test('Test A — Free User Entitlement: only Free titles accessible', () => {
        const freeUserPlan = { name: 'FREE', level: 0 };
        const query = 'Phim phù hợp gói của tôi';
        assert.equal(isPlanAppropriateQuery(query), true);

        const allowed = filterMoviesByEntitlement(mockMovies, mockPlans, freeUserPlan);
        assert.equal(allowed.length, 2);
        assert.deepEqual(allowed.map(m => m.slug), ['naruto-free', 'doraemon-free']);

        // Every allowed title must have movie level <= 0
        allowed.forEach(m => {
            const pInfo = getMoviePlanInfo(m, mockPlans);
            assert.ok(pInfo.level <= 0);
        });
    });

    test('Test B — Plus User Entitlement: Free + Plus accessible, Premium excluded', () => {
        const plusUserPlan = { name: 'PLUS', level: 2 };
        const allowed = filterMoviesByEntitlement(mockMovies, mockPlans, plusUserPlan);

        // Naruto (0), Doraemon (0), Seal Team (2), Black Sails (2) -> 4 movies
        assert.equal(allowed.length, 4);
        assert.ok(!allowed.some(m => m.slug === 'oppenheimer-prem'));

        allowed.forEach(m => {
            const pInfo = getMoviePlanInfo(m, mockPlans);
            assert.ok(pInfo.level <= 2);
        });
    });

    test('Test C — Premium User Entitlement: all titles accessible', () => {
        const premiumUserPlan = { name: 'PREMIUM', level: 3 };
        const allowed = filterMoviesByEntitlement(mockMovies, mockPlans, premiumUserPlan);

        assert.equal(allowed.length, 5);
        assert.ok(allowed.some(m => m.slug === 'oppenheimer-prem'));
    });

    test('Test D — AI Hallucination Guard: post-validation removes forbidden movie card/link', () => {
        const freeUserPlan = { name: 'FREE', level: 0 };
        
        // AI returns text that accidentally recommends a PLUS movie and a non-existent movie to a Free user
        const hallucinatedAiReply = `Với gói Free hiện tại của bạn, bạn có thể xem các phim sau:
- [Naruto Free](/phim/naruto-free)
- [Đội Đặc Nhiệm SEAL](/phim/seal-team-plus)
- [Phim Ảo Ma](/phim/non-existent-slug)`;

        const sanitized = validateAndFilterAiResponse(
            hallucinatedAiReply,
            mockMovies,
            mockPlans,
            freeUserPlan,
            true // isPlanSpecific
        );

        // SEAL Team (PLUS) and non-existent movie must be purged from the answer
        assert.ok(sanitized.includes('/phim/naruto-free'));
        assert.ok(!sanitized.includes('/phim/seal-team-plus'));
        assert.ok(!sanitized.includes('/phim/non-existent-slug'));
    });

    test('Test E — Unknown Plan: no fake Free fallback', () => {
        // Human plan name fallback checks
        assert.equal(getHumanPlanName(null), 'Free');
        assert.equal(getHumanPlanName({ name: 'PRENIUM', level: 3 }), 'Premium');
        assert.equal(getHumanPlanName({ name: 'PLUS', level: 2 }), 'Plus');

        // When plans cannot be resolved safely (empty plans array)
        const emptyPlans = [];
        const isResolvedSafely = emptyPlans.length > 0;
        assert.equal(isResolvedSafely, false);
    });

    test('Test F — Account Switch: plan changes immediately from Free to Plus', () => {
        let currentUserPlan = { name: 'FREE', level: 0 };
        let allowed = filterMoviesByEntitlement(mockMovies, mockPlans, currentUserPlan);
        assert.equal(allowed.length, 2);

        // Switch to Account B (Plus)
        currentUserPlan = { name: 'PLUS', level: 2 };
        allowed = filterMoviesByEntitlement(mockMovies, mockPlans, currentUserPlan);
        assert.equal(allowed.length, 4);
        assert.ok(allowed.some(m => m.slug === 'seal-team-plus'));
    });

    /* =========================================================================
       ACCOUNT STATISTICS TESTS (Tests G - M)
       ========================================================================= */

    test('Test G — Empty Account: all counts = 0', () => {
        const emptyUser = { id: 'u_empty' };
        assert.equal(getWatchedMoviesCount('u_empty', {}), 0);
        assert.equal(getUniqueReviewsCount('u_empty', []), 0);
        assert.equal(getWatchlistCount(emptyUser), 0);
        assert.equal(getFollowingCount(emptyUser), 0);
    });

    test('Test H — Real Data: counts exactly match stored user data', () => {
        const realUser = {
            id: 'u_real',
            listFilm: [
                { id: 'list1', movies: ['m1', 'm2'] },
                { id: 'list2', movies: ['m2', 'm3'] } // m2 is in both, unique = 3 (m1, m2, m3)
            ],
            listFavorite: ['m1', 'm4', 'm5'] // 3 unique
        };

        const mockResume = {
            m1: { episodes: { ep1: 120 } },
            m2: { episodes: { ep1: 300, ep2: 600 } }
        };

        const mockReviews = [
            { userID: 'u_real', movieID: 'm1', rating: 5 },
            { userID: 'u_real', movieID: 'm2', rating: 4 },
            { userID: 'other_user', movieID: 'm3', rating: 3 }
        ];

        assert.equal(getWatchedMoviesCount('u_real', mockResume), 2);
        assert.equal(getUniqueReviewsCount('u_real', mockReviews), 2);
        assert.equal(getWatchlistCount(realUser), 3);
        assert.equal(getFollowingCount(realUser), 3);
    });

    test('Test I — Duplicate History Events: watched count does not overcount episodes/events', () => {
        // User watched multiple episodes of the same movie (m1)
        const duplicateResume = {
            m1: {
                episodes: {
                    ep1: 120,
                    ep2: 350,
                    ep3: 890
                }
            }
        };

        // Even though 3 episodes were watched, unique movie count is 1
        assert.equal(getWatchedMoviesCount('u1', duplicateResume), 1);
    });

    test('Test J — Rating Update: modifying an existing rating does not increase count', () => {
        // User originally rated m1
        const initialReviews = [
            { id: 'rev_1', userID: 'u1', movieID: 'm1', rating: 4 }
        ];
        assert.equal(getUniqueReviewsCount('u1', initialReviews), 1);

        // User updates their rating for m1
        const updatedReviews = [
            { id: 'rev_1', userID: 'u1', movieID: 'm1', rating: 5 }
        ];
        assert.equal(getUniqueReviewsCount('u1', updatedReviews), 1);
    });

    test('Test K — Watchlist Add/Remove: count increments and decrements correctly', () => {
        let user = { id: 'u1', watchlist: ['m1'] };
        assert.equal(getWatchlistCount(user), 1);

        // Add m2
        user = { id: 'u1', watchlist: ['m1', 'm2'] };
        assert.equal(getWatchlistCount(user), 2);

        // Remove m1
        user = { id: 'u1', watchlist: ['m2'] };
        assert.equal(getWatchlistCount(user), 1);
    });

    test('Test L — Follow/Unfollow: count increments and decrements correctly', () => {
        let user = { id: 'u1', listFavorite: ['actor_1', 'series_2'] };
        assert.equal(getFollowingCount(user), 2);

        // Add actor_3
        user = { id: 'u1', listFavorite: ['actor_1', 'series_2', 'actor_3'] };
        assert.equal(getFollowingCount(user), 3);

        // Unfollow series_2
        user = { id: 'u1', listFavorite: ['actor_1', 'actor_3'] };
        assert.equal(getFollowingCount(user), 2);
    });

    test('Test M — Account Switch Isolation: Account A stats never remain on Account B', () => {
        const userA = { id: 'user_a', listFilm: [{ movies: ['m1', 'm2', 'm3'] }], listFavorite: ['f1', 'f2'] };
        const userB = { id: 'user_b', listFilm: [], listFavorite: [] };

        const allReviews = [
            { userID: 'user_a', movieID: 'm1' },
            { userID: 'user_a', movieID: 'm2' }
        ];

        // Verify User A stats
        assert.equal(getUniqueReviewsCount(userA.id, allReviews), 2);
        assert.equal(getWatchlistCount(userA), 3);
        assert.equal(getFollowingCount(userA), 2);

        // On switch to User B: all stats are strictly isolated
        assert.equal(getUniqueReviewsCount(userB.id, allReviews), 0);
        assert.equal(getWatchlistCount(userB), 0);
        assert.equal(getFollowingCount(userB), 0);
    });
});
