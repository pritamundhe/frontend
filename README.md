<<<<<<< HEAD
# 🎵 VibeflowAI — Conversational Music Recommendation Engine

> An emotionally intelligent AI that chats with you, reads your vibe, and curates the perfect Spotify playlist.

---

## ✨ Features

- 💬 **Natural Conversation** — VibeflowAI talks with you like a friend, not a survey
- 🧠 **GPT-4o Powered** — Deep emotional understanding from your words
- 🤖 **Scikit-learn ML** — KNN classifier enriches mood → music vibe mapping
- 🎧 **Spotify Integration** — Real track recommendations via Spotify Web API
- 🎵 **30s Audio Previews** — Listen before you commit
- 📊 **Mood Dashboard** — Visual energy/stress metrics and genre tags
- 💾 **MongoDB Sessions** — Persist conversation history and mood profiles

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `backend/.env`:

```env
OPENAI_API_KEY=your_openai_key
MONGODB_URI=your_mongodb_connection_string
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback
```

### 3. Run the Backend

```bash
cd backend
python main.py
```

The server starts at **http://localhost:8000**  
The frontend is served at **http://localhost:8000/**

---

## 🎵 Spotify Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add this **Redirect URI**: `http://localhost:8000/callback`
4. Select **Web API** 
5. Copy your `Client ID` and `Client Secret` → paste into `.env`

---

## 🏗️ Architecture

```
VibeflowAI/
├── backend/
│   ├── main.py          # FastAPI app + all routes
│   ├── chat.py          # OpenAI GPT-4o conversation engine
│   ├── mood_analyzer.py # Scikit-learn KNN mood classifier
│   ├── spotify.py       # Spotify Web API recommendations
│   ├── database.py      # MongoDB session storage (Motor async)
│   ├── models.py        # Pydantic schemas
│   └── requirements.txt
└── frontend/
    ├── index.html       # Full SPA (Landing → Chat → Results)
    ├── styles.css       # Premium dark UI + animations
    └── app.js           # Conversation + track rendering logic
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/session/new` | Start new chat session |
| `POST` | `/api/chat` | Send message, get AI reply |
| `GET`  | `/api/recommendations/{session_id}` | Get Spotify tracks |
| `GET`  | `/api/mood/{session_id}` | Get mood profile JSON |
| `GET`  | `/callback` | Spotify OAuth callback |
| `GET`  | `/health` | Health check |

---

## 🧠 Mood Profile Output

```json
{
  "primary_mood": "melancholic",
  "secondary_mood": "introspective",
  "energy_level": 3,
  "stress_level": 6,
  "sentiment": "negative",
  "activity": "late-night studying",
  "preferred_genres": ["indie", "folk", "piano"],
  "preferred_tempo": "slow",
  "recommended_vibe": "Beautiful Sadness",
  "emotional_state_summary": "Feeling quietly overwhelmed but finding beauty in the stillness.",
  "confidence_score": 0.87
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Python |
| AI Conversation | OpenAI GPT-4o |
| ML Classification | Scikit-learn (KNN) |
| Music API | Spotify Web API (Spotipy) |
| Database | MongoDB (Motor async) |
| Frontend | Vanilla HTML/CSS/JS |

---

## 📝 Notes

- The Spotify **Client Credentials** flow is used (no user login required for recommendations)
- Sessions are stored in-memory during runtime + persisted to MongoDB if configured
- The ML classifier enriches GPT's output when confidence is below 0.7
=======
# VibeflowAI
>>>>>>> 7895f8aa02f81e42b825419fe4004fd28cb0510e
