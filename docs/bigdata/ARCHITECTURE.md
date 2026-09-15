# MFILM Enterprise Streaming & Big Data Architecture

## 1. Executive Summary

MFILM is undergoing a strategic evolution from a client-side Firebase-backed movie platform into a scalable, enterprise-grade streaming and Big Data platform.

### Core Architectural Principles
1. **Zero Disruption**: Existing frontend, Firebase Authentication, and Cloudinary media flows remain fully functional throughout all transition phases.
2. **Event-Driven Streaming**: Every user interaction (plays, seeks, pauses, buffer events, searches, completions) is captured asynchronously and streamed through a fault-tolerant message broker.
3. **Lambda / Lakehouse Architecture**: Real-time analytical queries are handled by a columnar OLAP database (ClickHouse), while raw and historical data is archived immutably in an S3-compatible Data Lake (MinIO Parquet/Delta Lake) for machine learning and batch jobs.

---

## 2. High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Presentation Tier"]
        ReactApp["React 19 + Vite 8 Web App"]
        ArtPlayer["ArtPlayer + HLS.js Video Player"]
        EventTracker["MFILM Event Tracking SDK"]
        ReactApp --> ArtPlayer
        ArtPlayer --> EventTracker
    end

    subgraph IngestionLayer ["High-Throughput Ingestion Tier"]
        NestCollector["NestJS Event Collector\n(POST /api/v1/events)"]
        EventTracker -- "HTTP keepalive / POST" --> NestCollector
    end

    subgraph StreamingBroker ["Event Streaming Tier (Kafka KRaft)"]
        KafkaBroker["Apache Kafka 3.8 Broker\nTopic: mfilm.streaming.events (3 Partitions)"]
        KafkaUI["Kafka UI Management Console\n(:8085)"]
        NestCollector -- "Partitioned by userId/sessionId" --> KafkaBroker
        KafkaBroker -. "Monitor" .-> KafkaUI
    end

    subgraph ProcessingLayer ["Processing & Transformation Tier"]
        SparkStream["PySpark Structured Streaming Engine"]
        LightweightWorker["Local Streaming Consumer Worker"]
        KafkaBroker --> SparkStream
        KafkaBroker --> LightweightWorker
    end

    subgraph StorageLayer ["Data Lake & Analytics Tier"]
        MinIOLake["MinIO S3 Data Lake\n(Parquet partitioned by date/eventType)"]
        ClickHouse["ClickHouse Columnar OLAP\n(MergeTree & Materialized Views)"]
        PostgresDB["PostgreSQL 16\n(Normalized Business OLTP)"]
        RedisCache["Redis 7\n(In-Memory Cache & Rate Limiting)"]

        SparkStream --> MinIOLake
        SparkStream --> ClickHouse
        LightweightWorker --> ClickHouse
    end

    subgraph ServingLayer ["Analytics, ML & Serving Tier"]
        RecEngine["Recommendation Engine\n(Popularity, Content-Based, ALS CF, Hybrid)"]
        TrendingEngine["Real-time Trending & Session Analytics"]
        GrafanaDash["Grafana & Prometheus\n(Metrics & Dashboards)"]

        ClickHouse --> RecEngine
        ClickHouse --> TrendingEngine
        ClickHouse --> GrafanaDash
        PostgresDB --> NestCollector
        RedisCache --> NestCollector
    end
```

---

## 3. Detailed Data Pipeline Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Player as ArtPlayer (HLS.js)
    participant SDK as eventTracker.js
    participant API as NestJS Collector (/api/v1/events)
    participant Kafka as Kafka (mfilm.streaming.events)
    participant Stream as PySpark / Consumer
    participant CH as ClickHouse (streaming_events)
    participant Lake as MinIO (S3 Data Lake)

    User->>Player: Plays episode / seeks / watches
    Player->>SDK: Emits playback progress / buffer event
    SDK->>API: Asynchronous POST /api/v1/events (keepalive)
    API->>API: Validate DTO + Enrich (clientIp, receivedAt)
    API->>Kafka: Publish to topic partitioned by userId/sessionId
    API-->>SDK: HTTP 202 Accepted { eventId, receivedAt }
    
    par Stream to Analytics
        Kafka->>Stream: Consume event micro-batch
        Stream->>CH: Batch insert into ClickHouse (MergeTree)
        CH->>CH: Update Materialized Views (hourly_movie_stats)
    and Stream to Lakehouse
        Stream->>Lake: Write Parquet batch (s3a://mfilm-lake/raw-events/)
    end
```

---

## 4. Technology Stack Matrix

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | React, Vite, Tailwind CSS | React 19, Vite 8, Tailwind v4 | Responsive streaming client, PWA |
| **Media Player** | ArtPlayer, HLS.js | ArtPlayer 5.4, HLS.js 1.6 | Adaptive bitrate streaming, playback controls |
| **Backend Framework**| Node.js + NestJS | Node 22, NestJS 10 | Modular API, DTO validation, high throughput |
| **Operational DB** | PostgreSQL | 16-Alpine | ACID transactional store for 22 core entities |
| **Cache & State** | Redis | 7-Alpine | Fast key-value store, sessions, token blacklist |
| **Message Broker** | Apache Kafka (KRaft) | 3.8.0 | Distributed, partitioned event streaming broker |
| **Stream Processing**| PySpark / Python | Spark 3.5 / Python 3.14 | Structured Streaming, lakehouse sinking |
| **Data Lake** | MinIO (S3 API) | RELEASE.2024-01-28 | Object storage data lake for immutable Parquet |
| **OLAP Database** | ClickHouse Server | 24.3-Alpine | Ultra-fast columnar analytical store |
| **Observability** | Prometheus + Grafana | Latest | Telemetry scraping, latency monitoring |
| **Load Testing** | k6 | Latest (via Docker) | Concurrency and stress benchmarking |

---

## 5. Network & Port Allocation

To prevent collisions with existing host services, MFILM uses the following mapping:

| Service | Internal Container Port | External Host Port | URL / Interface |
| :--- | :--- | :--- | :--- |
| **NestJS Backend** | `4000` | `4000` | `http://localhost:4000/api/v1` |
| **Swagger Docs** | `4000` | `4000` | `http://localhost:4000/docs` |
| **PostgreSQL** | `5432` | `5433` | `postgresql://mfilm_user:mfilm_password@localhost:5433/mfilm_db` |
| **Redis** | `6379` | `6380` | `redis://:mfilm_redis_password@localhost:6380` |
| **Kafka Broker** | `9092` (internal) | `9094` (external) | `localhost:9094` |
| **Kafka UI** | `8080` | `8085` | `http://localhost:8085` |
| **ClickHouse HTTP** | `8123` | `8123` | `http://localhost:8123` |
| **ClickHouse Native**| `9000` | `9009` | `localhost:9009` |
| **MinIO S3 API** | `9000` | `9010` | `http://localhost:9010` |
| **MinIO Console** | `9001` | `9011` | `http://localhost:9011` |
| **Prometheus** | `9090` | `9090` | `http://localhost:9090` |
| **Grafana** | `3000` | `3001` | `http://localhost:3001` |
