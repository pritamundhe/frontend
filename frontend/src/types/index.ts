export interface MoodProfile {
  primary_mood: string;
  secondary_mood?: string;
  emotional_state_summary?: string;
  energy_level: number;
  stress_level: number;
  recommended_vibe: string;
  preferred_genres: string[];
  activity?: string;
  sentiment?: string;
  preferred_tempo?: string;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  image_url: string;
  duration_ms: number;
  external_url: string;
}

export interface RecommendationsResponse {
  playlist_title: string;
  playlist_description: string;
  tracks: Track[];
}

export interface PastSession {
  id: string;
  title: string;
  date: number;
  messages: Message[];
  moodProfile: MoodProfile | null;
  recommendations: RecommendationsResponse | null;
  appState: 'landing' | 'chat' | 'analysis' | 'dashboard';
}

export interface ChatResponse {
  reply: string;
  is_complete: boolean;
  mood_profile: MoodProfile | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
