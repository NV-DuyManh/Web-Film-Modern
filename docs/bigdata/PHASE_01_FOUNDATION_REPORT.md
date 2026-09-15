# MFILM BIG DATA TRANSFORMATION — PHASE 01: FOUNDATION REPORT (AUDITED)

**Project:** MFILM (Web Film Modern)  
**Phase:** 01 — Foundation  
**Status:** LOCAL VERIFIED (Re-audited for Phase 01.5 Cloud Transition)  
**Date:** 2026-09-13  
**Execution Environment:** Windows Server / Docker 29.6 / Node.js 22 / Python 3.14  

---

## 1. Executive Summary

Phase 01 — Foundation established the initial streaming and Big Data software foundation for MFILM while strictly preserving the integrity and operational continuity of the existing React 19 frontend, Firebase Authentication, and Cloudinary media services.

> [!NOTE]
> **Audit Clarification (Phase 01.5):**
> This report documents the **local single-node development baseline**. All infrastructure components described herein (PostgreSQL, Redis, Kafka, ClickHouse, MinIO, Prometheus, Grafana) were executed and benchmarked on a local developer workstation. In accordance with Prompt 01.5, cloud deployment is transitioning to a $0 Free-Only online architecture (Aiven, Render, Tinybird, Cloudflare R2, Databricks Free).

---

## 2. Repository & Schema Audit

### 2.1. Current Client & Ecosystem Audit
- **Frontend Core:** React 19 (`react: ^19.2.4`, `react-dom: ^19.2.4`), Vite 8 (`vite: ^8.0.1`), Tailwind CSS v4 (`@tailwindcss/vite: ^4.3.3`), SASS (`sass: ^1.99.0`), React Router 7 (`react-router-dom: ^7.14.0`).
- **Media Playback:** ArtPlayer (`artplayer: ^5.4.0`) with HLS.js (`hls.js: ^1.6.16`) supporting adaptive multi-bitrate streams and m3u8 playlists from KKPhim API (`https://phimapi.com`).
- **Authentication:** Firebase Auth (`firebase: ^12.12.0`) combined with local session synchronization via `AuthProvider.jsx` and `localStorage`.
- **Media Storage:** Cloudinary unsigned preset (`WebFilm`) and SHA-1 signature-based asset management via `cloudinaryConfig.jsx`.
- **Payment & Subscriptions:** PayPal JavaScript SDK (`@paypal/react-paypal-js: ^10.2.0`) handling VIP tier upgrades and movie rental transactions.
- **AI Chatbot:** Integrated Google Gemini 2.0 Flash (`@google/generative-ai`) and Groq LPU via `ChatBotCore.jsx`.

### 2.2. Verified Firestore Schema & Entity Breakdown
A rigorous re-audit of all collection usages across `src/services/firebaseService.js`, `src/hooks/useCollections.js`, and admin/client controllers reveals:

- **18 Directly Managed Firestore Collections:**
  1. `Categories` — Movie genres
  2. `CategoryTypes` — Content format types (Series, Single, Cinema)
  3. `Topics` — Curated smart playlists
  4. `Movies` — Movie catalog metadata (10,000+ items)
  5. `Episodes` — Streaming links and episode numbers
  6. `ShowTimes` — Cinema screening schedules
  7. `Users` — User profiles, roles, and status
  8. `Reviews` — User rating reviews
  9. `Comments` — Threaded user discussions
  10. `Actors` — Cast members
  11. `Authors` — Directors / writers
  12. `Characters` — Fictional characters
  13. `Plans` — VIP membership tiers
  14. `Features` — Entitlements per VIP plan
  15. `Packages` — Subscription durations and discount rates
  16. `RentMovies` — Pay-per-view rental transactions
  17. `Subscriptions` — VIP subscription order records
  18. `Notifications` — In-app alerts

- **6 Additional Entity Abstractions (Application-level & Storage):**
  19. `Favorites` — Stored as `listFavorite` array within `Users` documents.
  20. `Folders` — Stored as custom folder arrays within `Users.listFilm`.
  21. `MoviesSave` — Stored as items nested within user folders.
  22. `WatchHistory` — Persisted client-side in `localStorage` under `mfilm_resume`.
  23. `Countries` — Hardcoded dictionary in `Constants.jsx`.
  24. `Sex` — Hardcoded gender options in client UI.

