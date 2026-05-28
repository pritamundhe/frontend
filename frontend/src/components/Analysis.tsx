import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

interface AnalysisProps {
  onComplete: () => void;
}

export const Analysis: React.FC<AnalysisProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Analyzing your mood",
    "Finding your frequency",
    "Curating your playlist"
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 1200);
    const timer2 = setTimeout(() => setCurrentStep(2), 2400);
    const timer3 = setTimeout(() => onComplete(), 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-dark)'
    }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          boxShadow: 'none'
        }}
      >
        <Music size={40} color="var(--bg-dark)" />
      </motion.div>

      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Reading your vibe...</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Crafting the perfect musical experience</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '280px' }}>
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;

          return (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              opacity: isActive || isDone ? 1 : 0.3,
              transition: 'opacity 0.3s'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: isDone ? 'var(--text-primary)' : isActive ? 'var(--text-primary)' : 'var(--bg-surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s'
              }}>
                {isDone && <span style={{ color: 'var(--bg-dark)', fontSize: '12px' }}>✓</span>}
                {isActive && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ width: '8px', height: '8px', background: 'var(--bg-dark)', borderRadius: '50%' }}
                  />
                )}
              </div>
              <span style={{ 
                fontWeight: isActive ? 600 : 400,
                color: isDone ? 'var(--text-primary)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
