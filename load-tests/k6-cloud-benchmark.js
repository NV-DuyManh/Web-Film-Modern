import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics for Cloud Benchmark
export const cloudEventCounter = new Counter('cloud_events_submitted_total');
export const cloudErrorRate = new Rate('cloud_events_error_rate');
export const cloudEventLatency = new Trend('cloud_events_latency_ms', true);

// Staged scenarios calibrated strictly for Free-Tier limits (Render Free + Aiven Kafka Free)
export const options = {
  scenarios: {
    // Stage A: Warm-up & Cold-Start Probe (5 VUs)
    warmup_stage: {
      executor: 'constant-vus',
      vus: 5,
      duration: '20s',
      startTime: '0s',
    },
    // Stage B: Normal Cloud Ingestion (20 VUs)
    steady_stage: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '15s', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '10s', target: 5 },
      ],
      startTime: '25s',
    },
    // Stage C: Peak Quota Test (50 VUs) - executed only after warmup
    peak_stage: {
      executor: 'constant-vus',
      vus: 50,
      duration: '20s',
      startTime: '1m25s',
    },
  },
  thresholds: {
    // Cloud network hops between Vercel/GitHub, Render, and Aiven
    http_req_duration: ['p(90)<500', 'p(95)<800'],
    cloud_events_error_rate: ['rate<0.02'], // Max 2% errors allowed
  },
};

const TARGET_URL = __ENV.TARGET_URL || 'https://mfilm-backend-api.onrender.com/api/v1/events';

const ALLOWED_EVENT_TYPES = [
  'watch_progress',
  'play',
  'pause',
  'seek',
  'movie_view',
  'complete',
  'buffer_start',
  'buffer_end',
];

const SAMPLE_MOVIES = [
  'one-piece-dao-hai-tac',
  'naruto-shippuden',
  'jujutsu-kaisen-chu-thuat-hoi-chien',
  'demon-slayer-kimetsu-no-yaiba',
  'attack-on-titan-dai-chien-titan',
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function () {
  const eventType = getRandomItem(ALLOWED_EVENT_TYPES);
  const movieId = getRandomItem(SAMPLE_MOVIES);
  const userId = `cloud_vu_${__VU}_${__ITER % 20}`;
  const sessionId = `cloud_sess_${__VU}_${Date.now()}`;

  const payload = JSON.stringify({
    eventType,
    eventVersion: '1',
    occurredAt: new Date().toISOString(),
    userId,
    sessionId,
    movieId,
    episodeId: `ep_${(__ITER % 5) + 1}`,
    metadata: {
      progress: Math.floor(Math.random() * 2400),
      duration: 3600,
      percent: 45.2,
      source: 'k6-cloud-test',
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Cloud-Benchmark': 'k6-github-actions',
    },
    timeout: '10s', // Accommodates Render cold-start if sleeping
  };

  const res = http.post(TARGET_URL, payload, params);

  const isSuccess = check(res, {
    'status is 202': (r) => r.status === 202,
    'has eventId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body && body.eventId);
      } catch {
        return false;
      }
    },
  });

  cloudEventCounter.add(1);
  cloudErrorRate.add(!isSuccess);
  cloudEventLatency.add(res.timings.duration);

  // Realistic user pacing between 100ms and 300ms
  sleep(0.1 + Math.random() * 0.2);
}
