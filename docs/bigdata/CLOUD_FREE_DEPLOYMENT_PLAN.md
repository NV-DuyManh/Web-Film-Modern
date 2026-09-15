# MFILM Cloud-Free ($0) Deployment Plan & Step-by-Step Guide

## 1. Overview

This document provides exact, actionable instructions for provisioning and configuring the complete MFILM online Big Data stack using permanent free tiers ($0).

---

## 2. Step 1: Render Free Web Service (Backend API)

### A. Repository Setup
1. Fork or push the project repository to GitHub (ensure no secrets are committed).
2. Root directory for backend: `backend`.

### B. Render Dashboard Configuration
1. Go to [https://dashboard.render.com](https://dashboard.render.com) -> **New** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure service parameters:
   - **Name:** `mfilm-api`
   - **Region:** Singapore / Frankfurt / Oregon (match your Aiven region for lowest latency).
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/main`
   - **Instance Type:** `Free` ($0/mo)

### C. Environment Variables on Render
Add the following in the Render Environment tab:
```env
NODE_ENV=production
PORT=10000
GLOBAL_PREFIX=api/v1
CORS_ORIGINS=https://mfilm.online,https://web-film-modern.vercel.app,http://localhost:5173

# Aiven PostgreSQL Free (from Step 2)
DATABASE_URL=postgres://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require
DATABASE_SSL=true

# Aiven Valkey Free (from Step 3)
VALKEY_URL=rediss://default:PASSWORD@HOST:PORT
REDIS_TLS=true

# Aiven Kafka Free (from Step 4)
KAFKA_BROKERS=HOST:PORT
KAFKA_CLIENT_ID=mfilm-render-collector
KAFKA_SASL_MECHANISM=scram-sha-256
KAFKA_USERNAME=avnadmin
KAFKA_PASSWORD=PASSWORD
KAFKA_SSL=true
KAFKA_PARTITIONS=2
KAFKA_TOPIC_BEHAVIOR=mfilm.behavior.v1
KAFKA_TOPIC_DLQ=mfilm.behavior.dlq
```

---

## 3. Step 2: Aiven PostgreSQL Free ($0)

1. Sign up at [https://console.aiven.io](https://console.aiven.io) ($0 Free Plan, no credit card required for free tier).
2. Click **Create Service** -> **PostgreSQL**.
3. Select Cloud Provider (e.g., AWS or GCP) and nearest Region.
4. Select Plan: **Free** (1 CPU, 1 GB RAM, 1 GB Storage).
5. Service Name: `mfilm-postgres`.
6. Once provisioned, copy the **Service URI** (e.g., `postgres://avnadmin:***@mfilm-postgres-*.aivencloud.com:PORT/defaultdb?sslmode=require`).
7. Run the idempotent schema migration script:
   ```bash
   cd backend
   DATABASE_URL="<YOUR_AIVEN_POSTGRES_URI>" DATABASE_SSL="true" npx ts-node src/scripts/migrate-postgres.ts
   ```

---

## 4. Step 3: Aiven Valkey Free ($0)

1. In Aiven Console -> **Create Service** -> **Valkey** (Redis-compatible).
2. Select same Cloud Provider and Region.
3. Select Plan: **Free** ($0).
4. Service Name: `mfilm-valkey`.
5. Copy the **Service URI** (`rediss://default:***@mfilm-valkey-*.aivencloud.com:PORT`).

---

## 5. Step 4: Aiven Apache Kafka Free ($0)

1. In Aiven Console -> **Create Service** -> **Apache Kafka**.
2. Select same Cloud Provider and Region.
3. Select Plan: **Free** ($0).
4. Service Name: `mfilm-kafka`.
5. Go to the **Topics** tab -> Click **Add Topic**:
   - Topic Name: `mfilm.behavior.v1`
   - Partitions: `2` (Aiven Free supports up to 2 partitions)
   - Cleanup Policy: `Delete`
   - Retention: `86400000` ms (1 day)
6. Add DLQ Topic:
   - Topic Name: `mfilm.behavior.dlq`
   - Partitions: `1`
7. In the **Users** tab:
   - Note the username `avnadmin` and copy the password.
   - Authentication method: `SASL-SCRAM-SHA-256`.

---

## 6. Step 5: Tinybird Free (Real-Time Analytics)

1. Sign up at [https://www.tinybird.co](https://www.tinybird.co) ($0 Build Plan).
2. In your Tinybird Workspace -> Click **Add Data Source** -> **Apache Kafka**.
3. Enter Aiven Kafka Connection Details:
   - **Bootstrap Servers:** `HOST:PORT` from Aiven Kafka
   - **Security Protocol:** `SASL_SSL`
   - **SASL Mechanism:** `SCRAM-SHA-256`
   - **Username:** `avnadmin`
   - **Password:** `<Aiven Kafka Password>`
   - **Topic:** `mfilm.behavior.v1`
4. Tinybird will automatically detect the JSON payload schema.
5. Name the Data Source: `mfilm_behavior`.
6. Deploy the analytical pipes provided in `data-platform/tinybird/pipes/`.

---

## 7. Step 6: Cloudflare R2 Data Lake ($0 Free Allowance)

1. Sign up / Log in to [https://dash.cloudflare.com](https://dash.cloudflare.com) -> **R2**.
2. Click **Create bucket** -> Name: `mfilm-data-lake`.
3. Location: Automatic.
4. Under **Settings** -> **Lifecycle Rules**:
   - Add rule to transition objects older than 30 days or delete historical staging files to stay permanently under 10 GB.
5. Create R2 API Token with Object Read & Write permissions.

---

## 8. Step 7: Vercel Frontend Configuration

1. In the Vercel Dashboard for `Web-Film-Modern` -> **Settings** -> **Environment Variables**.
2. Add / Update:
   ```env
   VITE_API_BASE_URL=https://mfilm-api.onrender.com/api/v1
   VITE_BIGDATA_TELEMETRY_ENABLED=true
   ```
3. Redeploy the frontend. Telemetry events will now stream live to Render -> Aiven Kafka -> Tinybird!
