import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Fetch paginated movies with category & country information
   */
  async getMovies(page = 1, limit = 20, categoryId?: string, countryId?: string) {
    const offset = (page - 1) * limit;
    const cacheKey = `catalog:movies:p${page}:l${limit}:c${categoryId || 'all'}:ct${countryId || 'all'}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }

    let query = `
      SELECT m.*, 
        COALESCE(json_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '[]') as categories,
        ct.name as country_name
      FROM movies m
      LEFT JOIN movie_categories mc ON m.id = mc.movie_id
      LEFT JOIN categories c ON mc.category_id = c.id
      LEFT JOIN countries ct ON m.country_id = ct.id
    `;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (categoryId) {
      params.push(categoryId);
      whereClauses.push(`mc.category_id = $${params.length}`);
    }

    if (countryId) {
      params.push(countryId);
      whereClauses.push(`m.country_id = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` GROUP BY m.id, ct.name ORDER BY m.views DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    const countResult = await this.db.query('SELECT COUNT(*) FROM movies');
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    const response = {
      data: result.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 3 minutes
    await this.redis.set(cacheKey, JSON.stringify(response), 180);
    return response;
  }

  /**
   * Fetch movie by ID
   */
  async getMovieById(id: string) {
    const query = `
      SELECT m.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name)) FILTER (WHERE c.id IS NOT NULL), '[]') as categories,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', a.id, 'name', a.name)) FILTER (WHERE a.id IS NOT NULL), '[]') as actors,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', au.id, 'name', au.name)) FILTER (WHERE au.id IS NOT NULL), '[]') as authors,
        ct.name as country_name
      FROM movies m
      LEFT JOIN movie_categories mc ON m.id = mc.movie_id
      LEFT JOIN categories c ON mc.category_id = c.id
      LEFT JOIN movie_actors ma ON m.id = ma.movie_id
      LEFT JOIN actors a ON ma.actor_id = a.id
      LEFT JOIN movie_authors mau ON m.id = mau.movie_id
      LEFT JOIN authors au ON mau.author_id = au.id
      LEFT JOIN countries ct ON m.country_id = ct.id
      WHERE m.id = $1
      GROUP BY m.id, ct.name
    `;
    const result = await this.db.query(query, [id]);
    if (result.rows.length === 0) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return result.rows[0];
  }

  /**
   * Fetch movie by slug
   */
  async getMovieBySlug(slug: string) {
    const query = `
      SELECT m.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name)) FILTER (WHERE c.id IS NOT NULL), '[]') as categories,
        ct.name as country_name
      FROM movies m
      LEFT JOIN movie_categories mc ON m.id = mc.movie_id
      LEFT JOIN categories c ON mc.category_id = c.id
      LEFT JOIN countries ct ON m.country_id = ct.id
      WHERE m.slug = $1 OR m.id = $1
      GROUP BY m.id, ct.name
      LIMIT 1
    `;
    const result = await this.db.query(query, [slug]);
    if (result.rows.length === 0) {
      throw new NotFoundException(`Movie with slug "${slug}" not found`);
    }
    return result.rows[0];
  }

  /**
   * Fetch episodes for a movie, ordered by episode number
   */
  async getEpisodesByMovieId(movieId: string) {
    const query = `
      SELECT * FROM episodes
      WHERE movie_id = $1
      ORDER BY number_episode ASC
    `;
    const result = await this.db.query(query, [movieId]);
    return result.rows;
  }

  /**
   * Fetch all categories
   */
  async getCategories() {
    const cached = await this.redis.get('catalog:categories');
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }

    const result = await this.db.query('SELECT * FROM categories ORDER BY name ASC');
    await this.redis.set('catalog:categories', JSON.stringify(result.rows), 300);
    return result.rows;
  }

  /**
   * Fetch all topics
   */
  async getTopics() {
    const cached = await this.redis.get('catalog:topics');
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }

    const result = await this.db.query('SELECT * FROM topics ORDER BY name ASC');
    await this.redis.set('catalog:topics', JSON.stringify(result.rows), 300);
    return result.rows;
  }

  /**
   * Dual-write mutation: update movie in PostgreSQL and record replication status
   */
  async replicateMovieMutation(movieData: any) {
    const query = `
      INSERT INTO movies (
        id, name, slug, other_name, description, img_url, banner_url,
        trailer_url, duration, views, rating, end_episode, status,
        production_year, release_year, is_hot, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        other_name = EXCLUDED.other_name,
        description = EXCLUDED.description,
        img_url = EXCLUDED.img_url,
        banner_url = EXCLUDED.banner_url,
        views = EXCLUDED.views,
        rating = EXCLUDED.rating,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id;
    `;

    try {
      const res = await this.db.query(query, [
        movieData.id,
        movieData.name || 'Untitled',
        movieData.slug || movieData.id,
        movieData.otherName || '',
        movieData.description || '',
        movieData.imgUrl || '',
        movieData.bannerUrl || '',
        movieData.trailerUrl || '',
        parseInt(movieData.duration || '0', 10),
        parseInt(movieData.views || '0', 10),
        parseFloat(movieData.rating || '0.0'),
        parseInt(movieData.endEpisode || '0', 10),
        movieData.status || 'Đang chiếu',
        movieData.productionYear || null,
        movieData.releaseYear || null,
        Boolean(movieData.isHot),
      ]);
      this.logger.log(`[Replication] Movie [${movieData.id}] synchronized to PostgreSQL.`);
      return { success: true, id: res.rows[0].id };
    } catch (err: any) {
      this.logger.error(`[Replication Error] Failed to replicate movie [${movieData.id}]: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
