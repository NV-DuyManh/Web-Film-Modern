import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ContentSimilarityService } from './content-similarity.service';

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
   */
  async getRecommendations(userId: string | null, limit = 10): Promise<RecommendationResponse> {
    const isEnabled = this.configService.get<string>('RECOMMENDATIONS_ENABLED');
    if (isEnabled === 'false') {
      throw new ServiceUnavailableException('Recommendations are currently disabled');
    }

    const safeLimit = Math.max(1, Math.min(30, limit));
    const cacheKey = `mfilm:recommendations:user:${userId || 'anonymous'}`;
    const now = Date.now();

    // 1. Check in-process bounded cache (<1ms, zero-cost, survives without Valkey)
    const memCached = this.inMemoryCache.get(cacheKey);
    if (memCached && memCached.expiresAt > now) {
      return { ...memCached.data, cached: true };
    }

    // 2. Check Valkey cache (optional local/distributed)
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

    // 3. Generate recommendations
    let response: RecommendationResponse;
    if (userId) {
      response = await this.buildPersonalizedRecommendations(userId, safeLimit);
    } else {
      response = await this.buildBaselineRecommendations(null, safeLimit);
    }

    // 4. Save to caches
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
   * Build personalized recommendations for an authenticated user.
   * Multi-stage hierarchy:
   * 1. Cold start / sparse (0 interactions) -> Trending / Popularity fallback.
   * 2. Seed-based (1-4 interactions) -> Content-Based similarity on seed films.
   * 3. Sufficient history (>= 5 interactions) -> Hybrid (Content affinity 70% + Popularity 30%).
   */
  private async buildPersonalizedRecommendations(
    userId: string,
    limit: number,
  ): Promise<RecommendationResponse> {
    try {
      const isPostgresUserState = this.configService.get<string>('POSTGRES_USER_STATE_ENABLED') === 'true';
      const seedIds: string[] = [];
      const interactedIds = new Set<string>();

      // Path A: PostgreSQL User State (if enabled)
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
            interactedIds.add(row.movie_id);
            seedIds.push(row.movie_id);
          }
          for (const row of (interactionsRes?.rows || [])) {
            interactedIds.add(row.movie_id);
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
            interactedIds.add(mId);
            seedIds.push(mId);
          }
        } catch (fErr: any) {
          this.logger.warn(`Firestore user favorites fetch failed: ${fErr.message}`);
        }
      }

      const totalInteractions = interactedIds.size;

      // Case A: Cold-start user (0 interactions recorded)
      if (totalInteractions === 0) {
        return this.buildBaselineRecommendations(userId, limit);
      }

      // Case B: Sparse user (1-4 interactions) -> Content-Based similarity
      if (totalInteractions < 5) {
        const candidates = this.contentSimilarity.getRecommendationsForSeeds(
          seedIds,
          interactedIds,
          limit,
        );

        const items: RecommendedMovieItem[] = candidates.map((cand) => {
          const firstSeed = this.contentSimilarity.getMovie(seedIds[0]);
          const seedName = firstSeed ? (firstSeed.name || firstSeed.slug) : 'phim bạn yêu thích';
          return {
            movieId: cand.movieId,
            name: cand.name,
            slug: cand.slug,
            imgUrl: cand.imgUrl,
            bannerUrl: cand.bannerUrl,
            score: cand.similarityScore,
            recommendationSource: 'content_based',
            reason: cand.reason || `Vì bạn thích ${seedName}`,
          };
        });

        // Backfill if fewer than requested limit
        if (items.length < limit) {
          const backfill = await this.getPopularityItems(limit - items.length, interactedIds);
          items.push(...backfill);
        }

        return {
          success: true,
          userId,
          source: 'content_based',
          cached: false,
          total: items.length,
          items: items.slice(0, limit),
        };
      }

      // Case C: Sufficient history (>= 5 interactions) -> Hybrid
      // 70% Content similarity + 30% Popularity boost
      const contentCandidates = this.contentSimilarity.getRecommendationsForSeeds(
        seedIds.slice(0, 5),
        interactedIds,
        limit * 2,
      );

      const popularCandidates = await this.getPopularityItems(limit * 2, interactedIds);
      const scoreMap = new Map<string, RecommendedMovieItem>();

      for (const c of contentCandidates) {
        const hybridScore = Number((c.similarityScore * 0.70).toFixed(4));
        scoreMap.set(c.movieId, {
          movieId: c.movieId,
          name: c.name,
          slug: c.slug,
          imgUrl: c.imgUrl,
          bannerUrl: c.bannerUrl,
          score: hybridScore,
          recommendationSource: 'hybrid',
          reason: c.reason || 'Dành riêng cho bạn',
        });
      }

      for (let i = 0; i < popularCandidates.length; i++) {
        const p = popularCandidates[i];
        const popularityWeight = Math.max(0.05, 0.30 - i * 0.02);
        if (scoreMap.has(p.movieId)) {
          const existing = scoreMap.get(p.movieId)!;
          existing.score = Number((existing.score + popularityWeight).toFixed(4));
        } else {
          scoreMap.set(p.movieId, {
            ...p,
            score: Number(popularityWeight.toFixed(4)),
            recommendationSource: 'hybrid',
            reason: 'Phổ biến được khán giả yêu thích',
          });
        }
      }

      const hybridItems = Array.from(scoreMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        success: true,
        userId,
        source: 'hybrid',
        cached: false,
        total: hybridItems.length,
        items: hybridItems,
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

