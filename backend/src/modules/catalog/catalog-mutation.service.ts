import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface MutationResult {
  success: boolean;
  firestore: 'committed' | 'failed';
  postgres: 'committed' | 'pending_reconciliation' | 'failed';
  mutationId: string;
  entityType: string;
  entityId: string;
  error?: string;
}

@Injectable()
export class CatalogMutationService {
  private readonly logger = new Logger(CatalogMutationService.name);
  private readonly catalogTopic: string;

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly kafka: KafkaService,
    private readonly config: ConfigService,
  ) {
    this.catalogTopic = this.config.get('kafka.topicCatalog') || 'mfilm.catalog.v1';
  }

  /**
   * Dual-write a movie mutation (INSERT, UPDATE, DELETE)
   */
  async mutateMovie(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    id: string,
    payload: any,
    customMutationId?: string,
  ): Promise<MutationResult> {
    return this.executeDualWrite('movies', id, operation, payload, customMutationId, async () => {
      if (operation === 'DELETE') {
        await this.db.query('DELETE FROM movies WHERE id = $1', [id]);
        return;
      }

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

      const values = [
        id,
        payload.name || payload.title || 'Untitled',
        payload.origin_name || payload.originalName || payload.otherName || '',
        payload.slug || id.toLowerCase(),
        payload.type || 'series',
        payload.status || 'ongoing',
        payload.thumb_url || payload.imageMovie || '',
        payload.poster_url || payload.poster || '',
        parseInt(payload.views || payload.view || '0', 10),
        parseFloat(payload.rating || payload.rate || '0.0'),
        parseInt(payload.rating_count || payload.rateCount || '0', 10),
        parseInt(payload.year || payload.releaseYear || new Date().getFullYear().toString(), 10),
        payload.duration || '',
        payload.quality || 'HD',
        payload.lang || 'Vietsub',
        Boolean(payload.is_cinema || payload.isCinema),
        Boolean(payload.is_vip || payload.isVIP),
      ];

      await this.db.query(query, values);
    });
  }

  /**
   * Dual-write an episode mutation
   */
  async mutateEpisode(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    id: string,
    payload: any,
    customMutationId?: string,
  ): Promise<MutationResult> {
    return this.executeDualWrite('episodes', id, operation, payload, customMutationId, async () => {
      if (operation === 'DELETE') {
        await this.db.query('DELETE FROM episodes WHERE id = $1', [id]);
        return;
      }

      // Verify parent movie exists in PostgreSQL to maintain referential integrity
      const parentCheck = await this.db.query('SELECT id FROM movies WHERE id = $1', [payload.movieId || payload.movie_id]);
      if (parentCheck.rows.length === 0) {
        throw new Error(`Referential integrity error: Parent movie [${payload.movieId || payload.movie_id}] does not exist in PostgreSQL.`);
      }

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

      const values = [
        id,
        payload.movieId || payload.movie_id,
        payload.name || payload.title || `Tập ${payload.numberEpisode || payload.number_episode || 1}`,
        payload.slug || `tap-${payload.numberEpisode || payload.number_episode || 1}`,
        parseInt(payload.numberEpisode || payload.number_episode || '1', 10),
        payload.link_embed || payload.linkEmbed || payload.videoUrl || '',
        payload.link_m3u8 || payload.linkM3u8 || '',
        payload.server_name || payload.serverName || 'Default Server',
        Boolean(payload.is_vip || payload.isVIP),
      ];

      await this.db.query(query, values);
    });
  }

  /**
   * Dual-write a category mutation
   */
  async mutateCategory(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    id: string,
    payload: any,
    customMutationId?: string,
  ): Promise<MutationResult> {
    return this.executeDualWrite('categories', id, operation, payload, customMutationId, async () => {
      if (operation === 'DELETE') {
        await this.db.query('DELETE FROM categories WHERE id = $1', [id]);
        return;
      }

      const query = `
        INSERT INTO categories (id, name, slug, description, type_id, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          type_id = EXCLUDED.type_id;
      `;

      await this.db.query(query, [
        id,
        payload.name,
        payload.slug || id.toLowerCase(),
        payload.description || '',
        payload.type_id || payload.typeId || null,
      ]);
    });
  }

  /**
   * Core Outbox Dual-Write Execution Pattern
   */
  private async executeDualWrite(
    entityType: string,
    entityId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: any,
    customMutationId: string | undefined,
    postgresAction: () => Promise<void>,
  ): Promise<MutationResult> {
    const mutationId = customMutationId || uuidv4();

    // 1. Idempotency Check: check if mutation already processed
    const existingJob = await this.db.query(
      'SELECT * FROM catalog_replication_jobs WHERE mutation_id = $1',
      [mutationId],
    );

    if (existingJob.rows.length > 0 && existingJob.rows[0].postgres_status === 'committed') {
      this.logger.log(`Idempotent return: mutation [${mutationId}] already committed.`);
      return {
        success: true,
        firestore: 'committed',
        postgres: 'committed',
        mutationId,
        entityType,
        entityId,
      };
    }

    // 2. Record initial Outbox job
    if (existingJob.rows.length === 0) {
      await this.db.query(
        `INSERT INTO catalog_replication_jobs (
          mutation_id, entity_type, entity_id, operation, firestore_status, postgres_status, payload
        ) VALUES ($1, $2, $3, $4, 'committed', 'pending_reconciliation', $5)`,
        [mutationId, entityType, entityId, operation, JSON.stringify(payload || {})],
      );
    }

    // 3. Replicate to PostgreSQL
    try {
      await postgresAction();

      // 4. Update job to committed
      await this.db.query(
        `UPDATE catalog_replication_jobs 
         SET postgres_status = 'committed', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE mutation_id = $1`,
        [mutationId],
      );

      // 5. Invalidate cache in Redis
      try {
        await this.redis.del(`catalog:${entityType}:*`);
      } catch {}

      // 6. Publish catalog change event to Kafka
      try {
        await this.kafka.produceEvent(this.catalogTopic, entityId, {
          mutationId,
          entityType,
          entityId,
          operation,
          occurredAt: new Date().toISOString(),
        });
      } catch (kErr: any) {
        this.logger.warn(`Kafka event publish notice: ${kErr.message}`);
      }

      return {
        success: true,
        firestore: 'committed',
        postgres: 'committed',
        mutationId,
        entityType,
        entityId,
      };
    } catch (err: any) {
      this.logger.error(`PostgreSQL replication failed for [${entityType}/${entityId}]: ${err.message}`);

      // Update replication job with failure details for reconciliation
      await this.db.query(
        `UPDATE catalog_replication_jobs 
         SET last_error = $1, retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP
         WHERE mutation_id = $2`,
        [err.message, mutationId],
      );

      return {
        success: true,
        firestore: 'committed',
        postgres: 'pending_reconciliation',
        mutationId,
        entityType,
        entityId,
        error: err.message,
      };
    }
  }
}
