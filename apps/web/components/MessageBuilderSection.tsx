"use client";
import { useState } from 'react';

interface Field {
  id: string;
  name: string;
  type: string;
}

interface ParsedOrchestra {
  fields: Field[];
}

interface MessageBuilderSectionProps {
  parsedOrchestra: ParsedOrchestra;
  messageBuilderValues: Record<string, string>;
  onValuesChange: (values: Record<string, string>) => void;
  onFixMessageChange: (fixMessage: string) => void;
}

export default function MessageBuilderSection({
  parsedOrchestra,
  messageBuilderValues,
  onValuesChange,
  onFixMessageChange
}: MessageBuilderSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleInputChange = (fieldId: string, value: string) => {
    const updated = { ...messageBuilderValues, [fieldId]: value };
    onValuesChange(updated);
    
    // Auto-update FIX message with all current values
    const parts = Object.entries(updated)
      .filter(([id, val]) => val && val.trim() && !['8', '9', '10', '35'].includes(id))
      .map(([id, val]) => `${id}=${val}`);
    
    const fixMessage = parts.length > 0 ? parts.join('|') : '';
    onFixMessageChange(fixMessage);
  };

  const handleClearAll = () => {
    onValuesChange({});
    onFixMessageChange('');
  };

  const businessFields = parsedOrchestra.fields.filter(f => !['8', '9', '10', '35'].includes(f.id));

  if (businessFields.length === 0) {
    return null;
  }

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
        <span style={{ color: 'rgba(255,255,255,0.9)' }}>📝 Message Builder</span>
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
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginBottom: '1rem', lineHeight: '1.7' }}>
            Fill in the business fields. Message updates automatically as you type.
          </p>
          <div className="custom-scrollbar" style={{ 
            display: 'grid', 
            gap: '0.75rem',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}>
            {businessFields
              .sort((a, b) => parseInt(a.id) - parseInt(b.id))
              .map((field, idx) => (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: '80px 120px 1fr',
                gap: '0.75rem',
                alignItems: 'center',
                fontSize: '0.85rem'
              }}>
                <span style={{
                  color: 'rgba(96, 165, 250, 0.9)',
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: '600'
                }}>
                  {field.id}
                </span>
                <span style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: '500'
                }}>
                  {field.name}
                </span>
                <input
                  type="text"
                  value={messageBuilderValues[field.id] || ''}
                  placeholder={`Enter ${field.name}...`}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#ffffff',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleClearAll}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Clear All Fields
          </button>
        </div>
      )}
    </div>
  );
}

