"""
MFILM Collaborative Filtering Recommender (Implicit Feedback ALS Model)
Constructs implicit interaction matrix from streaming events (views, watch_progress, completions).
"""

import math

def calculate_implicit_rating(
    views: int = 0,
    completion_ratio: float = 0.0,
    is_completed: bool = False,
    is_favorited: bool = False,
    explicit_rating: float = 0.0
) -> float:
    """
    Computes unified composite implicit score r_ui between user u and item i.
    Range: [0.0, 10.0]
    """
    score = 0.0
    # View interaction: base interest (weight 1.0)
    if views > 0:
        score += min(2.0, views * 0.5)

    # Watch progress ratio: strong indicator of engagement (weight 3.0)
    score += completion_ratio * 3.0

    # Finished the movie (weight 2.0)
    if is_completed:
        score += 2.0

    # Saved to favorites (weight 2.5)
    if is_favorited:
        score += 2.5

    # If explicit rating exists (0-10), blend it
    if explicit_rating > 0.0:
        score = (score * 0.6) + (explicit_rating * 0.4)

    return round(min(10.0, score), 3)

def compute_user_user_similarity(user1_ratings: dict, user2_ratings: dict) -> float:
    """
    Computes Pearson Correlation / Adjusted Cosine between two user rating profiles.
    """
    common_items = set(user1_ratings.keys()) & set(user2_ratings.keys())
    if len(common_items) < 2:
        return 0.0

    r1 = [user1_ratings[i] for i in common_items]
    r2 = [user2_ratings[i] for i in common_items]

    mean1 = sum(r1) / len(r1)
    mean2 = sum(r2) / len(r2)

    numerator = sum((user1_ratings[i] - mean1) * (user2_ratings[i] - mean2) for i in common_items)
    denominator = math.sqrt(sum((user1_ratings[i] - mean1)**2 for i in common_items)) * \
                  math.sqrt(sum((user2_ratings[i] - mean2)**2 for i in common_items))

    if denominator == 0.0:
        return 0.0

    return numerator / denominator

def predict_user_cf_ratings(target_user_id: str, all_user_ratings: dict, all_movies: list, top_k: int = 10) -> list:
    """
    User-based Collaborative Filtering predictor.
    """
    target_ratings = all_user_ratings.get(target_user_id, {})
    recommendations = []

    for movie in all_movies:
        movie_id = movie["id"]
        if movie_id in target_ratings:
            continue # already watched

        sim_sum = 0.0
        weighted_score_sum = 0.0

        for other_user_id, other_ratings in all_user_ratings.items():
            if other_user_id == target_user_id or movie_id not in other_ratings:
                continue

            sim = compute_user_user_similarity(target_ratings, other_ratings)
            if sim > 0:
                sim_sum += sim
                weighted_score_sum += sim * other_ratings[movie_id]

        if sim_sum > 0:
            pred_score = weighted_score_sum / sim_sum
            recommendations.append({
                "id": movie_id,
                "name": movie.get("name"),
                "predicted_score": round(pred_score, 3)
            })

    return sorted(recommendations, key=lambda x: x["predicted_score"], reverse=True)[:top_k]
