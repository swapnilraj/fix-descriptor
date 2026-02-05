"use client";

interface Example {
  name: string;
  description: string;
  fix: string;
}

interface ExampleSelectorProps {
  examples: Record<string, Example>;
  onSelectExample: (fixMessage: string) => void;
}

export default function ExampleSelector({ examples, onSelectExample }: ExampleSelectorProps) {
  return (
    <div style={{
      marginBottom: '1.5rem',
      padding: '1.25rem',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.03)'
    }}>
      <div style={{
        fontSize: '0.875rem',
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="rgba(255,255,255,0.7)" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Quick Start Examples
      </div>
      
      <p style={{ 
        fontSize: '0.875rem', 
        color: 'rgba(255,255,255,0.6)', 
        marginBottom: '1rem',
        lineHeight: '1.6'
      }}>
        Try one of these pre-configured examples to get started quickly:
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '0.75rem'
      }}>
        {Object.entries(examples).map(([key, example]) => (
          <button
            key={key}
            onClick={() => onSelectExample(example.fix)}
            style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ 
              fontWeight: '600', 
              fontSize: '0.95rem',
              color: 'rgba(255,255,255,0.9)'
            }}>
              {example.name}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.6)',
              lineHeight: '1.5'
            }}>
              {example.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

