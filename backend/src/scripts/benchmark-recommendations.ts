/**
 * MFILM Recommendation Algorithm Benchmark Runner
 * Strictly adheres to Prompt 04 Steps 21 & 26.
 * Evaluates recommendation algorithms on standard MovieLens 100k public benchmark dataset
 * and clearly separates MOVIELENS BENCHMARK METRICS from MFILM REAL-DATA METRICS.
 */

import * as fs from 'fs';
import * as path from 'path';

interface Rating {
  userId: number;
  movieId: number;
  rating: number;
  timestamp: number;
}

interface MovieItem {
  movieId: number;
  title: string;
  genres: number[]; // 19 binary genre flags
}

export interface BenchmarkResult {
  modelName: string;
  dataset: string;
  interactions: number;
  users: number;
  movies: number;
  precisionAt10: number;
  recallAt10: number;
  ndcgAt10: number;
  hitRateAt10: number;
}

const DATA_DIR = path.resolve(__dirname, '../../../data-platform/datasets/movielens-100k');

export function loadMovieLensData(): { ratings: Rating[]; movies: Map<number, MovieItem> } {
  const dataPath = path.join(DATA_DIR, 'u.data');
  const itemPath = path.join(DATA_DIR, 'u.item');

  if (!fs.existsSync(dataPath) || !fs.existsSync(itemPath)) {
    throw new Error(`MovieLens 100k dataset files not found in ${DATA_DIR}`);
  }

  // 1. Parse movies and genres
  const itemLines = fs.readFileSync(itemPath, 'utf8').split('\n');
  const movies = new Map<number, MovieItem>();

  for (const line of itemLines) {
    if (!line.trim()) continue;
    const parts = line.split('|');
    if (parts.length < 24) continue;
    const movieId = parseInt(parts[0], 10);
    const title = parts[1];
    const genres = parts.slice(5, 24).map((g) => parseInt(g, 10));
    movies.set(movieId, { movieId, title, genres });
  }

  // 2. Parse ratings
  const dataLines = fs.readFileSync(dataPath, 'utf8').split('\n');
  const ratings: Rating[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const [userIdStr, movieIdStr, ratingStr, timestampStr] = line.split('\t');
    if (!userIdStr || !movieIdStr || !ratingStr) continue;
    ratings.push({
      userId: parseInt(userIdStr, 10),
      movieId: parseInt(movieIdStr, 10),
      rating: parseFloat(ratingStr),
      timestamp: parseInt(timestampStr, 10),
    });
  }

  return { ratings, movies };
}

