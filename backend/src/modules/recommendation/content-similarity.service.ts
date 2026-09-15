import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface MovieContentProfile {
  id: string;
  name: string;
  slug: string;
  imgUrl?: string;
  bannerUrl?: string;
  country?: string;
  categories: string[];
  actors: string[];
  authors: string[];
  description?: string;
  views: number;
  rating: number;
  isHot: boolean;
}

export interface SimilarMovieCandidate {
  movieId: string;
  name: string;
  slug: string;
  imgUrl?: string;
  bannerUrl?: string;
  similarityScore: number;
  reason: string;
  sharedCategories: string[];
  sharedActors: string[];
}

@Injectable()
export class ContentSimilarityService implements OnModuleInit {
  private readonly logger = new Logger(ContentSimilarityService.name);
  private moviesMap = new Map<string, MovieContentProfile>();
  private movieVectors = new Map<string, Map<string, number>>();
  private movieVectorNorms = new Map<string, number>();
  private invertedIndex = new Map<string, Array<{ movieId: string; weight: number }>>();
  private isInitialized = false;

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.refreshCatalogIndex();
  }

  /**
   * Refreshes the in-memory content-based index from PostgreSQL.
   */
  async refreshCatalogIndex(): Promise<number> {
    const t0 = Date.now();
    try {
      const query = `
        SELECT 
          m.id, 
          m.name, 
          m.slug, 
          m.description, 
          m.img_url, 
          m.banner_url, 
          m.views, 
          m.rating, 
          m.is_hot,
          co.name as country,
          COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), ARRAY[]::text[]) as categories,
          COALESCE(array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL), ARRAY[]::text[]) as actors,
          COALESCE(array_agg(DISTINCT au.name) FILTER (WHERE au.name IS NOT NULL), ARRAY[]::text[]) as authors
        FROM movies m
        LEFT JOIN countries co ON m.country_id = co.id
        LEFT JOIN movie_categories mc ON m.id = mc.movie_id
        LEFT JOIN categories c ON mc.category_id = c.id
        LEFT JOIN movie_actors ma ON m.id = ma.movie_id
        LEFT JOIN actors a ON ma.actor_id = a.id
        LEFT JOIN movie_authors mau ON m.id = mau.movie_id
        LEFT JOIN authors au ON mau.author_id = au.id
        GROUP BY m.id, co.name;
      `;

      const result = await this.db.query(query);
      const rows = result.rows;

      this.moviesMap.clear();
      this.movieVectors.clear();
      this.movieVectorNorms.clear();
      this.invertedIndex.clear();

      for (const r of rows) {
        const profile: MovieContentProfile = {
          id: r.id,
          name: r.name,
          slug: r.slug,
          imgUrl: r.img_url,
          bannerUrl: r.banner_url,
          country: r.country,
          categories: r.categories || [],
          actors: r.actors || [],
          authors: r.authors || [],
          description: r.description || '',
          views: parseInt(r.views || '0', 10),
          rating: parseFloat(r.rating || '0'),
          isHot: Boolean(r.is_hot),
        };
        this.moviesMap.set(profile.id, profile);

        // Build feature vector
        const vector = new Map<string, number>();

        // Category features (Weight 3.0)
        for (const cat of profile.categories) {
          const key = `cat:${cat.toLowerCase().trim()}`;
          vector.set(key, (vector.get(key) || 0) + 3.0);
        }

        // Actor features (Weight 2.0)
        for (const actor of profile.actors) {
          const key = `actor:${actor.toLowerCase().trim()}`;
          vector.set(key, (vector.get(key) || 0) + 2.0);
        }

        // Author / Director features (Weight 2.5)
        for (const author of profile.authors) {
          const key = `author:${author.toLowerCase().trim()}`;
          vector.set(key, (vector.get(key) || 0) + 2.5);
        }

        // Country feature (Weight 1.5)
        if (profile.country) {
          const key = `country:${profile.country.toLowerCase().trim()}`;
          vector.set(key, (vector.get(key) || 0) + 1.5);
        }

        // Title token features (Weight 1.0)
        const tokens = this.tokenizeText(profile.name + ' ' + (profile.description || '').slice(0, 200));
        for (const token of tokens) {
          const key = `token:${token}`;
          vector.set(key, (vector.get(key) || 0) + 1.0);
        }

        // Compute vector L2 norm
        let sumSq = 0;
        for (const w of vector.values()) {
          sumSq += w * w;
        }
        const norm = Math.sqrt(sumSq) || 1.0;

        this.movieVectors.set(profile.id, vector);
        this.movieVectorNorms.set(profile.id, norm);

        // Update inverted index for fast candidate retrieval
        for (const [featKey, w] of vector.entries()) {
          if (!this.invertedIndex.has(featKey)) {
            this.invertedIndex.set(featKey, []);
          }
          this.invertedIndex.get(featKey)!.push({ movieId: profile.id, weight: w });
        }
      }

      this.isInitialized = true;
      this.logger.log(`[ContentSimilarity] Indexed ${rows.length} movies in ${Date.now() - t0}ms`);
      return rows.length;
    } catch (err: any) {
      this.logger.error(`Failed to refresh catalog index: ${err.message}`, err.stack);
      return 0;
    }
  }

  /**
   * Find Top-K similar movies to a given target movie.
   */
  getSimilarMovies(movieId: string, limit = 10): SimilarMovieCandidate[] {
    if (!this.isInitialized || !this.moviesMap.has(movieId)) {
      return [];
    }

    const targetMovie = this.moviesMap.get(movieId)!;
    const targetVector = this.movieVectors.get(movieId)!;
    const targetNorm = this.movieVectorNorms.get(movieId)!;

    // Accumulate dot products across matching features using inverted index
    const dotProducts = new Map<string, number>();

    for (const [featKey, targetWeight] of targetVector.entries()) {
      const postings = this.invertedIndex.get(featKey) || [];
      for (const posting of postings) {
        if (posting.movieId === movieId) continue; // Skip self
        dotProducts.set(
          posting.movieId,
          (dotProducts.get(posting.movieId) || 0) + (targetWeight * posting.weight),
        );
      }
    }

    const candidates: SimilarMovieCandidate[] = [];

    for (const [candidateId, dot] of dotProducts.entries()) {
      const candidateMovie = this.moviesMap.get(candidateId);
      if (!candidateMovie) continue;

      const candNorm = this.movieVectorNorms.get(candidateId) || 1.0;
      const cosineSim = dot / (targetNorm * candNorm);

      if (cosineSim < 0.05) continue; // Ignore negligible similarity

      // Derive explanation
      const sharedCategories = targetMovie.categories.filter((c) =>
        candidateMovie.categories.includes(c),
      );
      const sharedActors = targetMovie.actors.filter((a) =>
        candidateMovie.actors.includes(a),
      );

      let reason = 'Gợi ý tương tự';
      if (sharedCategories.length >= 2) {
        reason = `Cùng thể loại ${sharedCategories.slice(0, 2).join(', ')}`;
      } else if (sharedCategories.length === 1) {
        reason = `Cùng thể loại ${sharedCategories[0]}`;
      } else if (sharedActors.length > 0) {
        reason = `Cùng diễn viên ${sharedActors[0]}`;
      } else if (targetMovie.country && targetMovie.country === candidateMovie.country) {
        reason = `Phim ${targetMovie.country} đặc sắc`;
      }

      candidates.push({
        movieId: candidateId,
        name: candidateMovie.name,
        slug: candidateMovie.slug,
        imgUrl: candidateMovie.imgUrl,
        bannerUrl: candidateMovie.bannerUrl,
        similarityScore: Number(cosineSim.toFixed(4)),
        reason,
        sharedCategories,
        sharedActors,
      });
    }

    // Sort descending by similarity score
    candidates.sort((a, b) => b.similarityScore - a.similarityScore);
    return candidates.slice(0, limit);
  }

  /**
   * Find Top-K recommendations for a set of seed movie IDs (e.g. user favorites/views).
   */
  getRecommendationsForSeeds(
    seedMovieIds: string[],
    excludeMovieIds: Set<string> = new Set(),
    limit = 10,
  ): SimilarMovieCandidate[] {
    const aggregateScores = new Map<string, { candidate: SimilarMovieCandidate; totalScore: number }>();

    for (const seedId of seedMovieIds) {
      const similar = this.getSimilarMovies(seedId, 15);
      for (const item of similar) {
        if (excludeMovieIds.has(item.movieId)) continue;

        if (!aggregateScores.has(item.movieId)) {
          aggregateScores.set(item.movieId, { candidate: item, totalScore: item.similarityScore });
        } else {
          const curr = aggregateScores.get(item.movieId)!;
          curr.totalScore += item.similarityScore;
        }
      }
    }

    const results = Array.from(aggregateScores.values())
      .map(({ candidate, totalScore }) => ({
        ...candidate,
        similarityScore: Number(totalScore.toFixed(4)),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return results.slice(0, limit);
  }

  getMovie(movieId: string): MovieContentProfile | undefined {
    return this.moviesMap.get(movieId);
  }

  getAllMovies(): MovieContentProfile[] {
    return Array.from(this.moviesMap.values());
  }

  private tokenizeText(text: string): string[] {
    const stopwords = new Set([
      'la', 'va', 'cua', 'cho', 'trong', 'tren', 'voi', 'mot', 'cac', 'nhung',
      'the', 'and', 'of', 'to', 'in', 'is', 'that', 'with', 'for', 'by', 'an',
    ]);
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w))
      .slice(0, 30); // Max 30 keywords
  }
}
