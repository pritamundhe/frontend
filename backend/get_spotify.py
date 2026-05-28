import json
import os
import sys

# Add backend path just in case
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from spotify import get_recommendations

mood_profile = {
  "primary_mood": "focused",
  "secondary_mood": "calm",
  "energy_level": 5,
  "stress_level": 3,
  "sentiment": "neutral",
  "activity": "studying",
  "preferred_genres": [
    "classical",
    "instrumental"
  ],
  "preferred_tempo": "slow",
  "recommended_vibe": "gentle focus",
  "emotional_state_summary": "You are in a balanced and focused state, looking for soft instrumental music to enhance concentration.",
  "search_keywords": "Hans Zimmer Interstellar",
  "confidence_score": 0.92
}

try:
    tracks = get_recommendations(mood_profile, limit=5)
    if not tracks:
        print("No tracks found or Spotify connection failed.")
    for i, t in enumerate(tracks):
        print(f"{i+1}. {t['name']} by {t['artist']}\n   Link: {t['external_url']}\n")
except Exception as e:
    print("Error:", e)
