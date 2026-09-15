# MFILM Cloud-First Free-Only ($0) Architecture

## 1. Executive Summary

MFILM transitions from a local single-node development Docker setup to a **100% Online, Enterprise-Grade, Free-Only ($0 Mandatory Monthly Cost)** architecture.

### Architectural Tenets
1. **Zero Localhost Dependency**: The complete live demonstration operates over the public Internet.
2. **Strict $0 Budget**: Every chosen platform provides a verifiable, permanent free tier without requiring paid subscriptions.
3. **Real Managed Services**: No mocked message brokers or fake databases. Aiven Kafka, Aiven PostgreSQL, Aiven Valkey, Render, and Tinybird are genuine, cloud-hosted services.
4. **Resilient Dual-Path Analytics**:
   - **Online Real-Time Path**: `Browser -> Render NestJS -> Aiven Kafka -> Tinybird Managed Connector -> Real-time Analytics APIs`.
   - **Offline / Batch ML Path**: `Data Lake (Cloudflare R2 / Parquet Exports) -> Databricks Free Edition -> Collaborative Filtering & Model Training`.

---

## 2. High-Level Online Cloud Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientTier ["Public Client Tier (Global Edge)"]
        Browser["User Web Browser"]
        VercelApp["MFILM Web App\n(Vercel Hobby $0)"]
        ArtPlayer["ArtPlayer + HLS.js Player"]
        EventSDK["MFILM Telemetry SDK\n(eventTracker.js)"]

        Browser --> VercelApp
        VercelApp --> ArtPlayer
        ArtPlayer --> EventSDK
    end

    subgraph ExternalSaaS ["Managed Media & Identity"]
        FirebaseAuth["Firebase Authentication\n(Identity & JWT)"]
        CloudinaryCDN["Cloudinary Free Tier\n(Image Storage & CDN)"]
        VercelApp -. "Authenticate" .-> FirebaseAuth
        VercelApp -. "Fetch Images" .-> CloudinaryCDN
    end

    subgraph ComputeTier ["Compute & Ingestion Tier (Cloud Public Web)"]
        RenderAPI["MFILM NestJS API\n(Render Free Web Service)\nhttps://mfilm-api.onrender.com"]
        EventSDK -- "HTTPS POST /api/v1/events" --> RenderAPI
    end

    subgraph StateTier ["Operational Data & Cache (Aiven Free Cloud)"]
        AivenPG["Aiven PostgreSQL Free\n(1 CPU, 1 GB RAM, 1 GB Disk, SSL)\nBusiness Transactional Store"]
        AivenValkey["Aiven Valkey Free\n(Redis-compatible, TLS)\nSession Cache & Rate Limiting"]

        RenderAPI --> AivenPG
        RenderAPI --> AivenValkey
    end

    subgraph StreamingTier ["Managed Event Streaming (Aiven Free Cloud)"]
        AivenKafka["Aiven Apache Kafka Free\n(SASL_SSL, 250 KiB/s)\nTopic: mfilm.behavior.v1"]
        RenderAPI -- "SASL_SSL / Partitioned by userId" --> AivenKafka
    end

    subgraph RealTimeAnalytics ["Real-Time Columnar Analytics Tier"]
        TinybirdConnector["Tinybird Managed Kafka Connector\n(Automated Kafka Consumer)"]
        TinybirdEngine["Tinybird Analytics Engine\n(ClickHouse-backed Serverless OLAP)\n10 GB Storage Free"]
        TinybirdPipes["Real-time Analytical Pipes\n(events_per_minute, active_movies_15m)"]

        AivenKafka --> TinybirdConnector
        TinybirdConnector --> TinybirdEngine
        TinybirdEngine --> TinybirdPipes
        TinybirdPipes -- "HTTPS Auth Read API" --> RenderAPI
    end

    subgraph BatchMLTier ["Data Lake & Batch Machine Learning Tier"]
        CloudflareR2["Cloudflare R2 Object Storage\n(10 GB/mo Free Allowance)\nraw/event_date=YYYY-MM-DD/*.parquet"]
        Databricks["Databricks Free Edition\n(Serverless Spark & PySpark ML)\nALS Matrix Factorization Training"]

        CloudflareR2 -. "Batch Load" .-> Databricks
        Databricks -. "Export Model Weights" .-> AivenValkey
    end

    subgraph ObservabilityTier ["Online Cloud Observability"]
        GrafanaCloud["Grafana Cloud Free\n(Hosted Prometheus & Dashboards)"]
        RenderAPI -- "Scrape /api/v1/metrics" --> GrafanaCloud
    end
