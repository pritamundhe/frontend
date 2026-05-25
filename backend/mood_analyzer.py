import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.neighbors import KNeighborsClassifier
import json

# ─────────────────────────────────────────────────────────────────────────────
# Training data: [energy_level, stress_level, sentiment_score] → vibe_label
# sentiment_score: positive=1, neutral=0, negative=-1
# ─────────────────────────────────────────────────────────────────────────────
TRAINING_DATA = [
    # energy, stress, sentiment → vibe
    ([9, 2, 1],  "pump-up"),
    ([8, 3, 1],  "pump-up"),
    ([9, 1, 1],  "euphoric"),
    ([8, 1, 1],  "euphoric"),
    ([7, 4, 1],  "feel-good"),
    ([6, 3, 1],  "feel-good"),
    ([5, 2, 1],  "chill-happy"),
    ([4, 2, 1],  "chill-happy"),
    ([3, 1, 1],  "serene"),
    ([2, 1, 1],  "serene"),
    ([1, 1, 1],  "dreamy"),
    ([2, 2, 0],  "mellow"),
    ([3, 3, 0],  "mellow"),
    ([4, 4, 0],  "introspective"),
    ([5, 5, 0],  "introspective"),
    ([3, 7, -1], "melancholic"),
    ([2, 8, -1], "melancholic"),
    ([4, 6, -1], "somber"),
    ([5, 7, -1], "somber"),
    ([7, 8, -1], "angsty"),
    ([8, 9, -1], "angsty"),
    ([9, 9, -1], "intense"),
    ([6, 9, -1], "intense"),
    ([6, 6, 0],  "focused"),
    ([7, 5, 0],  "focused"),
    ([5, 3, 0],  "balanced"),
    ([4, 3, 1],  "balanced"),
    ([1, 2, 0],  "dreamy"),
    ([2, 3, -1], "lonely"),
    ([3, 4, -1], "lonely"),
]

# Genre mapping per vibe
VIBE_GENRE_MAP = {
    "pump-up":       ["hip-hop", "edm", "pop", "rap"],
    "euphoric":      ["edm", "dance", "pop", "electronic"],
    "feel-good":     ["pop", "funk", "soul", "indie-pop"],
    "chill-happy":   ["indie-pop", "acoustic", "neo-soul", "lo-fi"],
    "serene":        ["ambient", "classical", "acoustic", "new-age"],
    "dreamy":        ["dream-pop", "shoegaze", "ambient", "chillwave"],
    "mellow":        ["lo-fi", "chillhop", "acoustic", "indie"],
    "introspective": ["indie", "alternative", "folk", "singer-songwriter"],
    "melancholic":   ["sad indie", "folk", "blues", "piano"],
    "somber":        ["alternative", "post-rock", "darkwave", "folk"],
    "angsty":        ["rock", "alternative", "punk", "emo"],
    "intense":       ["metal", "hard-rock", "industrial", "punk"],
    "focused":       ["lo-fi", "classical", "ambient", "jazz"],
    "balanced":      ["pop", "indie", "r&b", "alternative"],
    "lonely":        ["sad-songs", "folk", "piano", "blues"],
}

# Tempo mapping per vibe
VIBE_TEMPO_MAP = {
    "pump-up":       "high-energy",
    "euphoric":      "high-energy",
    "feel-good":     "upbeat",
    "chill-happy":   "mid",
    "serene":        "slow",
    "dreamy":        "slow",
    "mellow":        "slow",
    "introspective": "mid",
    "melancholic":   "slow",
    "somber":        "slow",
    "angsty":        "upbeat",
    "intense":       "high-energy",
    "focused":       "mid",
    "balanced":      "mid",
    "lonely":        "slow",
}


class MoodClassifier:
    def __init__(self):
        X = [d[0] for d in TRAINING_DATA]
        y = [d[1] for d in TRAINING_DATA]

        self.le = LabelEncoder()
        y_encoded = self.le.fit_transform(y)

        self.model = KNeighborsClassifier(n_neighbors=3, metric='euclidean')
        self.model.fit(X, y_encoded)

    def predict_vibe(self, energy: int, stress: int, sentiment: str) -> dict:
        """Predict music vibe from mood parameters."""
        sentiment_map = {"positive": 1, "neutral": 0, "negative": -1}
        sentiment_score = sentiment_map.get(sentiment.lower(), 0)

        features = np.array([[energy, stress, sentiment_score]])
        pred_encoded = self.model.predict(features)[0]
        vibe = self.le.inverse_transform([pred_encoded])[0]

        # Get confidence via distances
        distances, _ = self.model.kneighbors(features)
        avg_dist = np.mean(distances[0])
        confidence = max(0.5, 1.0 - (avg_dist / 15.0))

        return {
            "vibe": vibe,
            "genres": VIBE_GENRE_MAP.get(vibe, ["pop", "indie"]),
            "tempo": VIBE_TEMPO_MAP.get(vibe, "mid"),
            "ml_confidence": round(confidence, 2),
        }


# Singleton instance
_classifier = None


def get_classifier() -> MoodClassifier:
    global _classifier
    if _classifier is None:
        _classifier = MoodClassifier()
    return _classifier


def enrich_mood_profile(profile: dict) -> dict:
    """Use ML to enrich/validate the mood profile from GPT."""
    clf = get_classifier()

    energy = int(profile.get("energy_level", 5))
    stress = int(profile.get("stress_level", 5))
    sentiment = profile.get("sentiment", "neutral")

    ml_result = clf.predict_vibe(energy, stress, sentiment)

    # Merge ML insights with GPT profile (GPT takes priority on genres if confident)
    if profile.get("confidence_score", 0) < 0.7:
        profile["preferred_genres"] = ml_result["genres"]
        profile["preferred_tempo"] = ml_result["tempo"]

    if not profile.get("recommended_vibe"):
        profile["recommended_vibe"] = ml_result["vibe"]

    # Boost confidence score using ML
    gpt_conf = float(profile.get("confidence_score", 0.7))
    ml_conf = ml_result["ml_confidence"]
    profile["confidence_score"] = round((gpt_conf + ml_conf) / 2, 2)

    return profile
