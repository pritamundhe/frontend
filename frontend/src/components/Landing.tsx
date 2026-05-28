import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Headphones } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
  isLoading: boolean;
}

export const Landing: React.FC<LandingProps> = ({ onStart, isLoading }) => {
  return (
    <div className="landing-container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative'
    }}>


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          textAlign: 'center',
          maxWidth: '600px',
          zIndex: 10
        }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Sparkles size={16} color="var(--text-primary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>AI-Powered Music Curation</span>
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          lineHeight: 1.1,
          marginBottom: '1.5rem',
          fontWeight: 700
        }}>
          Music That Truly <br />
          <span style={{ color: 'var(--text-primary)' }}>Gets Your Vibe</span>
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: 'var(--text-secondary)',
          marginBottom: '3rem',
          lineHeight: 1.6
        }}>
          Tell me how you're feeling right now, and I'll curate the perfect Spotify playlist for this exact moment in your life.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          disabled={isLoading}
          style={{
            background: 'var(--text-primary)',
            color: 'var(--bg-dark)',
            padding: '1rem 2.5rem',
            borderRadius: '2rem',
            fontSize: '1.125rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'none',
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? (
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            <Headphones size={20} />
          )}
          {isLoading ? 'Connecting...' : 'Start the Vibe Check'}
        </motion.button>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    </div>
  );
};
