# MFILM Big Data Use Cases Specification

## 1. Overview

By capturing high-resolution streaming telemetry into Kafka, MinIO, and ClickHouse, MFILM unlocks five enterprise-grade Big Data capabilities.

---

## 2. Use Case 1: Real-Time Trending & Popularity Tracking

### Objective
Identify viral movies, trending genres, and sudden surges in viewer interest within minutes rather than waiting for nightly batch jobs.

### Data Inputs
- `movie_view`, `play`, `complete`, `search`, `favorite`.

### Processing Engine
- **ClickHouse Materialized Views** & **PySpark Sliding Window** (15-minute sliding window with 1-minute slide).

### Trending Velocity Formula
$$V(m, t) = \frac{\Delta \text{Plays}_{15m} \times 2.0 + \Delta \text{Completes}_{15m} \times 4.0 + \Delta \text{Searches}_{15m} \times 1.0}{\max(1, \text{HistoricalAvg}_{24h})}$$

### Output & Serving
- ClickHouse table `mfilm_analytics.hourly_movie_stats`.
- Cached in Redis key `mfilm:trending:top20` (TTL 60 seconds).
- Consumed by Frontend Homepage "🔥 Thịnh Hành" banner and ranking carousels.

---

## 3. Use Case 2: Streaming Session Analytics & Quality of Experience (QoE)

### Objective
Measure user playback experience, detect CDN degradation, identify buffering bottlenecks, and analyze video drop-off curves.

### Key Metrics
1. **Buffering Ratio**:
   $$\text{BufferRatio} = \frac{\sum \text{Duration}(\text{buffer\_end} - \text{buffer\_start})}{\text{Total Session Watch Time}}$$
   *Threshold*: Alert triggered if BufferRatio > 3% across any CDN node or geographic region.
2. **Video Drop-off Curve**:
   Aggregate histogram of `seek` and `pause` events binned by 5% increments of movie runtime to identify scenes where viewers lose interest.
3. **Completion Rate**:
   Percentage of sessions reaching `progress / duration \ge 90\%`.

### Output & Serving
- Prometheus counters for active streams, buffer events, and average bitrates.
- Grafana dashboard: "MFILM Streaming QoE & Operations Monitor".

---

## 4. Use Case 3: User Profiling & Behavioral Segmentation

### Objective
Construct dynamic 360-degree user profiles to drive personalization, CRM campaigns, and VIP conversion.

### Profile Attributes
- **Genre Affinity Vector**: 20-dimensional normalized vector representing user interest in Action, Romance, Anime, Horror, etc., updated on every watch session with exponential time decay ($\lambda = 0.05$ per day).
- **Viewing Rhythm**: Peak hours (Morning, Afternoon, Evening, Late Night), weekend vs weekday affinity.
- **RFM Customer Segmentation**:
  - *Recency*: Days since last active session.
  - *Frequency*: Total streaming sessions per month.
  - *Monetary*: VIP subscription spend and movie rental payments.
- **Churn Risk Indicator**: High-risk flag if active days drop > 50% over a 14-day rolling window.

---

## 5. Use Case 4: Enterprise Recommendation System

### Objective
Deliver personalized movie suggestions on Home, Detail, and Post-Watch screens.

### Multi-Stage Pipeline
```
[Catalog: 10,000+ Movies]
          │
          ▼ Candidate Retrieval (Recall ~200 items)
   ┌───────────────┬───────────────────┬───────────────────┐
   │ Popularity    │ Content-Based     │ ALS Collaborative │
   │ Baseline      │ Cosine Similarity │ Filtering         │
   └───────────────┴───────────────────┴───────────────────┘
          │
          ▼ Scoring & Ranking (Scored 0.0 - 1.0)
     Hybrid Weighted Model + Contextual Session Boost
          │
          ▼ Diversity & Business Filters
   Remove already watched, exclude unsubscribed VIP locks (if client filter enabled)
          │
          ▼ Top 10 - 20 Ranked Recommendations
```

---

## 6. Use Case 5: Anomaly Detection & Anti-Piracy Protection

### Objective
Protect MFILM revenue and streaming infrastructure from abuse, account sharing, and scraping bots.

### Detection Scenarios
1. **Account Sharing & Credential Stuffing**:
   - *Rule*: Same `userId` active across $\ge 3$ distinct geographic IPs or IP subnets within a 10-minute window.
   - *Action*: Trigger security verification email and invalidate old refresh token.
2. **Scraping & Stream Ripping Bots**:
   - *Pattern*: Rapid sequential seek events jumping through full video duration in < 30 seconds without real-time playback intervals.
   - *Action*: Rate limit or temporary IP block via Redis sliding window counter.
3. **Payment & Rent Fraud**:
   - High velocity of failed PayPal or card transactions followed by rapid retries.
