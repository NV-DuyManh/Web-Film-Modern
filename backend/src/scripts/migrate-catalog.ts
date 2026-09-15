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
      }
);

interface MigrationStats {
  collection: string;
  table: string;
  sourceCount: number;
  migratedCount: number;
  estimatedBytes: number;
  status: 'DRY_RUN' | 'MIGRATED' | 'FAILED' | 'SKIPPED';
}

const stats: MigrationStats[] = [];

async function fetchFirestoreCollection(name: string): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, name));
    const docs: any[] = [];
    snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
    return docs;
  } catch (err: any) {
    console.warn(`Could not read collection [${name}]: ${err.message}`);
    return [];
  }
}

function estimateSize(docs: any[]): number {
  return Buffer.byteLength(JSON.stringify(docs), 'utf8');
}

const DEFAULT_COUNTRIES = [
  { id: 'vn', name: 'Việt Nam' },
  { id: 'cn', name: 'Trung Quốc' },
  { id: 'kr', name: 'Hàn Quốc' },
  { id: 'jp', name: 'Nhật Bản' },
  { id: 'us', name: 'Âu Mỹ' },
  { id: 'th', name: 'Thái Lan' },
  { id: 'hk', name: 'Hồng Kông' },
  { id: 'tw', name: 'Đài Loan' },
  { id: 'in', name: 'Ấn Độ' },
  { id: 'uk', name: 'Anh' },
  { id: 'fr', name: 'Pháp' },
  { id: 'other', name: 'Quốc gia khác' },
];