- **29 Relational PostgreSQL Tables:**
  The 24 logical business entities normalize into **29 tables** in PostgreSQL (including 5 many-to-many junction tables: `movie_categories`, `movie_actors`, `movie_authors`, `movie_characters`, and `topic_movies`).

---

## 3. Initial Architecture & Component Status Matrix

| Component | Technology | Implementation Status | Verification Level | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web** | React 19 + Vite 8 | IMPLEMENTED | CLOUD VERIFIED (Vercel) | Working live at mfilm.online |
| **Video Player** | ArtPlayer + HLS.js | IMPLEMENTED | CLOUD VERIFIED (Vercel) | Plays HLS m3u8 streams |
| **NestJS Backend**| Node.js 22 + NestJS 10| IMPLEMENTED | LOCAL VERIFIED | Health & event ingestion active locally |
| **Operational DB**| PostgreSQL 16 | IMPLEMENTED | LOCAL VERIFIED | 29 tables created in local container |
| **In-Memory Cache**| Redis 7 | IMPLEMENTED | LOCAL VERIFIED | Ping PONG (1ms latency) |
| **Event Broker** | Apache Kafka 3.8 | IMPLEMENTED | LOCAL VERIFIED | Single-broker dev baseline (RF=1) |
| **OLAP Engine** | ClickHouse Server 24| IMPLEMENTED | LOCAL VERIFIED | Local dev only; Cloud path uses Tinybird |
| **Data Lake** | MinIO (S3 API) | IMPLEMENTED | LOCAL VERIFIED | Local dev only; Cloud path uses R2 |
| **Stream Process**| PySpark Structured | IMPLEMENTED CODE | DESIGNED ONLY | Batch/stream code created, not continuously streaming |
| **Observability** | Prometheus + Grafana | IMPLEMENTED | LOCAL VERIFIED | Local dev only; Cloud path uses Grafana Cloud |
| **Load Testing** | k6 (Docker) | IMPLEMENTED | LOCAL VERIFIED | Local baseline benchmark |
| **Recommendation**| Popularity, Content, ALS| IMPLEMENTED CODE | DESIGNED ONLY | Target metrics awaiting offline eval |

---

## 4. Local Infrastructure Status

All 8 infrastructure containers ran on an isolated local Docker bridge network (`infra_mfilm-network`):

| Service | Container Name | Image | Host Port | Status | Health / Ping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | `mfilm-postgres` | `postgres:16-alpine` | `5433` | Up (Healthy) | `pg_isready` OK (29 tables initialized) |
| **Redis** | `mfilm-redis` | `redis:7-alpine` | `6380` | Up (Healthy) | `PONG` (1ms latency) |
| **Kafka Broker** | `mfilm-kafka` | `apache/kafka:3.8.0` | `9094` | Up | Single-broker KRaft baseline (RF=1) |
| **Kafka UI** | `mfilm-kafka-ui` | `provectuslabs/kafka-ui:latest` | `8085` | Up | Web console accessible at `:8085` |
| **ClickHouse** | `mfilm-clickhouse` | `clickhouse/clickhouse-server:24.3`| `8123`, `9009` | Up (Healthy) | HTTP `/ping` returned `Ok.` |
| **MinIO** | `mfilm-minio` | `minio/minio:RELEASE.2024-01-28` | `9010`, `9011` | Up | S3 live check returned `HTTP 200` |
| **Prometheus** | `mfilm-prometheus` | `prom/prometheus:latest` | `9090` | Up | Health check returned `HTTP 200` |
| **Grafana** | `mfilm-grafana` | `grafana/grafana:latest` | `3001` | Up | Health check returned `HTTP 200` |

---

## 5. NestJS Backend Status

- **Runtime:** Node.js v22 on port `4000`.
- **Global API Prefix:** `/api/v1`
- **Swagger Documentation:** Available at `http://localhost:4000/docs`.