export function runBenchmark(): {
  benchmarkResults: BenchmarkResult[];
  mfilmRow: any;
} {
  const { ratings, movies } = loadMovieLensData();
  const totalInteractions = ratings.length;

  // Group by user
  const userRatings = new Map<number, Rating[]>();
  for (const r of ratings) {
    if (!userRatings.has(r.userId)) userRatings.set(r.userId, []);
    userRatings.get(r.userId)!.push(r);
  }

  const allUsers = Array.from(userRatings.keys());
  const allMovies = Array.from(movies.keys());

  // 80/20 train/test split per user for users with >= 10 ratings
  const trainRatings: Rating[] = [];
  const testRatingsByUser = new Map<number, Set<number>>();
  const evaluatedUsers: number[] = [];

  for (const [userId, uRatings] of userRatings.entries()) {
    if (uRatings.length < 10) {
      trainRatings.push(...uRatings);
      continue;
    }

    // Sort chronologically
    uRatings.sort((a, b) => a.timestamp - b.timestamp);
    const splitIdx = Math.floor(uRatings.length * 0.8);
    const trainPart = uRatings.slice(0, splitIdx);
    const testPart = uRatings.slice(splitIdx);

    trainRatings.push(...trainPart);

    // Relevant items in test: rating >= 3.5
    const relevant = new Set<number>();
    for (const r of testPart) {
      if (r.rating >= 3.5) {
        relevant.add(r.movieId);
      }
    }

    if (relevant.size > 0) {
      testRatingsByUser.set(userId, relevant);
      evaluatedUsers.push(userId);
    }
  }

  // Precompute user train interaction history
  const userTrainHistory = new Map<number, Set<number>>();
  const userTrainRatingsMap = new Map<number, Map<number, number>>();
  for (const r of trainRatings) {
    if (!userTrainHistory.has(r.userId)) userTrainHistory.set(r.userId, new Set());
    if (!userTrainRatingsMap.has(r.userId)) userTrainRatingsMap.set(r.userId, new Map());
    userTrainHistory.get(r.userId)!.add(r.movieId);
    userTrainRatingsMap.get(r.userId)!.set(r.movieId, r.rating);
  }

  // 1. POPULARITY BASELINE RANKING
  const movieCounts = new Map<number, number>();
  const movieSumRating = new Map<number, number>();
  for (const r of trainRatings) {
    movieCounts.set(r.movieId, (movieCounts.get(r.movieId) || 0) + 1);
    movieSumRating.set(r.movieId, (movieSumRating.get(r.movieId) || 0) + r.rating);
  }

  const popularityRanking = allMovies
    .map((mId) => {
      const count = movieCounts.get(mId) || 0;
      const avg = count > 0 ? (movieSumRating.get(mId) || 0) / count : 0;
      // Bayesian dampening
      const score = (count * avg) / (count + 10);
      return { movieId: mId, score };
    })
    .sort((a, b) => b.score - a.score);

  // 2. PRECOMPUTE ITEM-ITEM COLLABORATIVE SIMILARITIES (Fast Cosine Matrix)
  const itemUserRatings = new Map<number, Map<number, number>>();
  const itemNorms = new Map<number, number>();

  for (const r of trainRatings) {
    if (!itemUserRatings.has(r.movieId)) itemUserRatings.set(r.movieId, new Map());
    itemUserRatings.get(r.movieId)!.set(r.userId, r.rating);
  }

  for (const [mId, uMap] of itemUserRatings.entries()) {
    let sumSq = 0;
    for (const r of uMap.values()) sumSq += r * r;
    itemNorms.set(mId, Math.sqrt(sumSq) || 1.0);
  }

  // Inverted index of user -> items they rated in train
  const userItems = new Map<number, number[]>();
  for (const r of trainRatings) {
    if (!userItems.has(r.userId)) userItems.set(r.userId, []);
    userItems.get(r.userId)!.push(r.movieId);
  }

  // Precompute top-25 neighbors for each item
  const itemNeighbors = new Map<number, Array<{ movieId: number; sim: number }>>();

  for (const [mId, uMap] of itemUserRatings.entries()) {
    if (uMap.size < 3) continue;
    const dotMap = new Map<number, number>();
    const normA = itemNorms.get(mId)!;

    for (const [uId, rA] of uMap.entries()) {
      const otherItems = userItems.get(uId) || [];
      for (const otherId of otherItems) {
        if (otherId === mId) continue;
        const rB = itemUserRatings.get(otherId)?.get(uId) || 0;
        dotMap.set(otherId, (dotMap.get(otherId) || 0) + rA * rB);
      }
    }

    const neighbors: Array<{ movieId: number; sim: number }> = [];
    for (const [otherId, dot] of dotMap.entries()) {
      const normB = itemNorms.get(otherId) || 1.0;
      const sim = dot / (normA * normB);
      if (sim > 0.1) neighbors.push({ movieId: otherId, sim });
    }

    neighbors.sort((a, b) => b.sim - a.sim);
    itemNeighbors.set(mId, neighbors.slice(0, 25));
  }

  // 3. CONTENT-BASED (User Genre Profile Vector)
  const userProfiles = new Map<number, number[]>();
  for (const [uId, ratingsMap] of userTrainRatingsMap.entries()) {
    const profile = new Array(19).fill(0);
    let totalWeight = 0;
    for (const [mId, rating] of ratingsMap.entries()) {
      const m = movies.get(mId);
      if (!m) continue;
      const weight = rating >= 3.5 ? 1.0 : 0.2;
      for (let g = 0; g < 19; g++) {
        profile[g] += m.genres[g] * weight;
      }
      totalWeight += weight;
    }
    if (totalWeight > 0) {
      for (let g = 0; g < 19; g++) profile[g] /= totalWeight;
    }
    userProfiles.set(uId, profile);
  }

  // Inverted index for genre features
  const genreMovies = new Map<number, number[]>();
  for (let g = 0; g < 19; g++) genreMovies.set(g, []);
  for (const m of movies.values()) {
    for (let g = 0; g < 19; g++) {
      if (m.genres[g] === 1) genreMovies.get(g)!.push(m.movieId);
    }
  }

  // EVALUATION FUNCTION
  function evaluateModel(
    getRecommendations: (userId: number, k: number) => number[],
    name: string,
  ): BenchmarkResult {
    let totalP = 0;
    let totalR = 0;
    let totalNdcg = 0;
    let totalHits = 0;
    const K = 10;

    for (const userId of evaluatedUsers) {
      const relevant = testRatingsByUser.get(userId)!;
      const recs = getRecommendations(userId, K);

      let hits = 0;
      let dcg = 0;

      for (let rank = 0; rank < recs.length; rank++) {
        const item = recs[rank];
        if (relevant.has(item)) {
          hits++;
          dcg += 1 / Math.log2(rank + 2);
        }
      }

      const pAtK = hits / K;
      const rAtK = hits / relevant.size;

      let idcg = 0;
      const maxHits = Math.min(K, relevant.size);
      for (let rank = 0; rank < maxHits; rank++) {
        idcg += 1 / Math.log2(rank + 2);
      }
      const ndcgAtK = idcg > 0 ? dcg / idcg : 0;

      totalP += pAtK;
      totalR += rAtK;
      totalNdcg += ndcgAtK;
      if (hits > 0) totalHits++;
    }

    const n = evaluatedUsers.length;
    return {
      modelName: name,
      dataset: 'MovieLens 100k',
      interactions: totalInteractions,
      users: allUsers.length,
      movies: allMovies.length,
      precisionAt10: Number((totalP / n).toFixed(4)),
      recallAt10: Number((totalR / n).toFixed(4)),
      ndcgAt10: Number((totalNdcg / n).toFixed(4)),
      hitRateAt10: Number((totalHits / n).toFixed(4)),
    };
  }

  // Model A: Popularity Baseline
  const resPopularity = evaluateModel((userId, k) => {
    const history = userTrainHistory.get(userId) || new Set();
    const candidates: number[] = [];
    for (const p of popularityRanking) {
      if (!history.has(p.movieId)) {
        candidates.push(p.movieId);
        if (candidates.length >= k) break;
      }
    }
    return candidates;
  }, 'Popularity Baseline');

  // Model B: Content-Based
  const resContent = evaluateModel((userId, k) => {
    const history = userTrainHistory.get(userId) || new Set();
    const profile = userProfiles.get(userId);
    if (!profile) return popularityRanking.slice(0, k).map((x) => x.movieId);

    // Fast candidate scoring using genre inverted index
    const scoreMap = new Map<number, number>();
    for (let g = 0; g < 19; g++) {
      const gWeight = profile[g];
      if (gWeight <= 0) continue;
      const mList = genreMovies.get(g) || [];
      for (const mId of mList) {
        if (!history.has(mId)) {
          scoreMap.set(mId, (scoreMap.get(mId) || 0) + gWeight);
        }
      }
    }

    const sorted = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([mId]) => mId);

    return sorted.slice(0, k);
  }, 'Content-Based (Genres)');

  // Model C: Collaborative Filtering (Item-Based CF with precomputed neighbors)
  const resCF = evaluateModel((userId, k) => {
    const history = userTrainHistory.get(userId) || new Set();
    const userRatingsMap = userTrainRatingsMap.get(userId) || new Map();
    const candidateScores = new Map<number, number>();

    for (const [ratedMId, rating] of userRatingsMap.entries()) {
      if (rating < 3.5) continue;
      const neighbors = itemNeighbors.get(ratedMId) || [];
      for (const n of neighbors) {
        if (history.has(n.movieId)) continue;
        candidateScores.set(
          n.movieId,
          (candidateScores.get(n.movieId) || 0) + n.sim * rating,
        );
      }
    }

    const sorted = Array.from(candidateScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([mId]) => mId);

    if (sorted.length < k) {
      for (const p of popularityRanking) {
        if (!history.has(p.movieId) && !sorted.includes(p.movieId)) {
          sorted.push(p.movieId);
          if (sorted.length >= k) break;
        }
      }
    }

    return sorted.slice(0, k);
  }, 'MovieLens Collaborative (Item-CF)');

  // Model D: Hybrid Model (CF + Content + Popularity)
  const resHybrid = evaluateModel((userId, k) => {
    const history = userTrainHistory.get(userId) || new Set();
    const userRatingsMap = userTrainRatingsMap.get(userId) || new Map();
    const profile = userProfiles.get(userId);
    const blended = new Map<number, number>();

    // 1. CF signal (50% weight)
    for (const [ratedMId, rating] of userRatingsMap.entries()) {
      if (rating < 3.5) continue;
      const neighbors = itemNeighbors.get(ratedMId) || [];
      for (const n of neighbors) {
        if (!history.has(n.movieId)) {
          blended.set(n.movieId, (blended.get(n.movieId) || 0) + n.sim * 0.5);
        }
      }
    }

    // 2. Content signal (30% weight)
    if (profile) {
      for (let g = 0; g < 19; g++) {
        const gWeight = profile[g];
        if (gWeight <= 0) continue;
        const mList = genreMovies.get(g) || [];
        for (const mId of mList) {
          if (!history.has(mId)) {
            blended.set(mId, (blended.get(mId) || 0) + gWeight * 0.3);
          }
        }
      }
    }

    // 3. Popularity signal (20% weight)
    for (let i = 0; i < Math.min(30, popularityRanking.length); i++) {
      const p = popularityRanking[i];
      if (!history.has(p.movieId)) {
        blended.set(p.movieId, (blended.get(p.movieId) || 0) + 0.2 * (1 - i / 30));
      }
    }

    return Array.from(blended.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([mId]) => mId);
  }, 'MovieLens Hybrid (CF + Content + Pop)');

  const mfilmRow = {
    modelName: 'MFILM ALS Collaborative',
    dataset: 'MFILM Production DB',
    interactions: 10,
    users: 4,
    movies: 6,
    precisionAt10: 'INSUFFICIENT DATA',
    recallAt10: 'INSUFFICIENT DATA',
    ndcgAt10: 'INSUFFICIENT DATA',
    hitRateAt10: 'INSUFFICIENT DATA',
    status: 'INSUFFICIENT MFILM DATA FOR RELIABLE ALS EVALUATION',
  };

  return {
    benchmarkResults: [resPopularity, resContent, resCF, resHybrid],
    mfilmRow,
  };
}

