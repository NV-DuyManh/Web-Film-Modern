# Tinybird Real-Time Analytics Integration (Aiven Kafka -> Tinybird)

## 1. Overview

Tinybird provides a serverless, managed ClickHouse engine that connects directly to Aiven Kafka using a native Kafka Connector on the **Free Build Plan ($0)**.

---

## 2. Setup Guide via Web Console

1. Create a workspace at [https://www.tinybird.co](https://www.tinybird.co).
2. Click **+ Add Data Source** -> Select **Apache Kafka**.
3. Fill in Aiven Kafka Connection Details:
   - **Connection Name:** `aiven-mfilm-kafka`
   - **Bootstrap Servers:** `<Aiven Kafka Host>:<Port>`
   - **Security Protocol:** `SASL_SSL`
   - **SASL Mechanism:** `SCRAM-SHA-256`
   - **Username:** `avnadmin`
   - **Password:** `<Aiven Kafka Password>`
4. Select Topic: `mfilm.behavior.v1`.
5. Tinybird reads live sample events and creates the `mfilm_behavior` datasource.
6. Push the analytical pipes:
   - `pipes/events_per_minute.pipe` -> Endpoint: `/v0/pipes/events_per_minute.json`
   - `pipes/active_movies_15m.pipe` -> Endpoint: `/v0/pipes/active_movies_15m.json`
   - `pipes/movie_event_breakdown.pipe` -> Endpoint: `/v0/pipes/movie_event_breakdown.json`
   - `pipes/recent_buffer_rate.pipe` -> Endpoint: `/v0/pipes/recent_buffer_rate.json`

---

## 3. Protecting the 1,000 API Requests/Day Free Quota

- **Ingestion does NOT count:** Tinybird does not consume API request quota when reading events from Kafka.
- **Query caching in Valkey:** The NestJS backend queries Tinybird endpoints and caches the JSON response in Aiven Valkey with a **60-second TTL** (`mfilm:tinybird:cache:<pipe_name>`).
- This guarantees maximum daily requests to Tinybird will remain well below the 1,000/day limit under any traffic condition.
