import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ContentSimilarityService, normalizeCountry, MovieContentProfile } from './content-similarity.service';

export interface RecommendedMovieItem {
  movieId: string;
  name: string;
  slug: string;
  imgUrl?: string;
  bannerUrl?: string;
  score: number;
  recommendationSource: 'hybrid' | 'content_based' | 'trending' | 'popularity';
  reason: string;
}

export interface RecommendationResponse {
  success: boolean;
  userId: string | null;
  source: 'hybrid' | 'content_based' | 'trending' | 'popularity';
  cached: boolean;
  total: number;
  items: RecommendedMovieItem[];
}

interface CacheEntry {
  data: RecommendationResponse;
  expiresAt: number;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly CACHE_TTL_SECONDS = 3600; // 1 hour
  private readonly inMemoryCache = new Map<string, CacheEntry>();
  private readonly MAX_CACHE_ENTRIES = 100;

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly analytics: AnalyticsService,
    private readonly contentSimilarity: ContentSimilarityService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get personalized or baseline recommendations for a user.
   * Caches response with bounded in-memory cache and optional Valkey.
   * Incorporates user ID, limit, and favorites fingerprint into cache key to prevent stale cache on favorite changes.
   */
  async getRecommendations(userId: string | null, limit = 10): Promise<RecommendationResponse> {
    const isEnabled = this.configService.get<string>('RECOMMENDATIONS_ENABLED');
    if (isEnabled === 'false') {
      throw new ServiceUnavailableException('Recommendations are currently disabled');
    }

    const safeLimit = Math.max(1, Math.min(30, limit));
    const now = Date.now();

    // 1. Resolve user favorites first to create a versioned cache fingerprint
    let seedIds: string[] = [];
    if (userId) {
      seedIds = await this.resolveUserFavoriteIds(userId);
    }

    const favFingerprint = seedIds.length > 0
      ? seedIds.slice().sort().join(',').slice(0, 48)
      : 'none';
    const cacheKey = `mfilm:rec:u:${userId || 'anon'}:fav:${favFingerprint}:lim:${safeLimit}`;

    // 2. Check in-process bounded cache (<1ms, zero-cost, survives without Valkey)
    const memCached = this.inMemoryCache.get(cacheKey);
    if (memCached && memCached.expiresAt > now) {
      return { ...memCached.data, cached: true };
    }

    // 3. Check Valkey cache (optional local/distributed)
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.setInMemoryCache(cacheKey, parsed, this.CACHE_TTL_SECONDS);
        return { ...parsed, cached: true };
      }
    } catch (err: any) {
      this.logger.warn(`Valkey cache read error for key ${cacheKey}: ${err.message}`);
    }

    // 4. Generate recommendations
    let response: RecommendationResponse;
    if (userId && seedIds.length > 0) {
      response = await this.buildPersonalizedRecommendations(userId, seedIds, safeLimit);
    } else {
      response = await this.buildBaselineRecommendations(userId, safeLimit);
    }

    // 5. Save to caches
    this.setInMemoryCache(cacheKey, response, this.CACHE_TTL_SECONDS);
    try {
      await this.redis.set(cacheKey, JSON.stringify(response), this.CACHE_TTL_SECONDS);
    } catch (err: any) {
      this.logger.warn(`Valkey cache write error for key ${cacheKey}: ${err.message}`);
    }

    return response;
  }

  private setInMemoryCache(key: string, data: RecommendationResponse, ttlSeconds: number) {
    if (this.inMemoryCache.size >= this.MAX_CACHE_ENTRIES) {
      const oldestKey = this.inMemoryCache.keys().next().value;
      if (oldestKey) this.inMemoryCache.delete(oldestKey);
    }
    this.inMemoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Resolves user favorite IDs from PostgreSQL (if enabled) or Firebase Firestore.
   */
  private async resolveUserFavoriteIds(userId: string): Promise<string[]> {
    const isPostgresUserState = this.configService.get<string>('POSTGRES_USER_STATE_ENABLED') === 'true';
    const seedIds: string[] = [];

    // Path A: PostgreSQL User State (if explicitly enabled)
    if (isPostgresUserState) {
      try {
        const [interactionsRes, favoritesRes] = await Promise.all([
          this.db.query(
            `SELECT movie_id FROM user_movie_interactions WHERE user_id = $1 ORDER BY interaction_score DESC LIMIT 20`,
            [userId],
          ),
          this.db.query(`SELECT movie_id FROM favorites WHERE user_id = $1`, [userId]),
        ]);

        for (const row of (favoritesRes?.rows || [])) {
          if (!seedIds.includes(row.movie_id)) seedIds.push(row.movie_id);
        }
        for (const row of (interactionsRes?.rows || [])) {
          if (!seedIds.includes(row.movie_id)) seedIds.push(row.movie_id);
        }
      } catch (pgErr: any) {
        this.logger.warn(`PostgreSQL user state fetch failed: ${pgErr.message}`);
      }
    }

    // Path B: Firebase Firestore ($0 Production User State)
    if (seedIds.length === 0) {
      try {
        const favorites = await this.contentSimilarity.getUserFavorites(userId);
        for (const mId of favorites) {
          if (!seedIds.includes(mId)) seedIds.push(mId);
        }
      } catch (fErr: any) {
        this.logger.warn(`Firestore user favorites fetch failed: ${fErr.message}`);
      }
    }

    return seedIds;
  }

  /**
   * Build personalized recommendations for an authenticated user with interaction history.
   * Multi-signal scoring:
   * - Content Similarity (max + mean multi-seed cosine similarity): 40%
   * - Genre / Category Preference Match: 25%
   * - Dynamic Country Affinity: Up to +0.35 boost for high concentration (e.g. >=80% Vietnam)
   * - Behavioral Trending (Tinybird 15m window): Max 15%
   * - Catalog Popularity / Views: Pure tie-breaker (Max 5%)
   * - Diversity re-ranking to avoid genre or franchise saturation.
   */
  private async buildPersonalizedRecommendations(
    userId: string,
    seedIds: string[],
    limit: number,
  ): Promise<RecommendationResponse> {
    try {
      const interactedIds = new Set<string>(seedIds);
      const profile = this.contentSimilarity.buildUserPreferenceProfile(userId, seedIds);

      // 1. Candidate Generation: Multi-seed similarity + Genre matches + Dominant country matches
      const rawCandidates = this.contentSimilarity.getCandidatesForProfile(
        profile,
        interactedIds,
        Math.max(limit * 4, 40),
      );

      // Backfill from catalog if candidate pool is small
      if (rawCandidates.length < limit * 2) {
        const allMovies = this.contentSimilarity.getAllMovies();
        for (const m of allMovies) {
          if (!interactedIds.has(m.id) && !rawCandidates.some((c) => c.id === m.id)) {
            rawCandidates.push(m);
            if (rawCandidates.length >= limit * 3) break;
          }
        }
      }

      // 2. Fetch real-time trending map (Tinybird 15-minute rolling window)
      const trendingMap = new Map<string, number>();
      try {
        if (this.analytics?.getTrendingMovies) {
          const trendingRes = await this.analytics.getTrendingMovies(20);
          const trendingList = Array.isArray(trendingRes?.data) ? trendingRes.data : [];
          for (const t of trendingList) {
            const mId = String(t.movieId || t.id || '');
            if (mId) trendingMap.set(mId, Number(t.activeViewers) || 1);
          }
        }
      } catch (err: any) {
        // Safe non-blocking fallback
      }

      // 3. Multi-Signal Scoring
      interface ScoredCandidate {
        movie: MovieContentProfile;
        score: number;
        simScore: number;
        genreScore: number;
        countryBoost: number;
        trendScore: number;
        popScore: number;
        matchedSeedName?: string;
        matchedCats: string[];
      }

      const scoredList: ScoredCandidate[] = [];

      for (const m of rawCandidates) {
        // A. Multi-Seed Similarity Aggregation (0.65 max + 0.35 avg)
        let maxSim = 0;
        let sumSim = 0;
        let simCount = 0;
        let bestSeedId: string | null = null;

        for (const sId of seedIds) {
          const sim = this.contentSimilarity.computeCosineSimilarity(m.id, sId);
          if (sim > maxSim) {
            maxSim = sim;
            bestSeedId = sId;
          }
          if (sim > 0.05) {
            sumSim += sim;
            simCount++;
          }
        }
        const avgSim = simCount > 0 ? sumSim / simCount : 0;
        const simScore = Number((0.65 * maxSim + 0.35 * avgSim).toFixed(4));

        // B. Genre Match Score
        const matchedCats = m.categories.filter((c) => profile.topCategories.includes(c));
        const genreScore = profile.topCategories.length > 0
          ? Number(Math.min(1.0, (matchedCats.length / profile.topCategories.length) * 1.2).toFixed(4))
          : 0;

        // C. Dynamic Country Affinity Boost
        const candCountry = normalizeCountry(m.country);
        let countryBoost = 0;
        const isDominantCountry = Boolean(
          profile.dominantCountry && candCountry && candCountry === profile.dominantCountry,
        );

        if (isDominantCountry) {
          if (profile.countryConcentration >= 0.80) {
            countryBoost = 0.35; // Material priority for Vietnam / dominant country
          } else if (profile.countryConcentration >= 0.60) {
            countryBoost = 0.22; // Strong preference
          } else if (profile.countryConcentration >= 0.40) {
            countryBoost = 0.12; // Moderate preference
          } else {
            countryBoost = 0.05;
          }
        } else if (profile.dominantCountry && profile.countryConcentration >= 0.80) {
          // Downweight non-matching country when user has >= 80% single country preference
          countryBoost = -0.05;
        }

        // D. Behavioral Trending Signal (Max 0.15)
        let trendScore = 0;
        if (trendingMap.has(m.id)) {
          const viewers = trendingMap.get(m.id)!;
          trendScore = Number(Math.min(0.15, 0.08 + (viewers / 20) * 0.07).toFixed(4));
        }

        // E. Popularity / Views Tie-Breaker (Max 0.05)
        const popScore = Number(
          (
            0.02 * Math.min(1.0, (m.views || 0) / 50000) +
            0.02 * Math.min(1.0, (m.rating || 0) / 10) +
            (m.isHot ? 0.01 : 0.0)
          ).toFixed(4),
        );

        // F. Final Weighted Score
        const rawScore = 0.40 * simScore + 0.25 * genreScore + countryBoost + trendScore + popScore;
        const finalScore = Number(Math.max(0.10, Math.min(0.99, rawScore)).toFixed(4));

        let bestSeedName: string | undefined;
        if (bestSeedId) {
          const sMovie = this.contentSimilarity.getMovie(bestSeedId);
          bestSeedName = sMovie?.name || sMovie?.slug;
        }

        scoredList.push({
          movie: m,
          score: finalScore,
          simScore,
          genreScore,
          countryBoost,
          trendScore,
          popScore,
          matchedSeedName: bestSeedName,
          matchedCats,
        });
      }

      // 4. Sort descending by personalized score
      scoredList.sort((a, b) => b.score - a.score);

      // 5. Diversity Re-ranking
      const selected: ScoredCandidate[] = [];
      const genreCounts = new Map<string, number>();
      const isHighCountryFocus = profile.countryConcentration >= 0.60;

      for (const item of scoredList) {
        if (selected.length >= limit) break;

        const primaryGenre = item.movie.categories[0] || 'other';
        const currentGenreCount = genreCounts.get(primaryGenre) || 0;

        // For broad users: avoid flooding recommendations with a single genre
        if (!isHighCountryFocus && currentGenreCount >= 4 && scoredList.length > limit) {
          continue;
        }

        selected.push(item);
        genreCounts.set(primaryGenre, currentGenreCount + 1);
      }

      // If diversity filter left fewer than limit, backfill from remaining scored candidates
      if (selected.length < limit) {
        for (const item of scoredList) {
          if (selected.length >= limit) break;
          if (!selected.some((s) => s.movie.id === item.movie.id)) {
            selected.push(item);
          }
        }
      }

      // 6. Build final RecommendedMovieItem array with truthful reasons
      const items: RecommendedMovieItem[] = selected.slice(0, limit).map((s) => {
        let reason = 'Dành riêng cho bạn';
        const candCountry = normalizeCountry(s.movie.country);

        if (s.countryBoost >= 0.20 && profile.dominantCountry) {
          reason = `Vì bạn yêu thích nhiều phim ${profile.dominantCountry}`;
        } else if (s.matchedCats.length >= 2) {
          reason = `Cùng thể loại ${s.matchedCats.slice(0, 2).join(', ')}`;
        } else if (s.matchedCats.length === 1) {
          reason = `Cùng thể loại ${s.matchedCats[0]} bạn quan tâm`;
        } else if (s.simScore >= 0.25 && s.matchedSeedName) {
          reason = `Tương tự với "${s.matchedSeedName}" bạn đã lưu`;
        } else if (s.trendScore > 0) {
          reason = 'Phù hợp với bạn và đang thịnh hành';
        } else if (candCountry) {
          reason = `Phim ${candCountry} phù hợp với bạn`;
        }

        return {
          movieId: s.movie.id,
          name: s.movie.name,
          slug: s.movie.slug,
          imgUrl: s.movie.imgUrl,
          bannerUrl: s.movie.bannerUrl,
          score: s.score,
          recommendationSource: 'hybrid',
          reason,
        };
      });

      const source = seedIds.length >= 5 || items.some((i) => i.score > 0.6) ? 'hybrid' : 'content_based';

      return {
        success: true,
        userId,
        source,
        cached: false,
        total: items.length,
        items,
      };
    } catch (err: any) {
      this.logger.error(`Error generating personalized recommendations: ${err.message}`, err.stack);
      return this.buildBaselineRecommendations(userId, limit);
    }
  }

  /**
   * Build baseline recommendations using Real-Time Trending (Tinybird) and Popularity baseline.
   */
  private async buildBaselineRecommendations(
    userId: string | null,
    limit: number,
  ): Promise<RecommendationResponse> {
    try {
      const items = await this.getTrendingAndPopularityItems(limit);
      const source = items.some((i) => i.recommendationSource === 'trending') ? 'trending' : 'popularity';

      return {
        success: true,
        userId,
        source,
        cached: false,
        total: items.length,
        items,
      };
    } catch (err: any) {
      this.logger.error(`Error building baseline recommendations: ${err.message}`, err.stack);
      return {
        success: false,
        userId,
        source: 'popularity',
        cached: false,
        total: 0,
        items: [],
      };
    }
  }

  /**
   * Blend real-time Tinybird active trending with catalog popularity.
   */
  private async getTrendingAndPopularityItems(
    limit: number,
    excludeIds: Set<string> = new Set(),
  ): Promise<RecommendedMovieItem[]> {
    const items: RecommendedMovieItem[] = [];
    const seenIds = new Set<string>(excludeIds);

    // 1. Try Tinybird real-time trending (rolling 15m)
    try {
      if (this.analytics?.getTrendingMovies) {
        const trendingRes = await this.analytics.getTrendingMovies(limit);
        const trendingList = Array.isArray(trendingRes?.data) ? trendingRes.data : [];

        for (const t of trendingList) {
          const mId = String(t.movieId || t.id || '');
          if (!mId || mId === 'none' || seenIds.has(mId)) continue;

          const movie = this.contentSimilarity.getMovie(mId);
          seenIds.add(mId);

          items.push({
            movieId: mId,
            name: movie?.name || t.name || mId,
            slug: movie?.slug || t.slug || mId,
            imgUrl: movie?.imgUrl || t.imgUrl || '',
            bannerUrl: movie?.bannerUrl || t.bannerUrl || '',
            score: Number(Math.min(0.99, 0.75 + (t.activeViewers || 1) * 0.05).toFixed(4)),
            recommendationSource: 'trending',
            reason: 'Đang được xem nhiều gần đây',
          });

          if (items.length >= limit) break;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch Tinybird trending: ${err.message}`);
    }

    // 2. Backfill with Catalog Popularity if fewer than requested limit
    if (items.length < limit) {
      const remaining = limit - items.length;
      const popItems = await this.getPopularityItems(remaining, seenIds);
      items.push(...popItems);
    }

    return items.slice(0, limit);
  }

  /**
   * Fetch top popular movies with normalized scores.
   * Priority:
   * 1. If POSTGRES_CATALOG_ENABLED=true and DB returns rows, use PostgreSQL.
   * 2. Otherwise ($0 Production Cloud), use ContentSimilarityService in-memory catalog index.
   */
  private async getPopularityItems(
    limit: number,
    excludeIds: Set<string> = new Set(),
  ): Promise<RecommendedMovieItem[]> {
    const isPostgresEnabled = this.configService.get<string>('POSTGRES_CATALOG_ENABLED') === 'true';

    // Path 1: PostgreSQL query (if enabled)
    if (isPostgresEnabled) {
      try {
        const query = `
          SELECT 
            m.id, 
            m.name, 
            m.slug, 
            m.img_url, 
            m.banner_url, 
            m.views, 
            m.rating, 
            m.is_hot,
            co.name as country
          FROM movies m
          LEFT JOIN countries co ON m.country_id = co.id
          ORDER BY (m.views * 0.5 + m.rating * 100 + CASE WHEN m.is_hot THEN 1000 ELSE 0 END) DESC
          LIMIT $1;
        `;
        const res = await this.db.query(query, [Math.max(limit * 2, 20)]);
        const items: RecommendedMovieItem[] = [];

        for (const r of (res?.rows || [])) {
          if (excludeIds.has(r.id)) continue;
          const views = parseInt(r.views || '0', 10);
          const rating = parseFloat(r.rating || '0');
          const score = Number(Math.min(0.99, 0.5 + (views / 20000) * 0.3 + (rating / 10) * 0.2).toFixed(4));

          let reason = 'Phim thịnh hành';
          if (r.is_hot) reason = 'Phim hot được xem nhiều';
          else if (rating >= 8.5) reason = `Đánh giá cao (${rating}⭐)`;
          else if (r.country) reason = `Phim ${r.country} nổi bật`;

          items.push({
            movieId: r.id,
            name: r.name,
            slug: r.slug,
            imgUrl: r.img_url,
            bannerUrl: r.banner_url,
            score,
            recommendationSource: 'popularity',
            reason,
          });

          if (items.length >= limit) break;
        }

        if (items.length > 0) return items;
      } catch (err: any) {
        this.logger.warn(`PostgreSQL getPopularityItems failed: ${err.message}. Falling back to in-memory catalog.`);
      }
    }

    // Path 2: In-memory Catalog Index ($0 Production Cloud Safe)
    const topMovies = this.contentSimilarity?.getTopMoviesByViews
      ? this.contentSimilarity.getTopMoviesByViews(limit * 2, excludeIds)
      : [];
    const items: RecommendedMovieItem[] = [];

    for (const m of topMovies) {
      const views = m.views || 0;
      const rating = m.rating || 0;
      const score = Number(Math.min(0.99, 0.5 + (views / 20000) * 0.3 + (rating / 10) * 0.2).toFixed(4));

      let reason = 'Phim thịnh hành';
      if (m.isHot) reason = 'Phim hot được xem nhiều';
      else if (rating >= 8.5) reason = `Đánh giá cao (${rating}⭐)`;
      else if (m.country) reason = `Phim ${m.country} nổi bật`;

      items.push({
        movieId: m.id,
        name: m.name,
        slug: m.slug,
        imgUrl: m.imgUrl,
        bannerUrl: m.bannerUrl,
        score,
        recommendationSource: 'popularity',
        reason,
      });

      if (items.length >= limit) break;
    }

    return items;
  }
}

