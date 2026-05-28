import type { ChatResponse, RecommendationsResponse } from '../types';

const API_BASE = 'https://backend-production-49f37.up.railway.app';

export const api = {
  startSession: async (): Promise<{ session_id: string; message: string }> => {
    const res = await fetch(`${API_BASE}/api/session/new`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  sendMessage: async (sessionId: string, message: string): Promise<ChatResponse> => {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        history: [], // History is managed by backend in current implementation
      }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  getRecommendations: async (sessionId: string): Promise<RecommendationsResponse> => {
    const res = await fetch(`${API_BASE}/api/recommendations/${sessionId}?limit=20`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  }
};
