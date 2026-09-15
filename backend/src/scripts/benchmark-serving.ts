/**
 * MFILM Recommendation Serving Benchmark Script
 * Strictly adheres to Prompt 04 Step 27.
 * Measures uncached vs cached p50/p95 latency, cache hit ratio, and payload size.
 */

import * as http from 'http';

interface LatencyMeasurement {
  durationMs: number;
  statusCode: number;
  cached: boolean;
  payloadBytes: number;
}

function makeRequest(path: string): Promise<LatencyMeasurement> {
  return new Promise((resolve, reject) => {
    const t0 = process.hrtime.bigint();
    const req = http.get(`http://localhost:4000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const t1 = process.hrtime.bigint();
        const durationMs = Number(t1 - t0) / 1e6;
        let isCached = false;
        try {
          const json = JSON.parse(data);
          isCached = Boolean(json.cached);
        } catch (e) {}

        resolve({
          durationMs,
          statusCode: res.statusCode || 0,
          cached: isCached,
          payloadBytes: Buffer.byteLength(data, 'utf8'),
        });
      });
    });

    req.on('error', (err) => reject(err));
  });
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, idx)].toFixed(2));
}

async function runServingBenchmark() {
  console.log('================================================================');
  console.log('       MFILM RECOMMENDATION SERVING BENCHMARK (STEP 27)');
  console.log('================================================================');
  console.log('Target Endpoint: GET /api/v1/recommendations/for-you?limit=10\n');

  // 1. Uncached requests (bypass cache with unique mock headers/users or test after flush)
  console.log('[1/3] Benchmarking Uncached / Cold Path (10 requests)...');
  const coldLatencies: number[] = [];
  let payloadBytes = 0;

  for (let i = 0; i < 10; i++) {
    // Each distinct query param or un-cached key
    const res = await makeRequest(`/api/v1/recommendations/for-you?limit=10&_nocache=${Date.now()}_${i}`);
    coldLatencies.push(res.durationMs);
    payloadBytes = res.payloadBytes;
  }

  // 2. Cached requests (Valkey hit path)
  console.log('[2/3] Benchmarking Cached / Warm Valkey Path (100 requests)...');
  const warmLatencies: number[] = [];
  let cacheHits = 0;

  // Prime cache
  await makeRequest('/api/v1/recommendations/for-you?limit=10');

  for (let i = 0; i < 100; i++) {
    const res = await makeRequest('/api/v1/recommendations/for-you?limit=10');
    warmLatencies.push(res.durationMs);
    if (res.cached) cacheHits++;
  }

  // 3. Fallback path (simulating empty recommendations / baseline)
  console.log('[3/3] Benchmarking Fallback Popularity Path (10 requests)...');
  const fallbackLatencies: number[] = [];
  for (let i = 0; i < 10; i++) {
    const res = await makeRequest('/api/v1/analytics/trending?limit=10');
    fallbackLatencies.push(res.durationMs);
  }

  const uncachedP50 = percentile(coldLatencies, 50);
  const uncachedP95 = percentile(coldLatencies, 95);
  const cachedP50 = percentile(warmLatencies, 50);
  const cachedP95 = percentile(warmLatencies, 95);
  const fallbackP50 = percentile(fallbackLatencies, 50);
  const fallbackP95 = percentile(fallbackLatencies, 95);
  const hitRatio = Number(((cacheHits / warmLatencies.length) * 100).toFixed(1));

  console.log('\n----------------------------------------------------------------');
  console.log('               MEASURED SERVING BENCHMARK RESULTS');
  console.log('----------------------------------------------------------------');
  console.log(`Uncached Cold Latency (p50)   : ${uncachedP50} ms`);
  console.log(`Uncached Cold Latency (p95)   : ${uncachedP95} ms`);
  console.log(`Cached Valkey Latency (p50)   : ${cachedP50} ms`);
  console.log(`Cached Valkey Latency (p95)   : ${cachedP95} ms`);
  console.log(`Cache Hit Ratio (warm test)   : ${hitRatio}% (${cacheHits}/${warmLatencies.length})`);
  console.log(`Payload Size                  : ${(payloadBytes / 1024).toFixed(2)} KB (${payloadBytes} bytes)`);
  console.log(`Fallback Baseline Latency(p50): ${fallbackP50} ms (p95: ${fallbackP95} ms)`);
  console.log('----------------------------------------------------------------\n');
  console.log('================================================================');
  console.log('✅ Recommendation Serving Benchmark Completed Successfully.');
  console.log('================================================================');
}

runServingBenchmark().catch((err) => {
  console.error('Serving benchmark failed:', err);
  process.exit(1);
});
