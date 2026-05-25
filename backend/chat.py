import os
import json
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are Moodify AI — a warm, emotionally intelligent music companion. Your goal is to have a natural, flowing 2-minute conversation to deeply understand the user's current mood, energy, and vibe, then recommend the perfect music experience.

CONVERSATION RULES:
- Be warm, empathetic, and human. Never sound robotic.
- Never ask more than ONE question per response.
- Ask follow-up questions that feel natural and connected to what the user said.
- Detect emotions from implicit cues — don't only rely on direct answers.
- Keep responses SHORT (2-4 sentences max). Be conversational, not clinical.
- Use casual, friendly language. Contractions are great.
- Show genuine interest and emotional understanding.
- Never mention algorithms, machine learning, or data analysis.
- Avoid making it feel like a survey.
- Flow naturally from mood → energy → activity → music taste → desired outcome.

TOPICS TO NATURALLY COVER (don't cover all at once):
1. How they're feeling right now (mood)
2. Their energy level (high, low, somewhere in between)
3. What they're up to (activity/context)
4. What kind of music resonates with them lately
5. What feeling they want the music to create

ENDING THE CONVERSATION:
After gathering enough info (typically 6-10 exchanges), say something like:
"Alright, I think I've got a really good sense of your vibe right now. Let me put together something perfect for you..."
Then output ONLY this exact marker on a new line: [ANALYSIS_COMPLETE]
Then output the JSON mood profile.

JSON FORMAT (output after [ANALYSIS_COMPLETE]):
{
  "primary_mood": "",
  "secondary_mood": "",
  "energy_level": 0,
  "stress_level": 0,
  "sentiment": "",
  "activity": "",
  "preferred_genres": [],
  "preferred_tempo": "",
  "recommended_vibe": "",
  "emotional_state_summary": "",
  "confidence_score": 0.0
}

Field guidelines:
- primary_mood: One evocative word (e.g., "melancholic", "euphoric", "restless", "serene")
- secondary_mood: Supporting emotion
- energy_level: 1-10 integer
- stress_level: 1-10 integer  
- sentiment: "positive", "negative", or "neutral"
- activity: What they're doing (e.g., "late-night studying", "morning workout", "unwinding after work")
- preferred_genres: Array of 2-4 genres
- preferred_tempo: "slow", "mid", "upbeat", or "high-energy"
- recommended_vibe: One evocative phrase describing the playlist feel
- emotional_state_summary: 1-2 sentence summary
- confidence_score: 0.0-1.0 based on info gathered
"""

OPENING_MESSAGE = "Hey there! 😊 I'm Moodify — think of me as your personal music therapist. What's going on with you today? How are you feeling right now?"


def extract_analysis(text: str):
    """Extract mood profile JSON from assistant response."""
    if "[ANALYSIS_COMPLETE]" not in text:
        return None, text

    parts = text.split("[ANALYSIS_COMPLETE]")
    conversation_part = parts[0].strip()

    try:
        json_match = re.search(r'\{[\s\S]+\}', parts[1])
        if json_match:
            mood_data = json.loads(json_match.group())
            return mood_data, conversation_part
    except (json.JSONDecodeError, IndexError):
        pass

    return None, conversation_part


def chat_with_user(history: list, user_message: str) -> tuple:
    """
    Send a message to the AI and get a response.
    Returns (reply_text, is_complete, mood_profile_or_None)
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.85,
        max_tokens=600,
    )

    raw_reply = response.choices[0].message.content

    mood_profile, clean_reply = extract_analysis(raw_reply)

    is_complete = mood_profile is not None

    return clean_reply, is_complete, mood_profile


def get_opening_message() -> str:
    return OPENING_MESSAGE
