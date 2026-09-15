import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    normal_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10s',
      exec: 'normalLoadTest',
    },
    abusive_burst: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 200,
      maxDuration: '2s',
      startTime: '11s',
      exec: 'abusiveBurstTest',
    },
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:4000/api/v1';

export function normalLoadTest() {
  const batchPayload = JSON.stringify({
    events: [
      {
        eventId: `norm_ev_${__VU}_${__ITER}_1`,
        eventType: 'watch_progress',
        movieId: 'that-nghiep-chuyen-sinh',
        userId: `user_test_${__VU}`,
        sessionId: `sess_${__VU}`,
        occurredAt: new Date().toISOString(),
        metadata: { progressSeconds: 120, durationSeconds: 1440 },
      },
      {
        eventId: `norm_ev_${__VU}_${__ITER}_2`,
        eventType: 'buffer_start',
        movieId: 'that-nghiep-chuyen-sinh',
        userId: `user_test_${__VU}`,
        sessionId: `sess_${__VU}`,
        occurredAt: new Date().toISOString(),
        metadata: { bufferDurationMs: 120 },
      },
    ],
  });

  const res = http.post(`${BASE_URL}/events/batch`, batchPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'normal load accepted (202)': (r) => r.status === 202,
    'not throttled (< 429)': (r) => r.status !== 429,
  });

  sleep(0.4); // Paced telemetry interval: ~2.5 batches/s per VU (10 VUs = ~25 batches/s)
}

export function abusiveBurstTest() {
  // Rapid unpaced burst to single event endpoint to trigger rate limiter
  const payload = JSON.stringify({
    eventId: `burst_ev_${__ITER}`,
    eventType: 'movie_view',
    movieId: 'that-nghiep-chuyen-sinh',
    userId: 'burst_attacker',
    sessionId: 'burst_sess',
    occurredAt: new Date().toISOString(),
    metadata: { burst: true },
  });

  const res = http.post(`${BASE_URL}/events`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'processed or throttled': (r) => r.status === 202 || r.status === 429,
  });
}
