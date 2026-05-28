import os

# Fix broken system CA bundle environment variables
os.environ.pop("CURL_CA_BUNDLE", None)
os.environ.pop("REQUESTS_CA_BUNDLE", None)

import spotipy
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from dotenv import load_dotenv
from typing import List, Optional

load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "https://backend-production-49f37.up.railway.app/callback")

# ─────────────────────────────────────────────────────────────────────────────
# Genre → Spotify seed genres mapping
# ─────────────────────────────────────────────────────────────────────────────
GENRE_SEED_MAP = {
    "hip-hop":            "hip-hop",
    "edm":                "edm",
    "pop":                "pop",
    "rap":                "hip-hop",
    "dance":              "dance",
    "electronic":         "electronic",
    "funk":               "funk",
    "soul":               "soul",
    "indie-pop":          "indie",
    "acoustic":           "acoustic",
    "neo-soul":           "soul",
    "lo-fi":              "chill",
    "ambient":            "ambient",
    "classical":          "classical",
    "new-age":            "new-age",
    "dream-pop":          "indie",
    "shoegaze":           "alternative",
    "chillwave":          "chill",
    "chillhop":           "chill",
    "indie":              "indie",
    "alternative":        "alternative",
    "folk":               "folk",
    "singer-songwriter":  "singer-songwriter",
    "sad indie":          "indie",
    "blues":              "blues",
    "piano":              "classical",
    "post-rock":          "rock",
    "darkwave":           "goth",
    "rock":               "rock",
    "punk":               "punk",
    "emo":                "emo",
    "metal":              "metal",
    "hard-rock":          "hard-rock",
    "industrial":         "industrial",
    "jazz":               "jazz",
    "r&b":                "r-n-b",
    "sad-songs":          "sad",
    "sad":                "sad",
}

TEMPO_TARGET_MAP = {
    "slow":        {"min_tempo": 60,  "max_tempo": 90,  "target_tempo": 75},
    "mid":         {"min_tempo": 90,  "max_tempo": 120, "target_tempo": 105},
    "upbeat":      {"min_tempo": 120, "max_tempo": 150, "target_tempo": 130},
    "high-energy": {"min_tempo": 140, "max_tempo": 200, "target_tempo": 160},
}

ENERGY_VALENCE_MAP = {
    "pump-up":       {"energy": 0.9, "valence": 0.8},
    "euphoric":      {"energy": 0.85, "valence": 0.9},
    "feel-good":     {"energy": 0.7, "valence": 0.8},
    "chill-happy":   {"energy": 0.45, "valence": 0.7},
    "serene":        {"energy": 0.25, "valence": 0.65},
    "dreamy":        {"energy": 0.2, "valence": 0.55},
    "mellow":        {"energy": 0.35, "valence": 0.5},
    "introspective": {"energy": 0.4, "valence": 0.4},
    "melancholic":   {"energy": 0.3, "valence": 0.2},
    "somber":        {"energy": 0.35, "valence": 0.25},
    "angsty":        {"energy": 0.75, "valence": 0.3},
    "intense":       {"energy": 0.9, "valence": 0.35},
    "focused":       {"energy": 0.5, "valence": 0.45},
    "balanced":      {"energy": 0.55, "valence": 0.55},
    "lonely":        {"energy": 0.25, "valence": 0.2},
}


def get_spotify_client() -> Optional[spotipy.Spotify]:
    """Get Spotify client using client credentials (no user login needed for recommendations)."""
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        return None
    try:
        auth_manager = SpotifyClientCredentials(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
        )
        return spotipy.Spotify(auth_manager=auth_manager)
    except Exception as e:
        print(f"[Spotify] Client error: {e}")
        return None


def get_seed_genres(preferred_genres: List[str]) -> List[str]:
    """Map user-friendly genres to valid Spotify seed genres (max 5)."""
    seeds = []
    for g in preferred_genres:
        mapped = GENRE_SEED_MAP.get(g.lower(), None)
        if mapped and mapped not in seeds:
            seeds.append(mapped)
        if len(seeds) >= 5:
            break
    return seeds[:5] if seeds else ["pop"]


