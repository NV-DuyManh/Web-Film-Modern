import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
export const eventCounter = new Counter('events_submitted_total');
export const errorRate = new Rate('events_error_rate');
export const eventLatency = new Trend('events_latency_ms', true);

// Configuration options with stages simulating 1k, 10k, and high load
export const options = {
  scenarios: {
    // Stage 1: 1,000 Virtual Users Baseline
    baseline_1k: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '15s', target: 200 },
        { duration: '30s', target: 1000 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
    // Stage 2: Stress / Spike to 5,000 - 10,000 requests capacity
    high_load_10k: {
      executor: 'constant-arrival-rate',
      rate: 2000, // 2,000 RPS
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 500,
      maxVUs: 2000,
      startTime: '1m5s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    events_error_rate: ['rate<0.02'], // Error rate under 2%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:4000/api/v1/events';

const EVENT_TYPES = [
  { type: 'watch_progress', weight: 40 },
  { type: 'play', weight: 15 },
  { type: 'pause', weight: 10 },
  { type: 'movie_view', weight: 10 },
  { type: 'search', weight: 8 },
  { type: 'seek', weight: 5 },
  { type: 'buffer_start', weight: 3 },
  { type: 'buffer_end', weight: 3 },
  { type: 'complete', weight: 2 },
  { type: 'favorite', weight: 1.5 },
  { type: 'rating', weight: 1 },
  { type: 'comment', weight: 0.5 },
  { type: 'recommendation_view', weight: 0.5 },
  { type: 'recommendation_click', weight: 0.5 },
];

const SAMPLE_MOVIES = [
  'one-piece-dao-hai-tac',
  'naruto-shippuden',
  'jujutsu-kaisen-chu-thuat-hoi-chien',
  'demon-slayer-kimetsu-no-yaiba',
  'attack-on-titan-dai-chien-titan',
  'spider-man-no-way-home',
  'oppenheimer-2023',
  'interstellar-ho-den-tu-than',
  'dune-hanh-tinh-cat-phan-2',
  'avatar-dong-chay-cua-nuoc',
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomEventType() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const item of EVENT_TYPES) {
    cumulative += item.weight;
    if (rand <= cumulative) {
      return item.type;
    }
  }
  return 'watch_progress';
}

function generateSyntheticEvent(vuId, iteration) {
  const eventType = getRandomEventType();
  const movieId = getRandomItem(SAMPLE_MOVIES);
  const userId = `vu_user_${vuId}_${(iteration % 50) + 1}`;
  const sessionId = `sess_${vuId}_${Date.now()}`;

  let metadata = {};
  if (eventType === 'search') {
    metadata = { query: 'anime hanh dong', resultsCount: 42 };
  } else if (eventType === 'watch_progress') {
    metadata = { progress: Math.floor(Math.random() * 3600), duration: 5400, percent: 45.5 };
  } else if (eventType === 'rating') {
    metadata = { rating: (Math.random() * 2 + 8).toFixed(1) };
  } else if (eventType === 'comment') {
    metadata = { commentLength: 45, sentiment: 'positive' };
  } else if (eventType === 'recommendation_click') {
    metadata = { algorithm: 'hybrid_als_content', position: 2 };
  }

  return {
    eventType,
    eventVersion: '1',
    occurredAt: new Date().toISOString(),
    userId,
    sessionId,
    movieId,
    episodeId: `ep_${(iteration % 12) + 1}`,
    metadata,
  };
}

export default function () {
  const payload = JSON.stringify(generateSyntheticEvent(__VU, __ITER));

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Load-Test': 'k6-mfilm',
    },
    timeout: '5s',
  };

  const res = http.post(BASE_URL, payload, params);

  const success = check(res, {
    'status is 202 Accepted': (r) => r.status === 202,
    'has eventId in response': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json && json.eventId !== undefined;
      } catch {
        return false;
      }
    },
  });

  eventCounter.add(1);
  errorRate.add(!success);
  eventLatency.add(res.timings.duration);

  // Random sleep between 10ms - 50ms for realistic burst distribution
  sleep(0.01 + Math.random() * 0.04);
}