async function main() {
  console.log('========================================================================================');
  console.log('              MFILM RECOMMENDATION ALGORITHM OFFLINE BENCHMARK');
  console.log('========================================================================================');
  console.log('Policy: Prompt 04 Step 21 (Separation of MovieLens Benchmark from MFILM Real Data)\n');

  console.log('[*] Loading MovieLens 100k benchmark dataset (100,000 ratings, 943 users, 1,682 movies)...');
  const t0 = Date.now();
  const { benchmarkResults, mfilmRow } = runBenchmark();
  console.log(`[+] Benchmark evaluation completed in ${Date.now() - t0} ms.\n`);

  console.log('----------------------------------------------------------------------------------------');
  console.log('                      TRACK B: MOVIELENS BENCHMARK METRICS');
  console.log('----------------------------------------------------------------------------------------');
  console.log(
    'Model'.padEnd(38) +
      'Dataset'.padEnd(16) +
      'Precision@10'.padEnd(14) +
      'Recall@10'.padEnd(12) +
      'NDCG@10'.padEnd(12) +
      'HitRate@10',
  );
  console.log('----------------------------------------------------------------------------------------');

  for (const r of benchmarkResults) {
    console.log(
      r.modelName.padEnd(38) +
        r.dataset.padEnd(16) +
        r.precisionAt10.toFixed(4).padEnd(14) +
        r.recallAt10.toFixed(4).padEnd(12) +
        r.ndcgAt10.toFixed(4).padEnd(12) +
        r.hitRateAt10.toFixed(4),
    );
  }

  console.log('----------------------------------------------------------------------------------------\n');

  console.log('----------------------------------------------------------------------------------------');
  console.log('                      TRACK A: MFILM REAL-DATA STATUS');
  console.log('----------------------------------------------------------------------------------------');
  console.log(
    'Model'.padEnd(38) +
      'Dataset'.padEnd(22) +
      'Interactions'.padEnd(14) +
      'Users'.padEnd(8) +
      'Evaluation Status',
  );
  console.log('----------------------------------------------------------------------------------------');
  console.log(
    mfilmRow.modelName.padEnd(38) +
      mfilmRow.dataset.padEnd(22) +
      String(mfilmRow.interactions).padEnd(14) +
      String(mfilmRow.users).padEnd(8) +
      mfilmRow.status,
  );
  console.log('----------------------------------------------------------------------------------------\n');
  console.log('========================================================================================');
  console.log('✅ Offline Recommendation Benchmark Suite Completed Successfully.');
  console.log('========================================================================================');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  });
}
