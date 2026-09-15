# MFILM Cloud Free-Tier Limits & Defensive Engineering Specifications

## 1. Overview

To guarantee that MFILM remains permanently **$0 monthly cost** without risking account suspensions or unexpected billing, all services are strictly configured within their documented free allowances.

---

## 2. Comprehensive Provider Free-Tier Matrix

| Provider | Service | Free Tier Allowance | Hard Constraints | Architectural Defensive Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Aiven** | Apache Kafka | $0 Managed Kafka | - Ingress: ~250 KiB/s<br>- Egress: ~250 KiB/s<br>- Max 5 topics<br>- Max 2 partitions/topic | - Keep online topics minimal: `mfilm.behavior.v1` and `mfilm.behavior.dlq`.<br>- Limit partition count to 2.<br>- Throttle client-side telemetry bursts. |
| **Aiven** | PostgreSQL | $0 Managed DB | - 1 vCPU, 1 GB RAM<br>- 1 GB NVMe disk<br>- Max connections: ~20<br>- Powers down on idle | - Max pool size in NestJS limited to 10 connections.<br>- Idempotent migrations with zero large backfills.<br>- Idle wake-up handled gracefully. |
| **Aiven** | Valkey | $0 Managed Cache | - 1 vCPU, 1 GB RAM<br>- Redis 7 compatible | - Prefix all keys with `mfilm:`.<br>- Enforce TTLs (30s–3600s) on all keys to prevent unbounded memory growth. |
| **Tinybird** | Serverless ClickHouse | Build Plan ($0) | - 10 GB storage<br>- 1,000 API requests/day<br>- Shared compute | - Ingestion is pushed via Kafka (not counted in API requests).<br>- Valkey caches API queries for 60s so frontend never exhausts 1,000 req/day quota. |
| **Render** | Web Service | Free Tier ($0) | - 512 MB RAM, 0.1 CPU<br>- Sleeps after 15m idle<br>- Cold start latency (~30-50s) | - Lightweight Node 22 alpine build.<br>- Memory monitored under 100 MB.<br>- Frontend handles cold start gracefully with non-blocking fetch. |
| **Cloudflare** | R2 Object Storage | Standard Free | - 10 GB-month storage<br>- 1M Class A operations/mo<br>- 10M Class B operations/mo | - Export Parquet files in micro-batches (min 5MB per part).<br>- Set lifecycle retention to 30 days. |
| **Databricks** | Free Edition | Community / Free | - Serverless compute only<br>- Restricted outbound network<br>- Inactivity timeout | - Do not attempt direct streaming from Aiven Kafka over public internet.<br>- Restrict Databricks to offline batch ML over exported Parquet datasets. |
| **Grafana** | Grafana Cloud | Free Forever | - 10k Prometheus metrics<br>- 50 GB logs, 50 GB traces<br>- 14-day metric retention | - Scrape NestJS `/api/v1/metrics` every 15 seconds.<br>- Keep metric cardinality low (no dynamic label values like raw user IDs). |
| **Vercel** | Frontend Hosting | Hobby ($0) | - 100 GB bandwidth/mo<br>- Non-commercial fair use | - Static assets cached at CDN edge.<br>- PWA caching with Workbox. |
| **Firebase** | Authentication | Spark Plan ($0) | - 50k MAU phone auth<br>- Unlimited email/Google OAuth | - Standard user auth only.<br>- JWT verification on backend without excessive token refresh calls. |
| **Cloudinary** | Media CDN | Free Plan ($0) | - 25 monthly credits (~25 GB) | - Keep existing media assets.<br>- No mass re-uploading in this phase. |

---

## 3. Defensive Engineering Rules

### Rule 1: Aiven Kafka Throughput Guard
- Maximum ingress rate is **250 KiB/s**.
- At ~250 bytes per event, this supports up to **1,000 events/sec sustained**.
- The client-side telemetry SDK (`eventTracker.js`) throttles continuous progress events (`watch_progress`) to **one event every 10 seconds** per active viewer.

### Rule 2: Tinybird 1,000 Requests/Day Quota Protection
- While Tinybird's Kafka Connector consumes streaming events without counting against API quotas, external HTTP requests to Pipes (e.g. `/pipes/active_movies_15m.json`) are capped at **1,000 calls/day**.
- **Mitigation:** The NestJS backend caches all Tinybird query responses in Aiven Valkey with a **60-second TTL**.
- Even with 10,000 concurrent viewers on the frontend, the backend queries Tinybird at most **once every 60 seconds** (1,440 requests/day maximum, distributed over multiple active hours well within safety thresholds).

### Rule 3: Render Free Cold-Start Tolerance
- Render Free puts inactive web services to sleep after 15 minutes of zero traffic.
- **Mitigation:** The client SDK uses `fetch(..., { keepalive: true })` wrapped in non-blocking try-catches. When the backend is spinning up, client playback continues smoothly without stalling.
