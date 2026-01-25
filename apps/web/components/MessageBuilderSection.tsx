"use client";
import { useState } from 'react';
import Tooltip from './Tooltip';
import { FaEdit } from 'react-icons/fa';

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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter fields based on search query
  const filteredFields = businessFields.filter(field => 
    field.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <span style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaEdit size={18} />
          Message Builder
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
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginBottom: '1rem', lineHeight: '1.7' }}>
            Fill in the business fields. Message updates automatically as you type.
          </p>
          
          {/* Search Input */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="rgba(255,255,255,0.5)" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  pointerEvents: 'none'
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tag number or field name..."
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div style={{ 
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              {filteredFields.length} of {businessFields.length} fields
              {searchQuery && filteredFields.length === 0 && (
                <span style={{ color: 'rgba(239, 68, 68, 0.8)', marginLeft: '0.5rem' }}>
                  No matches found
                </span>
              )}
            </div>
          </div>

          <div className="custom-scrollbar" style={{ 
            display: 'grid', 
            gap: '0.75rem',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}>
            {filteredFields
              .sort((a, b) => parseInt(a.id) - parseInt(b.id))
              .map((field, idx) => (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: '24px 80px 120px 1fr',
                gap: '0.75rem',
                alignItems: 'center',
                fontSize: '0.85rem',
                padding: '0.5rem',
                borderRadius: '6px',
                background: messageBuilderValues[field.id] && messageBuilderValues[field.id].trim()
                  ? 'rgba(34, 197, 94, 0.05)'
                  : 'transparent',
                border: `1px solid ${messageBuilderValues[field.id] && messageBuilderValues[field.id].trim()
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'transparent'}`,
                transition: 'all 0.2s'
              }}>
                {messageBuilderValues[field.id] && messageBuilderValues[field.id].trim() ? (
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="rgba(34, 197, 94, 0.8)" 
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <div style={{ width: '16px', height: '16px' }} />
                )}
                <span style={{
                  color: 'rgba(96, 165, 250, 0.9)',
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: '600'
                }}>
                  {field.id}
                </span>
                <div style={{
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <Tooltip content={field.name}>
                    <span style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'help',
                      display: 'block'
                    }}>
                      {field.name}
                    </span>
                  </Tooltip>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={messageBuilderValues[field.id] || ''}
                    placeholder={`Enter ${field.name}...`}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 2rem 0.5rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                  {messageBuilderValues[field.id] && messageBuilderValues[field.id].trim() && (
                    <button
                      onClick={() => handleInputChange(field.id, '')}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = 'rgba(239, 68, 68, 0.8)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'ui-monospace, monospace'
            }}>
              {Object.values(messageBuilderValues).filter(v => v && v.trim()).length} field(s) filled
            </div>
            <button
              onClick={handleClearAll}
              disabled={Object.values(messageBuilderValues).filter(v => v && v.trim()).length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                background: Object.values(messageBuilderValues).filter(v => v && v.trim()).length > 0 
                  ? 'rgba(239, 68, 68, 0.1)' 
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${Object.values(messageBuilderValues).filter(v => v && v.trim()).length > 0 
                  ? 'rgba(239, 68, 68, 0.3)' 
                  : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '6px',
                color: Object.values(messageBuilderValues).filter(v => v && v.trim()).length > 0 
                  ? 'rgba(239, 68, 68, 0.9)' 
                  : 'rgba(255,255,255,0.4)',
                cursor: Object.values(messageBuilderValues).filter(v => v && v.trim()).length > 0 
                  ? 'pointer' 
                  : 'not-allowed',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (Object.values(messageBuilderValues).filter(v => v && v.trim()).length > 0) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (Object.values(messageBuilderValues).filter(v => v && v.trim()).length > 0) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }
              }}
            >
              Clear All Fields
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

