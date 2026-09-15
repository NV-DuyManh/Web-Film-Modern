"""
MFILM Hybrid Recommendation Engine
Blends Popularity Baseline, Content-Based Similarity, Collaborative Filtering,
and Real-time Session Context into a single unified ranking score.
"""

def hybrid_rank(
    user_id: str,
    candidate_movies: list,
    popularity_scores: dict,       # movieId -> score [0, 1]
    content_scores: dict,          # movieId -> score [0, 1]
    collaborative_scores: dict,    # movieId -> score [0, 1]
    recent_session_genres: list,   # list of genres clicked in current session
    weights: dict = None,
    top_k: int = 10
) -> list:
    """
    Computes final hybrid score:
    Score(u, i) = w_cf * S_cf + w_content * S_content + w_pop * S_pop + w_session * Boost
    """
    if weights is None:
        weights = {
            "collaborative": 0.45,
            "content": 0.30,
            "popularity": 0.15,
            "session_boost": 0.10,
        }

    scored_items = []

    for movie in candidate_movies:
        mid = movie["id"]

        s_cf = collaborative_scores.get(mid, 0.0)
        s_content = content_scores.get(mid, 0.0)
        s_pop = popularity_scores.get(mid, 0.0)

        # Session boost if movie matches user's active session genres
        session_match = 0.0
        movie_genres = [g.lower() for g in movie.get("categories", [])]
        if any(g.lower() in movie_genres for g in recent_session_genres):
            session_match = 1.0

        final_score = (
            weights["collaborative"] * s_cf +
            weights["content"] * s_content +
            weights["popularity"] * s_pop +
            weights["session_boost"] * session_match
        )

        scored_items.append({
            "id": mid,
            "name": movie.get("name"),
            "final_score": round(final_score, 4),
            "breakdown": {
                "collaborative": round(s_cf, 3),
                "content": round(s_content, 3),
                "popularity": round(s_pop, 3),
                "session_boost": round(session_match, 1),
            }
        })

    return sorted(scored_items, key=lambda x: x["final_score"], reverse=True)[:top_k]