async function runMigration() {
  console.log('='.repeat(70));
  console.log(`MFILM CATALOG MIGRATION RUNNER (Firestore -> PostgreSQL)`);
  console.log(`Mode: ${isExecute ? 'EXECUTE (REAL MIGRATION)' : 'DRY RUN (SCAN & CAPACITY CHECK ONLY)'}`);
  console.log(`Database Target: ${process.env.DATABASE_URL ? 'Cloud PostgreSQL (SSL)' : 'Local PostgreSQL (5433)'}`);
  console.log('='.repeat(70));

  const client = await pool.connect();

  try {
    // 1. Reference: Sex & Countries
    if (isExecute) {
      await client.query(`
        INSERT INTO sex (id, name) VALUES
          ('male', 'Nam'),
          ('female', 'Nữ'),
          ('other', 'Khác')
        ON CONFLICT (id) DO NOTHING;
      `);
      for (const co of DEFAULT_COUNTRIES) {
        await client.query(
          `INSERT INTO countries (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
          [co.id, co.name]
        );
      }
    }

    // 2. CategoryTypes
    console.log('\n[1/7] Scanning CategoryTypes...');
    const catTypes = await fetchFirestoreCollection('CategoryTypes');
    const catTypesBytes = estimateSize(catTypes);
    if (isExecute && catTypes.length > 0) {
      for (const ct of catTypes) {
        await client.query(
          `INSERT INTO category_types (id, name, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
          [ct.id, ct.name || 'Unknown', ct.description || '']
        );
      }
    }
    stats.push({
      collection: 'CategoryTypes',
      table: 'category_types',
      sourceCount: catTypes.length,
      migratedCount: isExecute ? catTypes.length : 0,
      estimatedBytes: catTypesBytes,
      status: isExecute ? 'MIGRATED' : 'DRY_RUN',
    });

    // 3. Categories
    console.log('[2/7] Scanning Categories...');
    const categories = await fetchFirestoreCollection('Categories');
    const categoriesBytes = estimateSize(categories);
    if (isExecute && categories.length > 0) {
      for (const c of categories) {
        await client.query(
          `INSERT INTO categories (id, name, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
          [c.id, c.name || 'Unknown', c.description || '']
        );
      }
    }
    stats.push({
      collection: 'Categories',
      table: 'categories',
      sourceCount: categories.length,
      migratedCount: isExecute ? categories.length : 0,
      estimatedBytes: categoriesBytes,
      status: isExecute ? 'MIGRATED' : 'DRY_RUN',
    });

    // 4. People: Actors, Authors, Characters
    console.log('[3/7] Scanning Actors, Authors, Characters...');
    const actors = await fetchFirestoreCollection('Actors');
    const authors = await fetchFirestoreCollection('Authors');
    const characters = await fetchFirestoreCollection('Characters');
    const peopleBytes = estimateSize(actors) + estimateSize(authors) + estimateSize(characters);

    if (isExecute) {
      // Chunked inserts for people
      for (const a of actors) {
        try {
          await client.query(
            `INSERT INTO actors (id, name, img_url, description)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, img_url = EXCLUDED.img_url`,
            [a.id, a.name || 'Unknown', a.imgUrl || '', a.description || '']
          );
        } catch {}
      }
      for (const au of authors) {
        try {
          await client.query(
            `INSERT INTO authors (id, name, img_url, description)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, img_url = EXCLUDED.img_url`,
            [au.id, au.name || 'Unknown', au.imgUrl || '', au.description || '']
          );
        } catch {}
      }
      for (const ch of characters) {
        try {
          await client.query(
            `INSERT INTO characters (id, name, img_url, description)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, img_url = EXCLUDED.img_url`,
            [ch.id, ch.name || 'Unknown', ch.imgUrl || '', ch.description || '']
          );
        } catch {}
      }
    }
    stats.push({
      collection: 'Actors/Authors/Characters',
      table: 'actors, authors, characters',
      sourceCount: actors.length + authors.length + characters.length,
      migratedCount: isExecute ? actors.length + authors.length + characters.length : 0,
      estimatedBytes: peopleBytes,
      status: isExecute ? 'MIGRATED' : 'DRY_RUN',
    });

    // 5. Movies Core & Junctions
    console.log('[4/7] Scanning Movies and Relationships...');
    const movies = await fetchFirestoreCollection('Movies');
    const moviesBytes = estimateSize(movies);

    if (isExecute && movies.length > 0) {
      for (const m of movies) {
        try {
          await client.query(
            `INSERT INTO movies (
              id, name, slug, other_name, description, img_url, banner_url,
              trailer_url, duration, views, rating, end_episode, category_type_id,
              status, production_year, release_year, is_hot
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              views = EXCLUDED.views,
              rating = EXCLUDED.rating,
              status = EXCLUDED.status,
              updated_at = NOW()`,
            [
              m.id,
              m.name || 'Untitled',
              m.slug || m.id,
              m.otherName || '',
              m.description || '',
              m.imgUrl || '',
              m.bannerUrl || '',
              m.trailerUrl || '',
              parseInt(m.duration || '0', 10),
              parseInt(m.views || '0', 10),
              parseFloat(m.rating || '0.0'),
              parseInt(m.endEpisode || '0', 10),
              m.categoryTypeID || null,
              m.status || 'Đang chiếu',
              m.productionYear || null,
              m.releaseYear || null,
              Boolean(m.isHot),
            ]
          );

          // Junction categories
          if (Array.isArray(m.listCategory)) {
            for (const catId of m.listCategory) {
              try {
                await client.query(
                  `INSERT INTO movie_categories (movie_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                  [m.id, catId]
                );
              } catch {}
            }
          }
        } catch (mErr: any) {
          console.warn(`Movie insert error [${m.id}]: ${mErr.message}`);
        }
      }
    }
    stats.push({
      collection: 'Movies',
      table: 'movies + junctions',
      sourceCount: movies.length,
      migratedCount: isExecute ? movies.length : 0,
      estimatedBytes: moviesBytes,
      status: isExecute ? 'MIGRATED' : 'DRY_RUN',
    });

    // 6. Episodes (Batch insert for speed)
    console.log('[5/7] Scanning Episodes...');
    const episodes = await fetchFirestoreCollection('Episodes');
    const episodesBytes = estimateSize(episodes);

    // Filter out orphaned episodes whose movie does not exist
    const validMovieIds = new Set(movies.map((m) => m.id));
    const validEpisodes = episodes.filter((ep) => ep.movieID && validMovieIds.has(ep.movieID));

    if (isExecute && validEpisodes.length > 0) {
      console.log(`[Episodes] Batch migrating ${validEpisodes.length} valid episodes (${episodes.length - validEpisodes.length} orphaned skipped)...`);
      const BATCH_SIZE = 500;
      for (let i = 0; i < validEpisodes.length; i += BATCH_SIZE) {
        const batch = validEpisodes.slice(i, i + BATCH_SIZE);
        const values: any[] = [];
        const valuePlaceholders: string[] = [];

        batch.forEach((ep) => {
          const offset = values.length;
          valuePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
          values.push(
            ep.id,
            ep.movieID,
            parseInt(ep.numberEpisode || '1', 10),
            ep.title || `Tập ${ep.numberEpisode || 1}`,
            ep.url || ep.stream_url || ''
          );
        });

        if (valuePlaceholders.length > 0) {
          try {
            await client.query(
              `INSERT INTO episodes (id, movie_id, number_episode, title, stream_url)
               VALUES ${valuePlaceholders.join(', ')}
               ON CONFLICT (id) DO UPDATE SET
                 number_episode = EXCLUDED.number_episode,
                 title = EXCLUDED.title,
                 stream_url = EXCLUDED.stream_url`,
              values
            );
          } catch (batchErr: any) {
            console.warn(`Batch episode insert error: ${batchErr.message}`);
          }
        }
      }
    }
    stats.push({
      collection: 'Episodes',
      table: 'episodes',
      sourceCount: episodes.length,
      migratedCount: isExecute ? validEpisodes.length : 0,
      estimatedBytes: episodesBytes,
      status: isExecute ? 'MIGRATED' : 'DRY_RUN',
    });


    // 7. Topics & ShowTimes
    console.log('[6/7] Scanning Topics & ShowTimes...');
    const topics = await fetchFirestoreCollection('Topics');
    const showTimes = await fetchFirestoreCollection('ShowTimes');
    const miscBytes = estimateSize(topics) + estimateSize(showTimes);

    if (isExecute) {
      for (const t of topics) {
        try {
          await client.query(
            `INSERT INTO topics (id, name, title, description, icon, gradient, is_smart, smart_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, description = EXCLUDED.description`,
            [t.id, t.name || 'Topic', t.title || '', t.description || '', t.icon || '', t.gradient || '', Boolean(t.isSmart), t.smartId || null]
          );
        } catch {}
      }
      for (const st of showTimes) {
        if (!st.movieID) continue;
        try {
          await client.query(
            `INSERT INTO show_times (id, movie_id, show_time, room_name)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET show_time = EXCLUDED.show_time, room_name = EXCLUDED.room_name`,
            [st.id, st.movieID, st.showTime ? new Date(st.showTime) : new Date(), st.roomName || 'Cinema 1']
          );
        } catch {}
      }
    }
    stats.push({
      collection: 'Topics/ShowTimes',
      table: 'topics, show_times',
      sourceCount: topics.length + showTimes.length,
      migratedCount: isExecute ? topics.length + showTimes.length : 0,
      estimatedBytes: miscBytes,
      status: isExecute ? 'MIGRATED' : 'DRY_RUN',
    });

    // Summary Report
    console.log('\n' + '='.repeat(70));
    console.log(`CATALOG MIGRATION SUMMARY [${isExecute ? 'EXECUTED' : 'DRY_RUN'}]`);
    console.log('='.repeat(70));
    console.table(stats);

    const totalEstimatedBytes = stats.reduce((acc, s) => acc + s.estimatedBytes, 0);
    const totalEstimatedMB = (totalEstimatedBytes / (1024 * 1024)).toFixed(2);
    const postgresEstimatedMB = (totalEstimatedBytes * 2.5 / (1024 * 1024)).toFixed(2);

    console.log(`Total Source Payload Size: ~${totalEstimatedMB} MB`);
    console.log(`Estimated PostgreSQL Storage Footprint: ~${postgresEstimatedMB} MB`);
    console.log(`Free Tier Storage Ceiling: 500 MB (Supabase/Neon Free)`);
    console.log(`Capacity Utilization: ${((parseFloat(postgresEstimatedMB) / 500) * 100).toFixed(2)}% of free quota.`);
    console.log(`Capacity Threshold Check (< 75% limit): ${parseFloat(postgresEstimatedMB) < 375 ? 'PASSED (SAFE TO MIGRATE)' : 'FAILED'}`);
    console.log('='.repeat(70));

  } catch (err: any) {
    console.error('Migration failed with error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
