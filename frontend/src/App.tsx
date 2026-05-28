import { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { Chat } from './components/Chat';
import { Analysis } from './components/Analysis';
import { Dashboard } from './components/Dashboard';
import { api } from './api';
import type { Message, MoodProfile, RecommendationsResponse, PastSession } from './types';

type AppState = 'landing' | 'chat' | 'analysis' | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Result state
  const [moodProfile, setMoodProfile] = useState<MoodProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);

  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('vibeflow_sessions');
    if (saved) {
      try {
        setPastSessions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setPastSessions(prev => {
      const idx = prev.findIndex(s => s.id === sessionId);
      const titleCandidate = messages.find(m => m.role === 'user')?.content;
      const updatedSession: PastSession = {
        id: sessionId,
        title: titleCandidate ? titleCandidate.slice(0, 30) + (titleCandidate.length > 30 ? '...' : '') : 'New Vibe',
        date: prev[idx]?.date || Date.now(),
        messages,
        moodProfile,
        recommendations,
        appState
      };
      
      let newSessions;
      if (idx >= 0) {
        newSessions = [...prev];
        newSessions[idx] = updatedSession;
      } else {
        newSessions = [updatedSession, ...prev];
      }
      localStorage.setItem('vibeflow_sessions', JSON.stringify(newSessions));
      return newSessions;
    });
  }, [sessionId, messages, moodProfile, recommendations, appState]);

  const loadSession = (session: PastSession) => {
    setSessionId(session.id);
    setMessages(session.messages);
    setMoodProfile(session.moodProfile);
    setRecommendations(session.recommendations);
    setAppState(session.appState);
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const data = await api.startSession();
      setSessionId(data.session_id);
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message
      }]);
      setAppState('chat');
    } catch (error) {
      console.error('Failed to start session', error);
      alert('Could not connect to VibeflowAI server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!sessionId) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const data = await api.sendMessage(sessionId, text);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
      if (data.is_complete && data.mood_profile) {
        setMoodProfile(data.mood_profile);
        setTimeout(() => setAppState('analysis'), 1500); // Wait a bit for user to read final message
      }
    } catch (error) {
      console.error('Failed to send message', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Hmm, something went wrong on my end. Mind trying that again?'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAnalysisComplete = () => {
    setAppState('dashboard');
    // Fetch recommendations in background
    if (sessionId) {
      api.getRecommendations(sessionId)
        .then(setRecommendations)
        .catch(err => {
          console.error('Failed to get recommendations', err);
          // Handle error state gracefully by setting an empty response or showing error UI
          setRecommendations({
            playlist_title: "Error",
            playlist_description: "Failed to connect to Spotify.",
            tracks: []
          });
        });
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {appState !== 'landing' && (
        <div style={{ width: '260px', background: '#0a0a0a', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '1rem' }}>
            <button 
              onClick={() => {
                setSessionId(null);
                setMessages([]);
                setMoodProfile(null);
                setRecommendations(null);
                setAppState('landing');
              }}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--text-primary)', color: 'var(--bg-dark)', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              + New Chat
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {pastSessions.map(s => (
              <button 
                key={s.id}
                onClick={() => loadSession(s)}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '0.75rem', 
                  background: s.id === sessionId ? 'var(--bg-surface-hover)' : 'transparent',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: '0.25rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '0.875rem'
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ flex: 1, position: 'relative' }}>
        {appState === 'landing' && (
          <Landing onStart={handleStartSession} isLoading={isLoading} />
        )}
        
        {appState === 'chat' && (
          <Chat messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} />
        )}
        
        {appState === 'analysis' && (
          <Analysis onComplete={handleAnalysisComplete} />
        )}
        
        {appState === 'dashboard' && moodProfile && (
          <Dashboard moodProfile={moodProfile} recommendations={recommendations} messages={messages} />
        )}
      </div>
    </div>
  );
}

export default App;
