"use client";
import { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({ 
  title, 
  icon, 
  defaultCollapsed = false, 
  children 
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div style={{
      marginBottom: '1.5rem',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.03)',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          width: '100%',
          padding: '1rem 1.25rem',
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '1rem',
          fontWeight: '500',
          textAlign: 'left',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon}{title}
        </span>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="rgba(255,255,255,0.5)" 
          strokeWidth="2"
          style={{
            transition: 'transform 0.2s',
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {!isCollapsed && (
        <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

