"""
MFILM Popularity Baseline Recommender
Implements Time-Decayed Popularity Score & Wilson Score Interval.
"""

import math
import time

def wilson_score(positive_votes: int, total_votes: int, confidence: float = 0.95) -> float:
    """
    Computes lower bound of Wilson score confidence interval for a Bernoulli parameter.
    Ideal for ranking movies by upvotes / positive completions.
    """
    if total_votes <= 0:
        return 0.0

    # z = 1.96 for 95% confidence
    z = 1.96 if confidence == 0.95 else 1.64
    phat = 1.0 * positive_votes / total_votes
    denominator = 1 + z**2 / total_votes
    numerator = phat + z**2 / (2 * total_votes) - z * math.sqrt((phat * (1 - phat) + z**2 / (4 * total_votes)) / total_votes)
    return max(0.0, numerator / denominator)

def calculate_decayed_popularity(
    views: int,
    completes: int,
    favorites: int,
    release_timestamp: float,
    half_life_days: float = 7.0
) -> float:
    """
    Computes decaying popularity with half-life decay.
    Raw engagement score = (views * 1.0) + (completes * 3.0) + (favorites * 5.0)
    Decay = 2 ^ (-delta_days / half_life_days)
    """
    now = time.time()
    delta_days = max(0.0, (now - release_timestamp) / 86400.0)
    decay_factor = math.pow(0.5, delta_days / half_life_days)

    raw_score = (views * 1.0) + (completes * 3.0) + (favorites * 5.0)
    return raw_score * decay_factor

def rank_top_popular_movies(movies_stats: list, top_k: int = 10) -> list:
    """
    Ranks list of movie stats dicts by decayed popularity.
    """
    scored = []
    for m in movies_stats:
        score = calculate_decayed_popularity(
            views=m.get("views", 0),
            completes=m.get("completes", 0),
            favorites=m.get("favorites", 0),
            release_timestamp=m.get("release_timestamp", time.time())
        )
        scored.append({**m, "popularity_score": round(score, 4)})

    return sorted(scored, key=lambda x: x["popularity_score"], reverse=True)[:top_k]
