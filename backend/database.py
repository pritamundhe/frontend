import os
import motor.motor_asyncio
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
client = None
db = None


async def connect_db():
    global client, db
    if MONGODB_URI:
        try:
            client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
            db = client["moodify"]
            print("[MongoDB] Connected successfully.")
        except Exception as e:
            print(f"[MongoDB] Connection failed: {e}")
    else:
        print("[MongoDB] No URI provided — skipping DB connection.")


async def disconnect_db():
    global client
    if client:
        client.close()
        print("[MongoDB] Disconnected.")


async def save_session(session_id: str, history: list, mood_profile: dict):
    """Save a completed mood session to MongoDB."""
    if db is None:
        return
    try:
        doc = {
            "session_id": session_id,
            "history": history,
            "mood_profile": mood_profile,
            "created_at": datetime.utcnow(),
        }
        await db["sessions"].insert_one(doc)
        print(f"[MongoDB] Session {session_id} saved.")
    except Exception as e:
        print(f"[MongoDB] Save error: {e}")


async def get_session(session_id: str):
    """Retrieve a session by ID."""
    if db is None:
        return None
    try:
        return await db["sessions"].find_one({"session_id": session_id})
    except Exception as e:
        print(f"[MongoDB] Get session error: {e}")
        return None
