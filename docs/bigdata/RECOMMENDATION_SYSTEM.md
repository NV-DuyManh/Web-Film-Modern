# MFILM Recommendation System Architecture & Algorithms

## 1. Overview

The MFILM Recommendation System employs a multi-tiered architecture that balances relevance, diversity, and real-time responsiveness.

```
       User Context (Session, History, Device)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. CANDIDATE GENERATION (Recall Phase: 200 items)           │
│  - Popularity Baseline (Top trending, decaying popularity)  │
│  - Content-Based Filtering (Genre, cast, synopsis cosine)   │
│  - Collaborative Filtering (ALS implicit matrix factor)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. RANKING & SCORING (Precision Phase: Top 20 items)        │
│  - Hybrid Weighted Blending                                 │
│  - Real-time Session Contextual Boosting                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. BUSINESS RE-RANKING & DIVERSITY FILTER                   │
│  - Deduplication against Watch History                      │
│  - Genre Diversity Enforcement (Max 3 per genre in Top 10)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Algorithm 1: Time-Decayed Popularity Baseline

Designed for new visitors (cold-start users) and homepage general browsing.

### Mathematical Formulation
$$S_{\text{pop}}(m) = \text{Score}_{\text{raw}}(m) \times 2^{-\frac{t_{\text{now}} - t_{\text{release}}}{T_{\text{half}}}}$$

Where:
$$\text{Score}_{\text{raw}}(m) = 1.0 \times \text{views} + 3.0 \times \text{completes} + 5.0 \times \text{favorites}$$
- $T_{\text{half}}$: Half-life decay parameter (default = 7 days).

### Wilson Score Interval for Ratings
For movies with mixed ratings:
$$\text{Score}_{\text{wilson}} = \frac{\hat{p} + \frac{z^2}{2n} - z \sqrt{\frac{\hat{p}(1-\hat{p}) + z^2/4n}{n}}}{1 + z^2/n}$$
With $z = 1.96$ (95% confidence).

---

## 3. Algorithm 2: Content-Based Filtering

Recommends titles similar to movies the user recently enjoyed, based on metadata vectors.

### Feature Representation
Each movie $m$ is represented as a weighted sparse vector $\vec{v}_m$:
- Category / Genre tokens: weight $w_g = 3.0$
- Actor tokens: weight $w_a = 2.0$
- Country tokens: weight $w_c = 1.5$
- Synopsis TF-IDF tokens: weight $w_s = 1.0$

### Similarity Metric (Cosine Similarity)
$$\text{Sim}_{\text{content}}(m_i, m_j) = \frac{\vec{v}_{m_i} \cdot \vec{v}_{m_j}}{\|\vec{v}_{m_i}\| \|\vec{v}_{m_j}\|} = \frac{\sum_{k} v_{ik} v_{jk}}{\sqrt{\sum_k v_{ik}^2} \sqrt{\sum_k v_{jk}^2}}$$

---

## 4. Algorithm 3: Collaborative Filtering via Implicit ALS

Users rarely rate movies explicitly (1-10 stars); instead, engagement is captured implicitly via streaming events.

### Implicit Interaction Formulation
For user $u$ and movie $i$, preference $p_{ui}$ and confidence $c_{ui}$ are computed as:
$$p_{ui} = \begin{cases} 1 & \text{if } r_{ui} > 0 \\ 0 & \text{if } r_{ui} = 0 \end{cases}$$
$$c_{ui} = 1 + \alpha r_{ui}$$
Where composite implicit engagement $r_{ui}$ is:
$$r_{ui} = 0.5 \times \text{views} + 3.0 \times \left(\frac{\text{progress}}{\text{duration}}\right) + 2.0 \times \text{complete} + 2.5 \times \text{favorite}$$

### Loss Function
$$\mathcal{L}_{\text{ALS}} = \sum_{u, i} c_{ui} (p_{ui} - x_u^T y_i)^2 + \lambda \left(\sum_u \|x_u\|^2 + \sum_i \|y_i\|^2\right)$$
Solved iteratively by alternating updates between user factor vectors $x_u \in \mathbb{R}^d$ and item factor vectors $y_i \in \mathbb{R}^d$ ($d=64$, $\lambda=0.05$).

---

## 5. Algorithm 4: Hybrid Ranking Model

Blends the candidate scores with real-time contextual features:
$$\text{Score}_{\text{hybrid}}(u, m) = w_{\text{cf}} S_{\text{cf}}(u, m) + w_{\text{content}} S_{\text{content}}(u, m) + w_{\text{pop}} S_{\text{pop}}(m) + w_{\text{session}} \text{Boost}(m)$$

Default Weights:
- $w_{\text{cf}} = 0.45$ (Collaborative Filtering)
- $w_{\text{content}} = 0.30$ (Content-Based)
- $w_{\text{pop}} = 0.15$ (Global Popularity)
- $w_{\text{session}} = 0.10$ (Active Session Clicked Genre Boost)

---

## 6. Evaluation Metrics & Benchmarks

The recommendation system is benchmarked using standard offline metrics on held-out test sessions:

### 1. Precision@K
$$\text{Precision}@K = \frac{|\text{Recommended}_K \cap \text{Relevant}|}{K}$$

### 2. Recall@K
$$\text{Recall}@K = \frac{|\text{Recommended}_K \cap \text{Relevant}|}{|\text{Relevant}|}$$

### 3. Normalized Discounted Cumulative Gain (NDCG@K)
$$\text{DCG}@K = \sum_{i=1}^K \frac{2^{\text{rel}_i} - 1}{\log_2(i + 1)}, \quad \text{NDCG}@K = \frac{\text{DCG}@K}{\text{IDCG}@K}$$

### Target Performance Targets for MFILM:
- **Precision@10**: $\ge 0.18$ (at least ~2 out of 10 recommended movies watched)
- **Recall@10**: $\ge 0.32$
- **NDCG@10**: $\ge 0.42$
- **P95 Latency**: $\le 15\text{ms}$ when served from Redis recommendation cache.
