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

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly CACHE_TTL_SECONDS = 3600; // 1 hour

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly analytics: AnalyticsService,
    private readonly contentSimilarity: ContentSimilarityService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get personalized or baseline recommendations for a user.
   * Caches response in Valkey: mfilm:recommendations:user:<uid || 'anonymous'>.
   */
  async getRecommendations(userId: string | null, limit = 10): Promise<RecommendationResponse> {
    const isEnabled = this.configService.get<string>('RECOMMENDATIONS_ENABLED');
    if (isEnabled === 'false') {
      throw new ServiceUnavailableException('Recommendations are currently disabled');
    }

    const cacheKey = `mfilm:recommendations:user:${userId || 'anonymous'}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...parsed, cached: true };
      }
    } catch (err: any) {
      this.logger.warn(`Valkey cache read error for key ${cacheKey}: ${err.message}`);
    }

    let response: RecommendationResponse;

    if (userId) {
      response = await this.buildPersonalizedRecommendations(userId, limit);
    } else {
      response = await this.buildBaselineRecommendations(null, limit);
    }

    try {
      await this.redis.set(cacheKey, JSON.stringify(response), this.CACHE_TTL_SECONDS);
    } catch (err: any) {
      this.logger.warn(`Valkey cache write error for key ${cacheKey}: ${err.message}`);
    }

    return response;
  }

  /**
   * Build personalized recommendations for an authenticated user.
   * Multi-stage hierarchy:
   * 1. Cold start / sparse (< 3 interactions) -> Content-Based on seeds + Popularity/Trending fallback.
   * 2. Sufficient history (>= 5 interactions) -> Hybrid (Content affinity + Popularity boost; ALS weight = 0 due to sparse real dataset).
   */
  private async buildPersonalizedRecommendations(
    userId: string,
    limit: number,
  ): Promise<RecommendationResponse> {
    try {
      // 1. Fetch user's interactions and favorites
      const [interactionsRes, favoritesRes] = await Promise.all([
        this.db.query(
          `SELECT movie_id, interaction_score, favorite, view_count, play_count 
           FROM user_movie_interactions 
           WHERE user_id = $1 
           ORDER BY interaction_score DESC, last_interaction_at DESC 
           LIMIT 20`,
          [userId],
        ),
        this.db.query(`SELECT movie_id FROM favorites WHERE user_id = $1`, [userId]),
      ]);

      const interactedIds = new Set<string>();
      const seedIds: string[] = [];

      for (const row of favoritesRes.rows) {
        interactedIds.add(row.movie_id);
        seedIds.push(row.movie_id);
      }

      for (const row of interactionsRes.rows) {
        interactedIds.add(row.movie_id);
        if (!seedIds.includes(row.movie_id)) {
          seedIds.push(row.movie_id);
        }
      }

      const totalInteractions = interactedIds.size;

      // Case A: Cold-start user (0 interactions recorded)
      if (totalInteractions === 0) {
        return this.buildBaselineRecommendations(userId, limit);
      }

      // Case B: Sparse user (1-4 interactions) -> Content-Based similarity on seed films
      if (totalInteractions < 5) {
        const candidates = this.contentSimilarity.getRecommendationsForSeeds(
          seedIds,
          interactedIds,
          limit,
        );

        const items: RecommendedMovieItem[] = candidates.map((cand) => {
          const firstSeed = this.contentSimilarity.getMovie(seedIds[0]);
          const seedName = firstSeed ? firstSeed.name : 'phim bạn đã xem';
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

        // Backfill if fewer than limit
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

      // Case C: User with sufficient history (>= 5 interactions) -> Hybrid
      // Note: In accordance with Step 18.C, ALS collaborative weight is set to 0.0
      // because MFILM interaction data is sparse. Hybrid blends Content-Based (70%) + Popularity (30%).
      const contentCandidates = this.contentSimilarity.getRecommendationsForSeeds(
        seedIds.slice(0, 5),
        interactedIds,
        limit * 2,
      );

      const popularCandidates = await this.getPopularityItems(limit * 2, interactedIds);

      // Score fusion
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
   * Build baseline recommendations using Real-Time Trending and Popularity baseline.
   */
  private async buildBaselineRecommendations(
    userId: string | null,
    limit: number,
  ): Promise<RecommendationResponse> {
    try {
      const items = await this.getPopularityItems(limit);
      return {
        success: true,
        userId,
        source: 'popularity',
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
   * Fetch top popular movies with normalized scores.
   */
  private async getPopularityItems(
    limit: number,
    excludeIds: Set<string> = new Set(),
  ): Promise<RecommendedMovieItem[]> {
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

    for (const r of res.rows) {
      if (excludeIds.has(r.id)) continue;

      const views = parseInt(r.views || '0', 10);
      const rating = parseFloat(r.rating || '0');
      // Normalize popularity score between 0.5 and 0.99
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

    return items;
  }
}