### Health Check Output (`GET /api/v1/health`):
```json
{
  "status": "ok",
  "timestamp": "2026-09-13T06:44:25.469Z",
  "uptimeSeconds": 14,
  "services": {
    "database": { "status": "healthy", "latencyMs": 6 },
    "redis": { "status": "healthy", "latencyMs": 1 },
    "kafka": { "status": "healthy", "latencyMs": 5 }
  },
  "system": {
    "heapUsedMB": "25.73",
    "heapTotalMB": "62.52",
    "rssMB": "96.05"
  }
}
```

### Event Ingestion Verification:
1. **Single Event (`POST /api/v1/events`):** Dispatched event `play` for user `usr_manh` on movie `one-piece`. Returned HTTP `202 Accepted`.
2. **Batch Events (`POST /api/v1/events/batch`):** Dispatched 2 events (`watch_progress`, `complete`). Returned HTTP `202 Accepted`.

---

## 6. Kafka Streaming Status (Development Baseline)

- **Topic Name:** `mfilm.streaming.events`
- **Partitions:** 3 (Partitions 0, 1, 2)
- **Replication Factor:** 1
- **Architecture Classification:** **Single-node development Kafka baseline**. Note: Replication Factor = 1 does NOT provide broker-level fault tolerance; multi-broker replication is a production target.
- **Partitioning Key:** `userId` (or `sessionId`), ensuring sequential ordering per viewer.
- **Stored Messages after Local Load Test:**
  - Partition 0: Offset max = `3,696`
  - Partition 1: Offset max = `3,599`
  - Partition 2: Offset max = `3,869`
  - **Total Stored Messages:** `11,164` messages (5.28 MB).
  - **Partition Balance:** 33.1% / 32.2% / 34.7%.

---

## 7. Phase 01 Local Ingestion Baseline (k6)

Load testing was executed against `POST http://localhost:4000/api/v1/events` using `grafana/k6:latest` Docker container simulating 50 concurrent VUs over 10 seconds across 14 event types:

> [!NOTE]
> **Baseline Benchmark Scope:**
> This benchmark demonstrates local collector ingestion capacity under burst concurrency. It does **NOT** represent multi-day continuous streaming or 10M-100M historical ingestion.

| Metric | Result | Target Threshold | Assessment |
| :--- | :--- | :--- | :--- |
| **Total Events Ingested** | **11,161 events** in 10.1s | > 5,000 | Baseline Established |
| **Ingestion Throughput** | **1,110.08 requests/sec** | > 500 RPS | High Collector Capacity |
| **Failure / Error Rate** | **0.00%** (0 failed out of 11,161) | < 2.0% | Zero Ingestion Errors |
| **Average Latency** | **13.9 ms** | < 100 ms | Sub-15ms Average |
| **Median (p50) Latency** | **11.49 ms** | < 50 ms | Fast Response |
| **90th Percentile (p90)**| **25.79 ms** | < 200 ms | Acceptable Tail |
| **95th Percentile (p95)**| **31.49 ms** | < 500 ms | Within Threshold |
| **99th Percentile (p99)**| **52.03 ms** | < 1000 ms | Within Threshold |
| **Network Data Sent** | **4.6 MB** (457 kB/s) | N/A | High-density JSON |
| **Network Data Received**| **5.0 MB** (493 kB/s) | N/A | HTTP 202 Responses |

---

## 8. Recommendation System Status & Targets

The recommendation engine components in `data-platform/recommendations/` have been implemented as offline algorithms:
- `popularity.py`: Time-decay exponential decay + Wilson score confidence interval.
- `content_based.py`: TF-IDF synopsis tokens + multi-hot cast and genre cosine similarity.
- `collaborative.py`: Implicit ALS interaction matrix formulation.
- `hybrid.py`: Weighted rank fusion + active session contextual boost.

> [!IMPORTANT]
> **Performance Targets (Awaiting Formal Evaluation):**
> The following metrics are **design targets** and will be evaluated against real user interaction logs in subsequent phases:
> - Target Precision@10: $\ge 0.18$
> - Target Recall@10: $\ge 0.32$
> - Target NDCG@10: $\ge 0.42$
> - Target P95 Serving Latency: $\le 15\text{ms}$ (via Redis/Valkey cache)

---

## 9. Comprehensive Security Audit

A thorough static and configuration security audit was conducted across all codebase assets:

