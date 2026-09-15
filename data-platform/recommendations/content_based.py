"""
MFILM Content-Based Recommender
Computes Cosine Similarity across Genres, Actors, Authors, and Movie Descriptions.
"""

import math
from collections import Counter

def tokenize(text: str) -> list:
    if not text:
        return []
    # Basic lowercased tokenization
    return [w.strip().lower() for w in text.replace(",", " ").replace(".", " ").split() if len(w.strip()) > 1]

def build_movie_profile(movie: dict) -> Counter:
    """
    Creates a weighted bag-of-features vector for a movie.
    Categories have weight 3.0, Actors weight 2.0, Country weight 1.5, Description words weight 1.0.
    """
    profile = Counter()

    for cat in movie.get("categories", []):
        profile[f"cat:{cat.lower()}"] += 3.0

    for actor in movie.get("actors", []):
        profile[f"act:{actor.lower()}"] += 2.0

    country = movie.get("country")
    if country:
        profile[f"country:{country.lower()}"] += 1.5

    for word in tokenize(movie.get("description", "")):
        profile[f"desc:{word}"] += 1.0

    return profile

def cosine_similarity(vec1: Counter, vec2: Counter) -> float:
    """
    Computes cosine similarity between two sparse Counter vectors.
    """
    intersection = set(vec1.keys()) & set(vec2.keys())
    if not intersection:
        return 0.0

    dot_product = sum(vec1[x] * vec2[x] for x in intersection)
    norm1 = math.sqrt(sum(val**2 for val in vec1.values()))
    norm2 = math.sqrt(sum(val**2 for val in vec2.values()))

    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0

    return dot_product / (norm1 * norm2)

def recommend_similar_movies(target_movie_id: str, all_movies: list, top_k: int = 10) -> list:
    """
    Finds top_k most similar movies to target_movie_id.
    """
    target = next((m for m in all_movies if m["id"] == target_movie_id), None)
    if not target:
        return []

    target_profile = build_movie_profile(target)
    similarities = []

    for movie in all_movies:
        if movie["id"] == target_movie_id:
            continue
        movie_profile = build_movie_profile(movie)
        sim = cosine_similarity(target_profile, movie_profile)
        similarities.append({
            "id": movie["id"],
            "name": movie.get("name"),
            "similarity": round(sim, 4),
        })

    return sorted(similarities, key=lambda x: x["similarity"], reverse=True)[:top_k]
