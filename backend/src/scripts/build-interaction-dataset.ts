/**
 * MFILM Big Data Interaction Dataset Builder
 * Generates the user_movie_interactions fact table for Phase 04 recommendation modeling.
 * Combines behavioral playback telemetry, favorites, reviews, and watch progress.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 5,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        user: process.env.DB_USER || 'mfilm_user',
        password: process.env.DB_PASSWORD || 'mfilm_password',
        database: process.env.DB_NAME || 'mfilm_db',
        max: 5,
      },
);

async function buildInteractionDataset() {
  console.log('============================================================');
  console.log('    MFILM BIG DATA INTERACTION FACT DATASET GENERATOR');
  console.log('============================================================');
  console.log('Target Table : user_movie_interactions');
  console.log('Formula      : (views * 0.5) + (plays * 1.0) + (completes * 3.0) + (favorite * 4.0) + (norm_rating * 2.0)');
  console.log('PII Protection: Zero email/name/credential fields processed.\n');

  const client = await pool.connect();

  try {
    // 1. Fetch user favorites
    console.log('[1/4] Aggregating user favorites...');
    const favRes = await client.query('SELECT user_id, movie_id FROM favorites;');
    console.log(`[+] Found ${favRes.rows.length} favorite association(s).`);

    // 2. Fetch user watch history
    console.log('[2/4] Aggregating watch history and playback progression...');
    const whRes = await client.query(`
      SELECT user_id, movie_id, 
             SUM(progress_seconds) as total_watch_seconds,
             MAX(duration_seconds) as duration,
             BOOL_OR(is_completed) as completed
      FROM watch_histories
      GROUP BY user_id, movie_id;
    `);
    console.log(`[+] Found ${whRes.rows.length} watch history record(s).`);

    // 3. Fetch reviews
    console.log('[3/4] Aggregating user ratings and reviews...');
    const revRes = await client.query('SELECT user_id, movie_id, rate FROM reviews;');
    console.log(`[+] Found ${revRes.rows.length} user review(s).`);

    // Aggregate map: key = `${user_id}:${movie_id}`
    const map = new Map<string, {
      userId: string;
      movieId: string;
      views: number;
      plays: number;
      watchSeconds: number;
      completionRate: number;
      completeCount: number;
      favorite: boolean;
      rating: number | null;
    }>();

    const getOrInit = (userId: string, movieId: string) => {
      const key = `${userId}:${movieId}`;
      if (!map.has(key)) {
        map.set(key, {
          userId,
          movieId,
          views: 1, // Base implicit view
          plays: 0,
          watchSeconds: 0,
          completionRate: 0,
          completeCount: 0,
          favorite: false,
          rating: null,
        });
      }
      return map.get(key)!;
    };

    // Populate favorites
    for (const r of favRes.rows) {
      const item = getOrInit(r.user_id, r.movie_id);
      item.favorite = true;
    }

    // Populate watch history
    for (const r of whRes.rows) {
      const item = getOrInit(r.user_id, r.movie_id);
      item.plays += 1;
      item.watchSeconds += parseInt(r.total_watch_seconds || '0', 10);
      if (r.completed) item.completeCount += 1;
      const dur = parseInt(r.duration || '0', 10);
      if (dur > 0) {
        item.completionRate = Math.min(1.0, item.watchSeconds / dur);
      }
    }

    // Populate reviews
    for (const r of revRes.rows) {
      const item = getOrInit(r.user_id, r.movie_id);
      item.rating = parseFloat(r.rate);
    }

    console.log(`\n[4/4] Computing deterministic interaction scores and upserting into database...`);
    let upsertCount = 0;

    for (const item of map.values()) {
      // Deterministic Formula:
      // Score = (views * 0.5) + (plays * 1.0) + (completes * 3.0) + (favorite * 4.0) + (norm_rating * 2.0)
      const normRating = item.rating !== null ? item.rating / 2.0 : 0.0; // scale 0-10 to 0-5
      const favoriteWeight = item.favorite ? 4.0 : 0.0;
      const score = Number((
        (item.views * 0.5) +
        (item.plays * 1.0) +
        (item.completeCount * 3.0) +
        favoriteWeight +
        (normRating * 2.0)
      ).toFixed(2));

      const query = `
        INSERT INTO user_movie_interactions (
          user_id, movie_id, view_count, play_count, watch_seconds, completion_rate,
          complete_count, favorite, rating, last_interaction_at, interaction_score
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10
        )
        ON CONFLICT (user_id, movie_id) DO UPDATE SET
          view_count = EXCLUDED.view_count,
          play_count = EXCLUDED.play_count,
          watch_seconds = EXCLUDED.watch_seconds,
          completion_rate = EXCLUDED.completion_rate,
          complete_count = EXCLUDED.complete_count,
          favorite = EXCLUDED.favorite,
          rating = EXCLUDED.rating,
          last_interaction_at = CURRENT_TIMESTAMP,
          interaction_score = EXCLUDED.interaction_score;
      `;

      await client.query(query, [
        item.userId,
        item.movieId,
        item.views,
        item.plays,
        item.watchSeconds,
        item.completionRate,
        item.completeCount,
        item.favorite,
        item.rating,
        score,
      ]);
      upsertCount++;
    }

    console.log(`[+] Successfully populated ${upsertCount} interaction record(s).`);

    // Top interactions
    const topRes = await client.query(`
      SELECT umi.user_id, umi.movie_id, m.name, umi.interaction_score, umi.favorite
      FROM user_movie_interactions umi
      JOIN movies m ON umi.movie_id = m.id
      ORDER BY umi.interaction_score DESC
      LIMIT 5;
    `);

    console.log('\nTop 5 User-Movie Interaction Scores:');
    topRes.rows.forEach((r, idx) => {
      console.log(`  ${idx + 1}. Movie: "${r.name}" | Score: ${r.interaction_score} | Favorited: ${r.favorite}`);
    });

    console.log('\n============================================================');
    console.log('✅ Interaction Dataset Foundation Complete for Phase 04!');
    console.log('============================================================');
  } finally {
    client.release();
    await pool.end();
  }
}

buildInteractionDataset().catch((err) => {
  console.error('Fatal interaction dataset generation failure:', err);
  process.exit(1);
});
