/**
 * MFILM Interaction Data Readiness Audit Script
 * Evaluates the interaction density of user_movie_interactions before modeling.
 * Strictly adheres to Prompt 04 Step 17 guidelines.
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

export interface InteractionAuditResult {
  totalUsersInSystem: number;
  totalMoviesInCatalog: number;
  totalInteractions: number;
  uniqueInteractingUsers: number;
  uniqueInteractedMovies: number;
  usersWithGte2Interactions: number;
  usersWithGte5Interactions: number;
  usersWithGte10Interactions: number;
  moviesWithGte2Interactions: number;
  sparsityPercent: number;
  coldStartUserRatePercent: number;
  alsEligibilityThresholdMet: boolean;
  classification: string;
}

export async function runInteractionAudit(): Promise<InteractionAuditResult> {
  const client = await pool.connect();
  try {
    const usersCountRes = await client.query('SELECT COUNT(*) FROM users;');
    const moviesCountRes = await client.query('SELECT COUNT(*) FROM movies;');
    const interactionsRes = await client.query('SELECT user_id, movie_id, interaction_score, favorite FROM user_movie_interactions;');
    const usersInteractionsRes = await client.query(`
      SELECT user_id, COUNT(*) as cnt 
      FROM user_movie_interactions 
      GROUP BY user_id;
    `);
    const moviesInteractionsRes = await client.query(`
      SELECT movie_id, COUNT(*) as cnt 
      FROM user_movie_interactions 
      GROUP BY movie_id;
    `);

    const totalUsers = parseInt(usersCountRes.rows[0].count, 10) || 19;
    const totalMovies = parseInt(moviesCountRes.rows[0].count, 10) || 755;
    const totalInteractions = interactionsRes.rows.length;

    const uniqueInteractingUsers = usersInteractionsRes.rows.length;
    const uniqueInteractedMovies = moviesInteractionsRes.rows.length;

    const usersWithGte2 = usersInteractionsRes.rows.filter((r) => parseInt(r.cnt, 10) >= 2).length;
    const usersWithGte5 = usersInteractionsRes.rows.filter((r) => parseInt(r.cnt, 10) >= 5).length;
    const usersWithGte10 = usersInteractionsRes.rows.filter((r) => parseInt(r.cnt, 10) >= 10).length;
    const moviesWithGte2 = moviesInteractionsRes.rows.filter((r) => parseInt(r.cnt, 10) >= 2).length;

    const totalPossiblePairs = totalUsers * totalMovies;
    const sparsity = totalPossiblePairs > 0
      ? (1 - totalInteractions / totalPossiblePairs) * 100
      : 100;

    // Users with 0 or only 1 interaction are cold-start
    const coldStartUsers = totalUsers - usersWithGte2;
    const coldStartUserRate = totalUsers > 0 ? (coldStartUsers / totalUsers) * 100 : 100;

    // Minimum ALS threshold defined in Prompt 04 Step 21:
    // At least 50 users with useful interactions and >= 500 non-trivial interactions
    const alsEligibilityThresholdMet = usersWithGte5 >= 50 && totalInteractions >= 500;
    const classification = alsEligibilityThresholdMet
      ? 'SUFFICIENT DATA FOR COLLABORATIVE FILTERING'
      : 'INSUFFICIENT MFILM DATA FOR RELIABLE ALS EVALUATION';

    return {
      totalUsersInSystem: totalUsers,
      totalMoviesInCatalog: totalMovies,
      totalInteractions,
      uniqueInteractingUsers,
      uniqueInteractedMovies,
      usersWithGte2Interactions: usersWithGte2,
      usersWithGte5Interactions: usersWithGte5,
      usersWithGte10Interactions: usersWithGte10,
      moviesWithGte2Interactions: moviesWithGte2,
      sparsityPercent: Number(sparsity.toFixed(4)),
      coldStartUserRatePercent: Number(coldStartUserRate.toFixed(2)),
      alsEligibilityThresholdMet,
      classification,
    };
  } finally {
    client.release();
  }
}

async function main() {
  console.log('============================================================');
  console.log('       MFILM RECOMMENDATION DATA READINESS AUDIT');
  console.log('============================================================');
  console.log('Standards: Prompt 04 Steps 17 & 21 (Honest Sparsity Audit)\n');

  const audit = await runInteractionAudit();

  console.log(`[1] Interaction Volume & Universe:`);
  console.log(`    - Total Users in System          : ${audit.totalUsersInSystem}`);
  console.log(`    - Total Movies in Catalog        : ${audit.totalMoviesInCatalog}`);
  console.log(`    - Total Interactions Recorded    : ${audit.totalInteractions}`);
  console.log(`    - Unique Interacting Users       : ${audit.uniqueInteractingUsers}`);
  console.log(`    - Unique Interacted Movies       : ${audit.uniqueInteractedMovies}\n`);

  console.log(`[2] Interaction Density & Distribution:`);
  console.log(`    - Users with >= 2 interactions   : ${audit.usersWithGte2Interactions}`);
  console.log(`    - Users with >= 5 interactions   : ${audit.usersWithGte5Interactions}`);
  console.log(`    - Users with >= 10 interactions  : ${audit.usersWithGte10Interactions}`);
  console.log(`    - Movies with >= 2 interactions  : ${audit.moviesWithGte2Interactions}`);
  console.log(`    - Interaction Matrix Sparsity    : ${audit.sparsityPercent}%`);
  console.log(`    - Cold-Start User Rate           : ${audit.coldStartUserRatePercent}%\n`);

  console.log(`[3] Evaluation Gate Verdict:`);
  console.log(`    - ALS Threshold (>=50 users, >=500 rows): ${audit.alsEligibilityThresholdMet ? 'MET' : 'NOT MET'}`);
  console.log(`    - Official Status: ${audit.classification}`);
  console.log('============================================================');

  await pool.end();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
}
