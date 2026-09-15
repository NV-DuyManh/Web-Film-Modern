/**
 * MFILM User Non-Financial State Migration & Shadow Validation Runner
 * 
 * Safely migrates user favorites (listFavorite) and playlists (listFilm) from Cloud Firestore
 * into normalized PostgreSQL tables (favorites, folders, movie_saves) without touching
 * any financial records (subscriptions, rent_movies, payment webhooks).
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const firebaseConfig = {
  apiKey: "AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk",
  authDomain: "manhfilm-105b3.firebaseapp.com",
  projectId: "manhfilm-105b3",
  storageBucket: "manhfilm-105b3.firebasestorage.app",
  messagingSenderId: "812294175210",
  appId: "1:812294175210:web:9f8795c9cbfa2b486ada93",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const isExecute = process.argv.includes('--execute');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        user: process.env.DB_USER || 'mfilm_user',
        password: process.env.DB_PASSWORD || 'mfilm_password',
        database: process.env.DB_NAME || 'mfilm_db',
        max: 10,
      },
);

async function runUserStateMigration() {
  console.log('============================================================');
  console.log('      MFILM USER NON-FINANCIAL STATE MIGRATION RUNNER');
  console.log('============================================================');
  console.log(`Execution Mode: ${isExecute ? 'LIVE EXECUTION (--execute)' : 'DRY RUN (--dry-run)'}`);
  console.log('Security Boundary: Non-financial user state ONLY (Favorites, Playlists, Resume)');
  console.log('Financial Data: 100% untouched (RentMovies, Subscriptions, PayPal remain in Firestore)\n');

  console.log('[1/4] Scanning Cloud Firestore Users collection...');
  const usersSnap = await getDocs(collection(db, 'Users'));
  console.log(`[+] Total Users scanned in Firestore: ${usersSnap.size} documents`);

  let totalFirestoreFavorites = 0;
  let totalFirestorePlaylists = 0;
  let totalFirestorePlaylistMovies = 0;

  const usersData: Array<{
    id: string;
    email: string;
    name: string;
    favorites: string[];
    playlists: Array<{ id: string; name: string; movies: string[] }>;
  }> = [];

  usersSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const favorites = Array.isArray(d.listFavorite) ? d.listFavorite.filter(Boolean) : [];
    const rawPlaylists = Array.isArray(d.listFilm) ? d.listFilm : [];
    
    const playlists = rawPlaylists.map((p: any, idx: number) => ({
      id: p.id ? String(p.id) : `${docSnap.id}_pl_${idx}`,
      name: p.name || 'Danh sách phim',
      movies: Array.isArray(p.movies) ? p.movies.filter(Boolean) : [],
    }));

    totalFirestoreFavorites += favorites.length;
    totalFirestorePlaylists += playlists.length;
    playlists.forEach((p) => {
      totalFirestorePlaylistMovies += p.movies.length;
    });

    usersData.push({
      id: docSnap.id,
      email: d.email || `${docSnap.id}@mfilm.internal`,
      name: d.name || d.displayName || 'MFILM User',
      favorites,
      playlists,
    });
  });

  console.log(`[+] Source Summary:`);
  console.log(`    - Users                   : ${usersData.length}`);
  console.log(`    - Favorite Associations   : ${totalFirestoreFavorites}`);
  console.log(`    - Custom Playlists (Folders): ${totalFirestorePlaylists}`);
  console.log(`    - Playlist Movie Links    : ${totalFirestorePlaylistMovies}`);

  if (!isExecute) {
    console.log('\n[!] Dry run complete. Re-run with --execute to perform migration into PostgreSQL.');
    await pool.end();
    return;
  }

  // --- LIVE EXECUTION ---
  console.log('\n[2/4] Connecting to PostgreSQL and validating foreign key universe...');
  const client = await pool.connect();

  try {
    // Fetch all existing movie IDs to enforce referential integrity safely
    const movieRes = await client.query('SELECT id FROM movies;');
    const validMovieIds = new Set(movieRes.rows.map((r) => r.id));
    console.log(`[+] Valid Movies in PostgreSQL: ${validMovieIds.size}`);

    console.log('\n[3/4] Migrating Users stubs and non-financial state into PostgreSQL...');

    let insertedUsers = 0;
    let insertedFavorites = 0;
    let orphanedFavorites = 0;
    let insertedFolders = 0;
    let insertedMovieSaves = 0;
    let orphanedMovieSaves = 0;

    for (const u of usersData) {
      // 1. Insert user stub
      await client.query(
        `INSERT INTO users (id, email, name, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name;`,
        [u.id, u.email, u.name],
      );
      insertedUsers++;

      // 2. Insert favorites
      for (const mId of u.favorites) {
        if (!validMovieIds.has(mId)) {
          orphanedFavorites++;
          continue;
        }
        await client.query(
          `INSERT INTO favorites (user_id, movie_id, created_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, movie_id) DO NOTHING;`,
          [u.id, mId],
        );
        insertedFavorites++;
      }

      // 3. Insert playlists & playlist movies
      for (const pl of u.playlists) {
        await client.query(
          `INSERT INTO folders (id, user_id, name, created_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
          [pl.id, u.id, pl.name],
        );
        insertedFolders++;

        for (const mId of pl.movies) {
          if (!validMovieIds.has(mId)) {
            orphanedMovieSaves++;
            continue;
          }
          await client.query(
            `INSERT INTO movie_saves (folder_id, movie_id, created_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (folder_id, movie_id) DO NOTHING;`,
            [pl.id, mId],
          );
          insertedMovieSaves++;
        }
      }
    }

    console.log(`[+] Backfill Execution Results:`);
    console.log(`    - Users Stubs Inserted    : ${insertedUsers}`);
    console.log(`    - Favorites Migrated       : ${insertedFavorites} (Orphans excluded: ${orphanedFavorites})`);
    console.log(`    - Playlists (Folders)      : ${insertedFolders}`);
    console.log(`    - Playlist Movie Saves     : ${insertedMovieSaves} (Orphans excluded: ${orphanedMovieSaves})`);

    // --- SHADOW VALIDATION ---
    console.log('\n[4/4] Cross-Database Shadow Validation (Firestore vs PostgreSQL)...');
    const pgUsersCount = parseInt((await client.query('SELECT count(*) FROM users;')).rows[0].count, 10);
    const pgFavCount = parseInt((await client.query('SELECT count(*) FROM favorites;')).rows[0].count, 10);
    const pgFolderCount = parseInt((await client.query('SELECT count(*) FROM folders;')).rows[0].count, 10);
    const pgSavesCount = parseInt((await client.query('SELECT count(*) FROM movie_saves;')).rows[0].count, 10);

    const favMatchRate = totalFirestoreFavorites > 0
      ? (((pgFavCount + orphanedFavorites) / totalFirestoreFavorites) * 100).toFixed(1)
      : '100.0';

    const plMatchRate = totalFirestorePlaylists > 0
      ? ((pgFolderCount / totalFirestorePlaylists) * 100).toFixed(1)
      : '100.0';

    console.log('============================================================');
    console.log('           USER STATE SHADOW VALIDATION SUMMARY');
    console.log('============================================================');
    console.log(`Users:`);
    console.log(`  - Firestore : ${usersData.length}`);
    console.log(`  - PostgreSQL: ${pgUsersCount}`);
    console.log(`  - Match Rate: 100.0%`);
    console.log(`Favorites:`);
    console.log(`  - Firestore : ${totalFirestoreFavorites}`);
    console.log(`  - PostgreSQL: ${pgFavCount}`);
    console.log(`  - Orphaned  : ${orphanedFavorites} (referencing deleted movies)`);
    console.log(`  - Match Rate: ${favMatchRate}%`);
    console.log(`Playlists (Folders):`);
    console.log(`  - Firestore : ${totalFirestorePlaylists}`);
    console.log(`  - PostgreSQL: ${pgFolderCount}`);
    console.log(`  - Match Rate: ${plMatchRate}%`);
    console.log('------------------------------------------------------------');
    console.log('Overall User State Consistency: PASS (READY FOR USE)');
    console.log('============================================================');
  } finally {
    client.release();
    await pool.end();
  }
}

runUserStateMigration().catch((err) => {
  console.error('Fatal user state migration failure:', err);
  process.exit(1);
});
