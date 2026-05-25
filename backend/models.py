from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    is_complete: bool = False
    mood_profile: Optional[dict] = None


class MoodProfile(BaseModel):
    primary_mood: str
    secondary_mood: str
    energy_level: int
    stress_level: int
    sentiment: str
    activity: str
    preferred_genres: List[str]
    preferred_tempo: str
    recommended_vibe: str
    emotional_state_summary: str
    confidence_score: float


class SpotifyTrack(BaseModel):
    id: str
    name: str
    artist: str
    album: str
    preview_url: Optional[str]
    external_url: str
    image_url: Optional[str]
    duration_ms: int
    popularity: int


class RecommendationResponse(BaseModel):
    mood_profile: MoodProfile
    tracks: List[SpotifyTrack]
    playlist_title: str
    playlist_description: str
