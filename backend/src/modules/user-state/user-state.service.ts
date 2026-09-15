import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserStateService {
  private readonly logger = new Logger(UserStateService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Ensure user stub exists in PostgreSQL to satisfy relational foreign keys
   */
  async ensureUserStub(userId: string, email?: string, name?: string) {
    await this.db.query(
      `INSERT INTO users (id, email, name, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, users.email),
         name = COALESCE(EXCLUDED.name, users.name);`,
      [userId, email || `${userId}@mfilm.internal`, name || 'MFILM User'],
    );
  }

  // --- Favorites ---

  async getFavorites(userId: string) {
    const query = `
      SELECT m.*, f.created_at as favorited_at
      FROM favorites f
      JOIN movies m ON f.movie_id = m.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC;
    `;
    const res = await this.db.query(query, [userId]);
    return res.rows;
  }

  async addFavorite(userId: string, movieId: string) {
    await this.ensureUserStub(userId);
    const query = `
      INSERT INTO favorites (user_id, movie_id, created_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, movie_id) DO NOTHING
      RETURNING *;
    `;
    const res = await this.db.query(query, [userId, movieId]);
    return { success: true, favorited: true, movieId };
  }

  async removeFavorite(userId: string, movieId: string) {
    await this.db.query(
      'DELETE FROM favorites WHERE user_id = $1 AND movie_id = $2;',
      [userId, movieId],
    );
    return { success: true, favorited: false, movieId };
  }

  // --- Watch History ---

  async getWatchHistory(userId: string) {
    const query = `
      SELECT wh.*, m.name as movie_name, m.thumb_url, m.slug as movie_slug,
             e.name as episode_name, e.number_episode
      FROM watch_histories wh
      JOIN movies m ON wh.movie_id = m.id
      LEFT JOIN episodes e ON wh.episode_id = e.id
      WHERE wh.user_id = $1
      ORDER BY wh.updated_at DESC;
    `;
    const res = await this.db.query(query, [userId]);
    return res.rows;
  }

  async updateWatchHistory(
    userId: string,
    movieId: string,
    episodeId: string | undefined,
    progressSeconds: number,
    durationSeconds: number,
  ) {
    await this.ensureUserStub(userId);
    const isCompleted = durationSeconds > 0 && progressSeconds >= durationSeconds * 0.9;

    const query = `
      INSERT INTO watch_histories (
        user_id, movie_id, episode_id, progress_seconds, duration_seconds, is_completed, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, movie_id, episode_id) DO UPDATE SET
        progress_seconds = EXCLUDED.progress_seconds,
        duration_seconds = EXCLUDED.duration_seconds,
        is_completed = EXCLUDED.is_completed,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const res = await this.db.query(query, [
      userId,
      movieId,
      episodeId || null,
      progressSeconds,
      durationSeconds,
      isCompleted,
    ]);
    return res.rows[0];
  }

  async clearWatchHistory(userId: string, movieId?: string) {
    if (movieId) {
      await this.db.query('DELETE FROM watch_histories WHERE user_id = $1 AND movie_id = $2;', [
        userId,
        movieId,
      ]);
    } else {
      await this.db.query('DELETE FROM watch_histories WHERE user_id = $1;', [userId]);
    }
    return { success: true };
  }

  // --- Playlists (Folders & Movie Saves) ---

  async getPlaylists(userId: string) {
    const query = `
      SELECT f.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'name', m.name,
              'slug', m.slug,
              'thumb_url', m.thumb_url,
              'added_at', ms.created_at
            )
          ) FILTER (WHERE m.id IS NOT NULL), '[]'
        ) as movies
      FROM folders f
      LEFT JOIN movie_saves ms ON f.id = ms.folder_id
      LEFT JOIN movies m ON ms.movie_id = m.id
      WHERE f.user_id = $1
      GROUP BY f.id
      ORDER BY f.created_at DESC;
    `;
    const res = await this.db.query(query, [userId]);
    return res.rows;
  }

  async createPlaylist(userId: string, name: string) {
    await this.ensureUserStub(userId);
    const res = await this.db.query(
      `INSERT INTO folders (user_id, name, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *;`,
      [userId, name],
    );
    return res.rows[0];
  }

  async addMovieToPlaylist(userId: string, playlistId: string, movieId: string) {
    // Verify ownership
    const ownerCheck = await this.db.query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2;',
      [playlistId, userId],
    );
    if (ownerCheck.rows.length === 0) {
      throw new NotFoundException('Playlist not found or access denied.');
    }

    await this.db.query(
      `INSERT INTO movie_saves (folder_id, movie_id, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (folder_id, movie_id) DO NOTHING;`,
      [playlistId, movieId],
    );
    return { success: true, playlistId, movieId };
  }

  async removeMovieFromPlaylist(userId: string, playlistId: string, movieId: string) {
    await this.db.query(
      `DELETE FROM movie_saves 
       WHERE folder_id = $1 AND movie_id = $2 
       AND folder_id IN (SELECT id FROM folders WHERE user_id = $3);`,
      [playlistId, movieId, userId],
    );
    return { success: true };
  }

  async deletePlaylist(userId: string, playlistId: string) {
    await this.db.query(
      'DELETE FROM folders WHERE id = $1 AND user_id = $2;',
      [playlistId, userId],
    );
    return { success: true };
  }

  // --- Preferences ---

  async getPreferences(userId: string) {
    const res = await this.db.query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1;',
      [userId],
    );
    return res.rows[0]?.preferences || {};
  }

  async updatePreferences(userId: string, preferences: Record<string, any>) {
    await this.ensureUserStub(userId);
    const res = await this.db.query(
      `INSERT INTO user_preferences (user_id, preferences, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         preferences = user_preferences.preferences || EXCLUDED.preferences,
         updated_at = CURRENT_TIMESTAMP
       RETURNING preferences;`,
      [userId, JSON.stringify(preferences)],
    );
    return res.rows[0]?.preferences;
  }
}
