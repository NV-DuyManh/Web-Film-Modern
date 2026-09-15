/**
 * MFILM Streaming Event Telemetry Client (Hardened & Quota-Safe)
 * Asynchronously captures client-side events and ships to NestJS Event Collector.
 * Adheres to $0 free-tier budget guards: non-blocking, throttled, and sanitized.
 */

const API_BASE_URL =
  import.meta.env?.VITE_EVENT_API_BASE_URL || 'http://localhost:4000/api/v1';

const COLLECTOR_URL = `${API_BASE_URL.replace(/\/+$/, '')}/events`;

const TELEMETRY_ENABLED =
  import.meta.env?.VITE_BIGDATA_TELEMETRY_ENABLED !== 'false';

const ALLOWED_EVENT_TYPES = new Set([
  'movie_view',
  'episode_view',
  'play',
  'pause',
  'seek',
  'watch_progress',
  'complete',
  'buffer_start',
  'buffer_end',
  'search',
  'favorite',
  'unfavorite',
  'rating',
  'comment',
  'recommendation_view',
  'recommendation_click'
]);

// Throttle tracking map to protect Aiven Kafka free limits (250 KiB/s)
const progressThrottleMap = new Map();
const movieViewThrottleMap = new Map();
const THROTTLE_INTERVAL_MS = 9000; // Max 1 watch_progress event per 9s per episode
const MOVIE_VIEW_THROTTLE_MS = 2000; // Max 1 movie_view event per 2s per movie

function getSessionId() {
  try {
    let sess = sessionStorage.getItem('mfilm_session_id');
    if (!sess) {
      sess = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('mfilm_session_id', sess);
    }
    return sess;
  } catch {
    return 'sess_anon_' + Date.now();
  }
}

function getUserId() {
  try {
    const userStr = localStorage.getItem('isLogin');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Only extract public user identifier, never tokens or secrets
      return user.id || user.uid || 'anonymous';
    }
  } catch {
    // fallback
  }
  return 'anonymous';
}

function getAnonymousId() {
  try {
    let aid = localStorage.getItem('mfilm_anonymous_id');
    if (!aid) {
      aid = 'anon_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem('mfilm_anonymous_id', aid);
    }
    return aid;
  } catch {
    return 'anon_fallback';
  }
}

function getDeviceType() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Sanitizes metadata to ensure no sensitive PII, tokens, or passwords can ever leak.
 */
function sanitizeMetadata(metadata = {}) {
  const sanitized = { ...metadata };
  const blockedKeys = ['password', 'token', 'accessToken', 'refreshToken', 'card', 'secret', 'email'];
  for (const key of Object.keys(sanitized)) {
    if (blockedKeys.some((b) => key.toLowerCase().includes(b))) {
      delete sanitized[key];
    }
  }
  return sanitized;
}

/**
 * Resolves a stable string identifier for a movie from various possible inputs.
 */
function resolveId(input, idFields = ['movieId', 'episodeId', 'id', '_id', 'slug']) {
  if (input === null || input === undefined) return '';
  if (typeof input === 'string') return input.trim();
  if (typeof input === 'number') return String(input);
  if (typeof input === 'object') {
    for (const field of idFields) {
      if (input[field] && (typeof input[field] === 'string' || typeof input[field] === 'number')) {
        return String(input[field]).trim();
      }
    }
  }
  return '';
}

/**
 * Core dispatch function
 */
export async function trackEvent(eventType, movieId = '', episodeId = '', metadata = {}, isExitEvent = false) {
  if (!TELEMETRY_ENABLED) return;
  if (!ALLOWED_EVENT_TYPES.has(eventType)) return;

  // Throttling guard for high-frequency watch_progress
  if (eventType === 'watch_progress') {
    const key = `${movieId}_${episodeId}`;
    const now = Date.now();
    const lastSent = progressThrottleMap.get(key) || 0;
    if (now - lastSent < THROTTLE_INTERVAL_MS) {
      return; // Skip throttled progress event
    }
    progressThrottleMap.set(key, now);
  }

  // Duplicate guard for movie_view (React Strict Mode double-firing)
  if (eventType === 'movie_view') {
    const key = movieId;
    const now = Date.now();
    const lastSent = movieViewThrottleMap.get(key) || 0;
    if (now - lastSent < MOVIE_VIEW_THROTTLE_MS) {
      return; // Skip duplicate movie_view
    }
    movieViewThrottleMap.set(key, now);
  }

  const finalMovieId = resolveId(movieId, ['movieId', 'id', '_id', 'slug']) || 'none';
  const finalEpisodeId = resolveId(episodeId, ['episodeId', 'id', '_id', 'slug']);

  const userId = getUserId();
  const payload = {
    eventType,
    eventVersion: '1',
    occurredAt: new Date().toISOString(),
    userId: userId !== 'anonymous' ? userId : undefined,
    anonymousId: userId === 'anonymous' ? getAnonymousId() : undefined,
    sessionId: getSessionId(),
    movieId: finalMovieId,
    episodeId: finalEpisodeId,
    deviceType: getDeviceType(),
    platform: 'web',
    metadata: sanitizeMetadata(metadata),
  };

  const payloadStr = JSON.stringify(payload);

  // Use navigator.sendBeacon for page unload/exit if supported
  if (isExitEvent && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([payloadStr], { type: 'application/json' });
      const sent = navigator.sendBeacon(COLLECTOR_URL, blob);
      if (sent) return;
    } catch {
      // fallback to fetch
    }
  }

  // Standard non-blocking fetch with 3-second timeout
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;

    fetch(COLLECTOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payloadStr,
      keepalive: true,
      signal: controller ? controller.signal : undefined,
    })
      .then(() => {
        if (timeoutId) clearTimeout(timeoutId);
      })
      .catch(() => {
        // Non-blocking catch to ensure player and UI are never impacted
      });
  } catch {
    // Silently ignore network failures on client
  }
}

// Convenience event helpers for allowed Phase 01.5 telemetry
export const eventTracker = {
  movieView: (movieId, metadata = {}) =>
    trackEvent('movie_view', movieId, '', metadata),

  play: (movieId, episodeId = '', currentTime = 0) =>
    trackEvent('play', movieId, episodeId, { currentTime }),

  pause: (movieId, episodeId = '', currentTime = 0) =>
    trackEvent('pause', movieId, episodeId, { currentTime }),

  seek: (movieId, episodeId = '', fromTime = 0, toTime = 0) =>
    trackEvent('seek', movieId, episodeId, { fromTime, toTime }),

  watchProgress: (movieId, episodeId = '', progress = 0, duration = 0) =>
    trackEvent('watch_progress', movieId, episodeId, {
      progress: Math.floor(progress),
      duration: Math.floor(duration),
      percent: duration > 0 ? Number(((progress / duration) * 100).toFixed(1)) : 0,
    }),

  complete: (movieId, episodeId = '', duration = 0) =>
    trackEvent('complete', movieId, episodeId, { duration: Math.floor(duration) }, true),

  bufferStart: (movieId, episodeId = '', currentTime = 0) =>
    trackEvent('buffer_start', movieId, episodeId, { currentTime }),

  bufferEnd: (movieId, episodeId = '', bufferDurationMs = 0) =>
    trackEvent('buffer_end', movieId, episodeId, { bufferDurationMs }),
};

export default eventTracker;
