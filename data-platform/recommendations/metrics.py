"""
MFILM Recommendation Evaluation Metrics
Implements Precision@K, Recall@K, NDCG@K, and MAP@K.
"""

import math

def precision_at_k(recommended: list, relevant: set, k: int) -> float:
    """
    Precision@K = (# of recommended items in Top K that are relevant) / K
    """
    if k <= 0:
        return 0.0
    top_k = recommended[:k]
    hits = sum(1 for item in top_k if item in relevant)
    return hits / float(k)

def recall_at_k(recommended: list, relevant: set, k: int) -> float:
    """
    Recall@K = (# of recommended items in Top K that are relevant) / (# of total relevant items)
    """
    if not relevant or k <= 0:
        return 0.0
    top_k = recommended[:k]
    hits = sum(1 for item in top_k if item in relevant)
    return hits / float(len(relevant))

def dcg_at_k(recommended: list, relevant: set, k: int) -> float:
    """
    Discounted Cumulative Gain at K (binary relevance).
    DCG@K = sum_{i=1}^k (rel_i / log_2(i + 1))
    """
    dcg = 0.0
    for i, item in enumerate(recommended[:k]):
        if item in relevant:
            dcg += 1.0 / math.log2(i + 2) # i is 0-indexed, so rank = i + 1, denom = log2(rank + 1) = log2(i + 2)
    return dcg

def ndcg_at_k(recommended: list, relevant: set, k: int) -> float:
    """
    Normalized Discounted Cumulative Gain at K.
    NDCG@K = DCG@K / IDCG@K
    """
    dcg = dcg_at_k(recommended, relevant, k)
    ideal_hits = min(len(relevant), k)
    if ideal_hits == 0:
        return 0.0
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
    return dcg / idcg

def evaluate_recommendations(recommended_lists: dict, ground_truth: dict, k: int = 10) -> dict:
    """
    Computes average Precision@K, Recall@K, and NDCG@K across all test users.
    recommended_lists: { user_id: [item_1, item_2, ...] }
    ground_truth: { user_id: set([relevant_item_1, ...]) }
    """
    precisions = []
    recalls = []
    ndcgs = []

    for user_id, recs in recommended_lists.items():
        relevant = ground_truth.get(user_id, set())
        if not relevant:
            continue
        precisions.append(precision_at_k(recs, relevant, k))
        recalls.append(recall_at_k(recs, relevant, k))
        ndcgs.append(ndcg_at_k(recs, relevant, k))

    count = len(precisions) or 1
    return {
        f"Precision@{k}": round(sum(precisions) / count, 4),
        f"Recall@{k}": round(sum(recalls) / count, 4),
        f"NDCG@{k}": round(sum(ndcgs) / count, 4),
        "total_users_evaluated": len(precisions)
    }