def get_recommendations(mood_profile: dict, limit: int = 20) -> List[dict]:
    """Fetch Spotify track recommendations based on mood profile."""
    sp = get_spotify_client()
    if not sp:
        return []

    vibe = mood_profile.get("recommended_vibe", "balanced")
    tempo_key = mood_profile.get("preferred_tempo", "mid")
    genres = mood_profile.get("preferred_genres", ["pop"])

    seed_genres = get_seed_genres(genres)
    tempo_params = TEMPO_TARGET_MAP.get(tempo_key, TEMPO_TARGET_MAP["mid"])
    ev_params = ENERGY_VALENCE_MAP.get(vibe, {"energy": 0.55, "valence": 0.55})

    try:
        import random
        
        # If the AI provided specific search keywords (e.g. artist, subgenre, track), use that.
        search_keywords = mood_profile.get("search_keywords", "")
        if search_keywords:
            query = search_keywords
        else:
            query_parts = []
            if seed_genres:
                # We can search by multiple genres using OR
                query_parts.append(" OR ".join([f"genre:{g}" for g in seed_genres[:2]]))
            else:
                query_parts.append("genre:pop")
                
            # We rely primarily on genre to ensure reliable search results
            # as appending free text moods often breaks the Spotify search API
            query = " ".join(query_parts)
        
        results = sp.search(q=query, type="track", limit=10)
        items = results.get("tracks", {}).get("items", [])
        
        # If the specific mood + genre query returns nothing, fallback to just genre
        if not items and seed_genres:
            query = f"genre:{seed_genres[0]}"
            results = sp.search(q=query, type="track", limit=10)
            items = results.get("tracks", {}).get("items", [])
            
        # Shuffle to get variety
        random.shuffle(items)
        
        tracks = []
        for t in items[:limit]:
            track_data = {
                "id": t["id"],
                "name": t["name"],
                "artist": ", ".join(a["name"] for a in t["artists"]),
                "album": t["album"]["name"],
                "preview_url": t.get("preview_url"),
                "external_url": t["external_urls"].get("spotify", ""),
                "image_url": t["album"]["images"][0]["url"] if t.get("album", {}).get("images") else None,
                "duration_ms": t["duration_ms"],
                "popularity": t.get("popularity", 50),
            }
            tracks.append(track_data)

        return tracks

    except Exception as e:
        print(f"[Spotify] Recommendations error: {e}")
        return []


def generate_playlist_metadata(mood_profile: dict) -> dict:
    """Generate a creative playlist title and description."""
    vibe = mood_profile.get("recommended_vibe", "balanced")
    mood = mood_profile.get("primary_mood", "")
    activity = mood_profile.get("activity", "")
    summary = mood_profile.get("emotional_state_summary", "")

    title_map = {
        "pump-up":       "🔥 Full Send Mode",
        "euphoric":      "✨ Cloud Nine Playlist",
        "feel-good":     "😊 Good Vibes Only",
        "chill-happy":   "🌻 Sunny Side Up",
        "serene":        "🌊 Still Waters",
        "dreamy":        "🌙 Somewhere Between Awake & Asleep",
        "mellow":        "🍵 Slow Mornings",
        "introspective": "🔍 Deep in Thought",
        "melancholic":   "🌧️ Beautiful Sadness",
        "somber":        "🖤 Heavy Hearts",
        "angsty":        "⚡ Restless Energy",
        "intense":       "🎸 No Half Measures",
        "focused":       "🎯 In the Zone",
        "balanced":      "⚖️ Just Right",
        "lonely":        "🕯️ Quiet Company",
    }

    title = title_map.get(vibe, f"🎵 Your {mood.title()} Playlist")
    description = f"Curated for your {mood} mood • {activity.title() if activity else 'Right now'} • {summary}"

    return {
        "playlist_title": title,
        "playlist_description": description[:200],
    }
