/**
 * MFILM Catalog Outbox & Dual-Write Reconciliation Runner
 * Resolves pending or failed replication jobs between Firestore and PostgreSQL.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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
const firestore = getFirestore(app);

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

async function runReconciliation() {
  console.log('============================================================');
  console.log('       MFILM CATALOG RECONCILIATION & OUTBOX RUNNER');
  console.log('============================================================');

  const client = await pool.connect();

  try {
    const pendingQuery = `
      SELECT * FROM catalog_replication_jobs 
      WHERE postgres_status != 'committed' AND retry_count < 10 
      ORDER BY created_at ASC;
    `;
    const pendingRes = await client.query(pendingQuery);
    const jobs = pendingRes.rows;

    console.log(`[*] Found ${jobs.length} pending / unreconciled replication job(s).`);

    if (jobs.length === 0) {
      console.log('[+] All catalog replication jobs are in sync. Zero reconciliation required.');
      return;
    }

    let reconciledCount = 0;
    let failedCount = 0;

    for (const job of jobs) {
      console.log(`\n[-] Processing Job [${job.mutation_id}] — ${job.operation} on ${job.entity_type}:${job.entity_id}`);
      
      try {
        if (job.operation === 'DELETE') {
          await client.query(`DELETE FROM ${job.entity_type} WHERE id = $1`, [job.entity_id]);
        } else {
          // Fetch authoritative document from Firestore if possible, else fallback to payload
          let data = job.payload;
          const collectionName = job.entity_type === 'movies' ? 'Movies' : job.entity_type === 'episodes' ? 'Episodes' : 'Categories';
          try {
            const snap = await getDoc(doc(firestore, collectionName, job.entity_id));
            if (snap.exists()) {
              data = { id: snap.id, ...snap.data() };
            }
          } catch (e: any) {
            console.warn(`    Firestore fetch notice: ${e.message}, using cached outbox payload`);
          }

          if (job.entity_type === 'movies') {
            const query = `
              INSERT INTO movies (
                id, name, origin_name, slug, type, status, thumb_url, poster_url, 
                views, rating, rating_count, year, duration, quality, lang, is_cinema, is_vip, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, 
                $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP
              )
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                origin_name = EXCLUDED.origin_name,
                slug = EXCLUDED.slug,
                type = EXCLUDED.type,
                status = EXCLUDED.status,
                thumb_url = EXCLUDED.thumb_url,
                poster_url = EXCLUDED.poster_url,
                views = EXCLUDED.views,
                rating = EXCLUDED.rating,
                rating_count = EXCLUDED.rating_count,
                year = EXCLUDED.year,
                duration = EXCLUDED.duration,
                quality = EXCLUDED.quality,
                lang = EXCLUDED.lang,
                is_cinema = EXCLUDED.is_cinema,
                is_vip = EXCLUDED.is_vip,
                updated_at = CURRENT_TIMESTAMP;
            `;
            await client.query(query, [
              job.entity_id,
              data.name || data.title || 'Untitled',
              data.origin_name || data.originalName || data.otherName || '',
              data.slug || job.entity_id.toLowerCase(),
              data.type || 'series',
              data.status || 'ongoing',
              data.thumb_url || data.imageMovie || '',
              data.poster_url || data.poster || '',
              parseInt(data.views || data.view || '0', 10),
              parseFloat(data.rating || data.rate || '0.0'),
              parseInt(data.rating_count || data.rateCount || '0', 10),
              parseInt(data.year || data.releaseYear || new Date().getFullYear().toString(), 10),
              data.duration || '',
              data.quality || 'HD',
              data.lang || 'Vietsub',
              Boolean(data.is_cinema || data.isCinema),
              Boolean(data.is_vip || data.isVIP),
            ]);
          } else if (job.entity_type === 'episodes') {
            const query = `
              INSERT INTO episodes (
                id, movie_id, name, slug, number_episode, link_embed, link_m3u8, server_name, is_vip, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP
              )
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                slug = EXCLUDED.slug,
                number_episode = EXCLUDED.number_episode,
                link_embed = EXCLUDED.link_embed,
                link_m3u8 = EXCLUDED.link_m3u8,
                server_name = EXCLUDED.server_name,
                is_vip = EXCLUDED.is_vip,
                updated_at = CURRENT_TIMESTAMP;
            `;
            await client.query(query, [
              job.entity_id,
              data.movieId || data.movie_id,
              data.name || data.title || `Tập ${data.numberEpisode || 1}`,
              data.slug || `tap-${data.numberEpisode || 1}`,
              parseInt(data.numberEpisode || '1', 10),
              data.link_embed || data.linkEmbed || data.videoUrl || '',
              data.link_m3u8 || data.linkM3u8 || '',
              data.server_name || data.serverName || 'Default Server',
              Boolean(data.is_vip || data.isVIP),
            ]);
          }
        }

        // Mark as committed
        await client.query(
          `UPDATE catalog_replication_jobs 
           SET postgres_status = 'committed', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
           WHERE mutation_id = $1`,
          [job.mutation_id],
        );

        console.log(`    [+] Reconciled Job [${job.mutation_id}] -> committed`);
        reconciledCount++;
      } catch (err: any) {
        console.error(`    [!] Reconciliation error for Job [${job.mutation_id}]: ${err.message}`);
        await client.query(
          `UPDATE catalog_replication_jobs 
           SET last_error = $1, retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP 
           WHERE mutation_id = $2`,
          [err.message, job.mutation_id],
        );
        failedCount++;
      }
    }

    console.log('\n------------------------------------------------------------');
    console.log(`Reconciliation Complete: ${reconciledCount} resolved, ${failedCount} failed.`);
    console.log('============================================================');
  } finally {
    client.release();
    await pool.end();
  }
}

runReconciliation().catch((err) => {
  console.error('Fatal reconciliation failure:', err);
  process.exit(1);
});
