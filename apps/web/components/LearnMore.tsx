"use client";
import { useState } from 'react';

interface LearnMoreProps {
  title: string;
  children: React.ReactNode;
}

export default function LearnMore({ title, children }: LearnMoreProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div style={{
      marginBottom: '1.5rem',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '8px',
      background: 'rgba(59, 130, 246, 0.03)',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '1rem 1.25rem',
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.95rem',
          fontWeight: '500',
          textAlign: 'left'
        }}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="rgba(96, 165, 250, 0.8)" 
          strokeWidth="2"
          style={{
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ color: 'rgba(96, 165, 250, 0.9)' }}>Learn More: {title}</span>
      </button>
      {expanded && (
        <div style={{
          padding: '0 1.25rem 1.25rem 1.25rem',
          fontSize: '0.9rem',
          lineHeight: '1.7',
          color: 'rgba(255,255,255,0.75)'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

