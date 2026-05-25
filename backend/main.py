import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from models import ChatRequest, ChatResponse
from chat import chat_with_user, get_opening_message
from mood_analyzer import enrich_mood_profile
from spotify import get_recommendations, generate_playlist_metadata
from database import connect_db, disconnect_db, save_session

load_dotenv()

# ─── In-memory session store ──────────────────────────────────────────────────
sessions: dict = {}


# ─── Lifespan (replaces deprecated on_event) ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="Moodify AI",
    description="Intelligent conversational music recommendation engine",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Moodify AI"}


@app.post("/api/session/new")
async def new_session():
    """Create a new chat session and return the opening message."""
    session_id = str(uuid.uuid4())
    sessions[session_id] = []
    opening = get_opening_message()
    sessions[session_id].append({
        "role": "assistant",
        "content": opening,
    })
    return {
        "session_id": session_id,
        "message": opening,
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message and receive Moodify's reply."""
    session_id = request.session_id

    if session_id not in sessions:
        sessions[session_id] = []

    history = sessions[session_id]

    try:
        reply, is_complete, mood_profile = chat_with_user(history, request.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # Update session history
    history.append({"role": "user", "content": request.message})
    history.append({"role": "assistant", "content": reply})
    sessions[session_id] = history

    if is_complete and mood_profile:
        # Enrich with ML classifier
        enriched = enrich_mood_profile(mood_profile)
        sessions[session_id + "_profile"] = enriched

        # Save to MongoDB
        await save_session(session_id, history, enriched)

        return ChatResponse(
            reply=reply,
            session_id=session_id,
            is_complete=True,
            mood_profile=enriched,
        )

    return ChatResponse(
        reply=reply,
        session_id=session_id,
        is_complete=False,
        mood_profile=None,
    )


@app.get("/api/recommendations/{session_id}")
async def recommendations(session_id: str, limit: int = 20):
    """Get Spotify track recommendations for a completed session."""
    profile = sessions.get(session_id + "_profile")
    if not profile:
        raise HTTPException(status_code=404, detail="Session not found or not complete.")

    tracks = get_recommendations(profile, limit=limit)
    meta = generate_playlist_metadata(profile)

    return {
        "mood_profile": profile,
        "tracks": tracks,
        **meta,
    }


@app.get("/api/mood/{session_id}")
async def get_mood_profile(session_id: str):
    """Get the mood profile for a session."""
    profile = sessions.get(session_id + "_profile")
    if not profile:
        raise HTTPException(status_code=404, detail="Mood profile not found.")
    return profile


@app.get("/callback")
async def spotify_callback(code: str = None, error: str = None):
    """Spotify OAuth callback (for future user-auth flows)."""
    if error:
        return {"error": error}
    return {"message": "Spotify connected!", "code": code}


# ─── Serve frontend ───────────────────────────────────────────────────────────
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

    @app.get("/")
    async def serve_frontend():
        return FileResponse(os.path.join(frontend_path, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
