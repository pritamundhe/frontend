import React from 'react';
import { motion } from 'framer-motion';

import type { MoodProfile, RecommendationsResponse, Message } from '../types';

interface DashboardProps {
  moodProfile: MoodProfile;
  recommendations: RecommendationsResponse | null;
  messages: Message[];
  onNewChat: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ moodProfile, recommendations, messages, onNewChat }) => {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      display: 'grid',
      gridTemplateColumns: '1fr 450px',
      gap: '2rem',
      minHeight: '100vh'
    }}>
      {/* Main Content: Recommendations */}
      <div style={{ paddingBottom: '4rem' }}>
        <header style={{ marginBottom: '3rem', position: 'relative' }}>
          <button
            onClick={onNewChat}
            style={{ 
              position: 'absolute', 
              top: '-2rem', 
              left: 0, 
              background: 'transparent', 
              color: 'var(--text-secondary)', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0.5rem 0',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Start New Vibe
          </button>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '2rem' }}>{recommendations?.playlist_title || 'Your Personalized Playlist'}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{recommendations?.playlist_description || 'Based on your current vibe'}</p>
        </header>

        {recommendations?.tracks ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recommendations.tracks.map(track => (
              <iframe
                key={track.id}
                src={`https://open.spotify.com/embed/track/${track.id}?theme=0`}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: '12px', background: 'var(--bg-surface)' }}
              ></iframe>
            ))}
          </div>
        ) : (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '1rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--text-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Curating tracks from Spotify...</p>
          </div>
        )}
      </div>

      {/* Sidebar: Mood Profile */}
      <aside>
        <div className="glass" style={{
          padding: '2rem',
          borderRadius: '1.5rem',
          position: 'sticky',
          top: '2rem'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', textTransform: 'capitalize', marginBottom: '0.25rem' }}>{moodProfile.primary_mood}</h2>
            <p style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{moodProfile.secondary_mood || 'Balanced'}</p>
          </div>

          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem', color: 'rgba(255,255,255,0.9)' }}>
            {moodProfile.emotional_state_summary}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Energy</span>
                <span>{moodProfile.energy_level}/10</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(moodProfile.energy_level / 10) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{ height: '100%', background: 'var(--text-primary)' }}
                />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stress</span>
                <span>{moodProfile.stress_level}/10</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(moodProfile.stress_level / 10) * 100}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                  style={{ height: '100%', background: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vibe Elements</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[...moodProfile.preferred_genres, moodProfile.activity, moodProfile.sentiment].filter(Boolean).map((tag, i) => (
                <span key={i} style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: '1px solid var(--border-light)'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chat History</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: '0.75rem', opacity: 0.8 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: msg.role === 'user' ? 'var(--bg-surface-hover)' : 'var(--text-primary)', color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>
                    {msg.role === 'user' ? 'U' : 'V'}
                  </div>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