```

---

## 3. Component Responsibility & Mapping Matrix

| Layer | Service Provider | Plan / Tier | Cost | Primary Role |
| :--- | :--- | :--- | :---: | :--- |
| **Frontend** | Vercel | Hobby | **$0** | Hosts React 19 + Vite 8 SPA, PWA service workers, edge routing. |
| **Authentication** | Firebase Auth | Spark | **$0** | User signup, Google OAuth, session token issuance. |
| **Media Delivery** | Cloudinary | Free | **$0** | Image asset transformations, CDN delivery. |
| **Backend API** | Render | Free Web Service | **$0** | Ingests events, validates DTOs, publishes to Kafka, serves business APIs. |
| **Operational DB** | Aiven | Free PostgreSQL | **$0** | 29 relational tables, user profiles, subscriptions, movie catalog. |
| **Cache & State** | Aiven | Free Valkey | **$0** | Redis-compatible in-memory store for rate limiting, token blacklist, Tinybird cache. |
| **Event Broker** | Aiven | Free Apache Kafka| **$0** | Managed event streaming with SASL_SSL encryption and partition ordering. |
| **Real-Time OLAP** | Tinybird | Build (Free) | **$0** | Consumes directly from Aiven Kafka; serves sub-second trending and QoE queries. |
| **Data Lake** | Cloudflare | R2 Standard Free | **$0** | S3-compatible cold storage for partitioned event Parquet archives. |
| **Batch ML / Spark**| Databricks | Free Edition | **$0** | Offline model training (Collaborative Filtering ALS, Content feature engineering). |
| **Observability** | Grafana Cloud | Free Forever | **$0** | Telemetry dashboard, request rates, Kafka publishing error rates. |

---

## 4. End-to-End Online Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Viewer as Browser / MFILM Client
    participant Frontend as Vercel React App
    participant API as Render NestJS API
    participant Valkey as Aiven Valkey Free
    participant Kafka as Aiven Kafka Free
    participant Tinybird as Tinybird Analytics
    participant Grafana as Grafana Cloud Free

    Viewer->>Frontend: Watches movie episode / seeks
    Frontend->>Frontend: eventTracker throttles watch_progress (10s window)
    Frontend->>API: HTTPS POST /api/v1/events (keepalive)
    
    API->>Valkey: Check IP rate limit (mfilm:ratelimit:ip)
    Valkey-->>API: Rate limit OK
    API->>API: Validate event schema + enrich with server timestamp
    API->>Kafka: SASL_SSL Produce to mfilm.behavior.v1 (Key: userId)
    API-->>Frontend: HTTP 202 Accepted { eventId, receivedAt }
    
    par Real-Time Stream Ingestion
        Kafka->>Tinybird: Tinybird Kafka Connector ingests micro-batch
        Tinybird->>Tinybird: Updates Materialized Pipes (events_per_minute, active_movies)
    and Metrics Scrape
        Grafana->>API: HTTPS Scrape /api/v1/metrics
        API-->>Grafana: Prom format (kafka_publish_total, http_req_duration_ms)
    end
```

---

## 5. Network & Security Architecture

- **Zero Inbound Localhost**: All inter-service communications traverse public cloud networks using encrypted protocols:
  - HTTPS / TLS 1.3 for API endpoints.
  - PostgreSQL `sslmode=require` / `rejectUnauthorized=false` for Aiven managed databases.
  - `rediss://` (TLS) for Aiven Valkey.
  - `SASL_SSL` (SCRAM-SHA-256) over port 9092/9094 for Aiven Kafka.
- **CORS Restriction**: Render API enforces CORS whitelist strictly permitting the MFILM Vercel domain (`https://mfilm.online`, `https://*.vercel.app`) and local development origin (`http://localhost:5173`).
- **Quota Safeguard**: Valkey caches Tinybird query responses for 60 seconds, preventing redundant analytical calls and ensuring the frontend never exceeds the 1,000 requests/day free quota.