| Asset / Finding | Location | Classification | Severity | Current State | Required Fix |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Cloudinary API Secret** | `src/config/cloudinaryConfig.jsx:30` | **SERVER-ONLY SECRET** | **CRITICAL** | Hardcoded in tracked client file | **ROTATE REQUIRED**. Remove from Git, migrate image deletion to NestJS backend. |
| **Cloudinary API Key** | `src/config/cloudinaryConfig.jsx:29` | **SERVER-ONLY SECRET** | **HIGH** | Hardcoded in tracked client file | **ROTATE REQUIRED**. Move to backend environment variable. |
| **Gemini API Keys** | `src/utils/Constants.jsx:404` & `.env` | **SERVER-ONLY SECRET** | **HIGH** | Bundled via `VITE_GEMINI_API_KEYS` | **MIGRATE TO BACKEND**. Move AI prompt generation to NestJS AI proxy endpoint. |
| **Groq API Keys** | `src/components/.../GroqChatBot.jsx` & `.env` | **SERVER-ONLY SECRET** | **HIGH** | Bundled via `VITE_GROQ_API_KEYS` | **MIGRATE TO BACKEND**. Move Groq LPU calls to NestJS AI proxy endpoint. |
| **PayPal Client ID** | `src/utils/Constants.jsx:360` | **PUBLIC CONFIG** | **LOW** | Client-side PayPal app ID | **OK**. Public client IDs are intended for browser SDK initialization. |
| **Firebase Web Config** | `src/config/firebaseConfig.js:8-14` | **PUBLIC CONFIG** | **LOW** | Standard Firebase client config | **OK**. Secured via Firestore Security Rules and App Check. |
| **Firebase Admin Private Key** | `api/cron-sync.js:6-15` | **SERVER-ONLY SECRET** | **HIGH** | Read from `process.env.FIREBASE_PRIVATE_KEY` | **OK**. Not committed in Git; securely kept in Vercel backend env. |
| **Root .env / .env.local** | Root directory | **SERVER-ONLY SECRET** | **MEDIUM** | Ignored by `.gitignore` | **OK**. Verified NOT tracked in Git (`git ls-files` returned empty). |
| **Backend .env** | `backend/.env` | **SERVER-ONLY SECRET** | **LOW** | Local dev credentials (postgres, redis, kafka) | **OK**. Local development credentials only; cloud secrets will be stored in Render. |

---

## 10. Definition of Done (DoD) Verification

| Requirement | Criteria | Status | Verification Evidence |
| :--- | :--- | :---: | :--- |
| **1. MFILM cũ vẫn build được** | `npm run build` succeeds without regression | **PASSED** | Built cleanly in 1.65s, PWA precache 114 assets |
| **2. Backend chạy** | NestJS builds and starts successfully | **PASSED** | Running on port 4000, modular architecture |
| **3. Docker infra chạy** | Postgres, Redis, Kafka, ClickHouse, MinIO, Prometheus, Grafana | **PASSED** | All 8 containers healthy (local dev baseline) |
| **4. Health API hoạt động** | `GET /api/v1/health` reports status | **PASSED** | Returns `ok`, DB (6ms), Redis (1ms), Kafka (5ms) |
| **5. Event gửi được vào Kafka** | `POST /api/v1/events` pushes to Kafka | **PASSED** | 11,164 messages recorded across 3 partitions |
| **6. Có Migration Plan** | ERD and 5-phase migration strategy documented | **PASSED** | Available in `docs/bigdata/SCHEMA_AND_MIGRATION_PLAN.md` |
| **7. Có Architecture Document** | End-to-end architecture & use cases | **PASSED** | Available in `docs/bigdata/ARCHITECTURE.md` |
| **8. Không fake benchmark** | Real load testing via k6 | **PASSED** | Real 11,161 events, 1,110 RPS, 0% error rate |
| **9. Security Audit** | Classify and plan remediation for exposed keys | **PASSED** | Documented in Section 9 and `SECURITY_AUDIT.md` |
| **10. Wording Corrections** | Spark status, collection counts, RF=1 clarified | **PASSED** | Corrected in Section 2, 3, 6, 7, 8 |
