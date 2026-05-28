import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import type { Message } from '../types';

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
    }
  }, [isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem 1rem'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 0',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles size={20} color="var(--bg-dark)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>VibeflowAI</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Vibe check in progress</p>
        </div>
      </header>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        paddingBottom: '2rem'
      }}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'flex',
              gap: '1rem',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: msg.role === 'user' ? 'var(--bg-surface)' : 'var(--text-primary)',
              color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--bg-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              flexShrink: 0
            }}>
              {msg.role === 'user' ? 'U' : 'V'}
            </div>
            
            <div style={{
              background: msg.role === 'user' ? 'var(--bg-surface)' : 'var(--text-primary)',
              border: msg.role === 'user' ? '1px solid var(--border-light)' : 'none',
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              borderTopRightRadius: msg.role === 'user' ? 0 : '1rem',
              borderTopLeftRadius: msg.role === 'assistant' ? 0 : '1rem',
              color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--bg-dark)',
              lineHeight: 1.5
            }}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              gap: '1rem',
              alignSelf: 'flex-start',
              maxWidth: '80%'
            }}
          >
             <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--text-primary)',
              color: 'var(--bg-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>V</div>
            <div style={{
              background: 'var(--text-primary)',
              border: 'none',
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              borderTopLeftRadius: 0,
              display: 'flex',
              gap: '4px',
              alignItems: 'center'
            }}>
              <span className="dot" style={{ animationDelay: '0s' }} />
              <span className="dot" style={{ animationDelay: '0.2s' }} />
              <span className="dot" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        position: 'relative',
        marginTop: 'auto'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share how you're feeling..."
          disabled={isTyping}
          autoFocus
          style={{
            width: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            padding: '1.25rem 4rem 1.25rem 1.5rem',
            borderRadius: '2rem',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            outline: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: input.trim() && !isTyping ? 'var(--text-primary)' : 'var(--bg-surface)',
            color: input.trim() && !isTyping ? 'var(--bg-dark)' : 'var(--text-secondary)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
        >
          <Send size={18} />
        </button>
      </form>
      
      <style>{`
        .dot {
          width: 6px;
          height: 6px;
          background: var(--bg-dark);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
