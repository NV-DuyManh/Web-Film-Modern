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
      }
);

interface ValidationReport {
  entity: string;
  records_compared: number;
  records_equal: number;
  records_mismatched: number;
  missing_in_postgres: number;
  missing_in_firestore: number;
  field_mismatch_count: number;
  consistency_percent: string;
}

const reports: ValidationReport[] = [];

async function shadowValidate() {
  console.log('='.repeat(70));
  console.log('MFILM SHADOW READ CONSISTENCY VALIDATION');
  console.log('Comparing Firestore (Source of Truth) vs PostgreSQL Replica');
  console.log('='.repeat(70));

  const client = await pool.connect();

  try {
    // 1. Categories Validation
    console.log('\n[1/3] Validating Categories consistency...');
    const catSnap = await getDocs(collection(db, 'Categories'));
    const firestoreCats = new Map<string, any>();
    catSnap.forEach((d) => firestoreCats.set(d.id, d.data()));

    const pgCatsRes = await client.query('SELECT id, name FROM categories');
    const pgCats = new Map<string, any>(pgCatsRes.rows.map((r) => [r.id, r]));

    let catEqual = 0;
    let catMismatched = 0;
    let catMissingInPg = 0;
    let catFieldMismatches = 0;

    for (const [id, fCat] of firestoreCats) {
      const pCat = pgCats.get(id);
      if (!pCat) {
        catMissingInPg++;
      } else {
        const nameMatch = (fCat.name || '').trim() === (pCat.name || '').trim();
        if (nameMatch) {
          catEqual++;
        } else {
          catMismatched++;
          catFieldMismatches++;
        }
      }
    }

    const catConsistency = firestoreCats.size > 0
      ? ((catEqual / firestoreCats.size) * 100).toFixed(1) + '%'
      : '100.0%';

    reports.push({
      entity: 'Categories',
      records_compared: firestoreCats.size,
      records_equal: catEqual,
      records_mismatched: catMismatched,
      missing_in_postgres: catMissingInPg,
      missing_in_firestore: Math.max(0, pgCats.size - firestoreCats.size),
      field_mismatch_count: catFieldMismatches,
      consistency_percent: catConsistency,
    });

    // 2. Movies Validation
    console.log('[2/3] Validating Movies consistency...');
    const movieSnap = await getDocs(collection(db, 'Movies'));
    const firestoreMovies = new Map<string, any>();
    movieSnap.forEach((d) => firestoreMovies.set(d.id, d.data()));

    const pgMoviesRes = await client.query('SELECT id, name, slug, views FROM movies');
    const pgMovies = new Map<string, any>(pgMoviesRes.rows.map((r) => [r.id, r]));

    let movieEqual = 0;
    let movieMismatched = 0;
    let movieMissingInPg = 0;
    let movieFieldMismatches = 0;

    for (const [id, fMovie] of firestoreMovies) {
      const pMovie = pgMovies.get(id);
      if (!pMovie) {
        movieMissingInPg++;
      } else {
        const nameMatch = (fMovie.name || '').trim() === (pMovie.name || '').trim();
        const slugMatch = (fMovie.slug || fMovie.id) === pMovie.slug;

        if (nameMatch && slugMatch) {
          movieEqual++;
        } else {
          movieMismatched++;
          if (!nameMatch) movieFieldMismatches++;
          if (!slugMatch) movieFieldMismatches++;
        }
      }
    }

    const movieConsistency = firestoreMovies.size > 0
      ? ((movieEqual / firestoreMovies.size) * 100).toFixed(1) + '%'
      : '100.0%';

    reports.push({
      entity: 'Movies',
      records_compared: firestoreMovies.size,
      records_equal: movieEqual,
      records_mismatched: movieMismatched,
      missing_in_postgres: movieMissingInPg,
      missing_in_firestore: Math.max(0, pgMovies.size - firestoreMovies.size),
      field_mismatch_count: movieFieldMismatches,
      consistency_percent: movieConsistency,
    });

    // 3. Episodes Validation
    console.log('[3/3] Validating Episodes consistency...');
    const epSnap = await getDocs(collection(db, 'Episodes'));
    const firestoreEpisodes = new Map<string, any>();
    epSnap.forEach((d) => firestoreEpisodes.set(d.id, d.data()));

    const pgEpisodesRes = await client.query('SELECT id, movie_id, number_episode, stream_url FROM episodes');
    const pgEpisodes = new Map<string, any>(pgEpisodesRes.rows.map((r) => [r.id, r]));

    let epEqual = 0;
    let epMismatched = 0;
    let epMissingInPg = 0;
    let epFieldMismatches = 0;

    for (const [id, fEp] of firestoreEpisodes) {
      const pEp = pgEpisodes.get(id);
      if (!pEp) {
        epMissingInPg++;
      } else {
        const movieMatch = String(fEp.movieID) === String(pEp.movie_id);
        const numMatch = Number(fEp.numberEpisode || 1) === Number(pEp.number_episode);

        if (movieMatch && numMatch) {
          epEqual++;
        } else {
          epMismatched++;
          if (!movieMatch) epFieldMismatches++;
          if (!numMatch) epFieldMismatches++;
        }
      }
    }

    const epConsistency = firestoreEpisodes.size > 0
      ? ((epEqual / firestoreEpisodes.size) * 100).toFixed(1) + '%'
      : '100.0%';

    reports.push({
      entity: 'Episodes',
      records_compared: firestoreEpisodes.size,
      records_equal: epEqual,
      records_mismatched: epMismatched,
      missing_in_postgres: epMissingInPg,
      missing_in_firestore: Math.max(0, pgEpisodes.size - firestoreEpisodes.size),
      field_mismatch_count: epFieldMismatches,
      consistency_percent: epConsistency,
    });

    console.log('\n' + '='.repeat(70));
    console.log('SHADOW READ CONSISTENCY RESULTS');
    console.log('='.repeat(70));
    console.table(reports);

    const totalCompared = reports.reduce((acc, r) => acc + r.records_compared, 0);
    const totalEqual = reports.reduce((acc, r) => acc + r.records_equal, 0);
    const overallPercent = totalCompared > 0 ? ((totalEqual / totalCompared) * 100).toFixed(1) : '100.0';

    console.log(`Overall Catalog Read Consistency: ${overallPercent}%`);
    console.log(`Shadow Validation Status: ${parseFloat(overallPercent) >= 95 ? 'PASS (READY FOR CUTOVER)' : 'ATTENTION (BACKFILL REQUIRED)'}`);
    console.log('='.repeat(70));

  } catch (err: any) {
    console.error('Shadow validation failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

shadowValidate();
