# MFILM Cloudflare R2 Data Lake Architecture & Partitioning

## 1. Overview

Cloudflare R2 provides zero-egress-fee S3-compatible object storage. Under the **Standard Free Allowance**, MFILM receives:
- **10 GB / month** of stored data.
- **1,000,000 Class A operations / month** (writes, lists).
- **10,000,000 Class B operations / month** (reads).

This document details the lakehouse partitioning design to guarantee MFILM remains permanently within free limits.

---

## 2. Directory & Partition Hierarchy

```
mfilm-data-lake/
├── raw/
│   └── event_date=YYYY-MM-DD/
│       ├── event_type=play/
│       │   └── part-0000.parquet
│       ├── event_type=watch_progress/
│       │   └── part-0000.parquet
│       └── event_type=complete/
│           └── part-0000.parquet
│
├── processed/
│   ├── sessions/
│   │   └── date=YYYY-MM-DD/
│   │       └── session_summary.parquet
│   └── user_features/
│       └── date=YYYY-MM-DD/
│           └── user_affinity_vectors.parquet
│
└── models/
    └── als_factors/
        ├── user_factors.parquet
        └── item_factors.parquet
```

---

## 3. Storage Optimization & Quota Protection

### A. Micro-Batch Aggregation before Upload
- Direct row-by-row writing to S3 creates millions of tiny objects and quickly exhausts Class A write quotas.
- **Rule**: Parquet export jobs aggregate streaming events into batches of at least **5 MB to 15 MB per file** before pushing to R2.
- At 10,000 events/hour (~2.5 MB compressed Parquet), MFILM uploads only **24 files/day (720 writes/month)**, consuming less than **0.1% of the 1,000,000 free Class A operations**.

### B. Lifecycle Retention Policy
- In Cloudflare R2 Bucket Settings -> **Lifecycle Rules**:
  - `Prefix: raw/` -> **Delete objects after 30 days**.
  - Historical aggregates and feature vectors in `processed/` are retained for 180 days.
- Total active storage footprint is maintained under **4 GB to 6 GB**, well below the 10 GB free ceiling.
