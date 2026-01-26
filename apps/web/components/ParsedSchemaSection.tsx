"use client";
import { useState } from 'react';
import { FaClipboardList } from 'react-icons/fa';

interface ParsedOrchestraField {
  id: string;
  name: string;
  type: string;
}

interface ParsedOrchestra {
  messageName: string;
  msgType: string;
  messageId: string;
  fields: ParsedOrchestraField[];
}

interface Message {
  name: string;
  id: string;
  msgType: string;
}

interface ParsedSchemaSectionProps {
  parsedOrchestra: ParsedOrchestra;
  allMessages: Message[];
  selectedMessageIndex: number;
  onMessageIndexChange: (index: number) => void;
}

export default function ParsedSchemaSection({
  parsedOrchestra,
  allMessages,
  selectedMessageIndex,
  onMessageIndexChange
}: ParsedSchemaSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 1
        }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaClipboardList size={18} />
            Parsed Orchestra Schema
          </span>
          {allMessages.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                Component:
              </span>
              <select
                value={selectedMessageIndex}
                onChange={(e) => onMessageIndexChange(Number(e.target.value))}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.9)',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  maxWidth: '300px'
                }}
              >
                {allMessages.map((msg, idx) => (
                  <option key={idx} value={idx} style={{ background: '#1a1a1a' }}>
                    {msg.name} (Category: {msg.msgType}, ID: {msg.id})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                {selectedMessageIndex + 1}/{allMessages.length}
              </span>
            </div>
          )}
        </div>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="rgba(255,255,255,0.5)" 
          strokeWidth="2"
          style={{
            transition: 'transform 0.2s',
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
            flexShrink: 0
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {!isCollapsed && (
        <div style={{
          padding: '0 1.25rem 1.25rem 1.25rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '2rem',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Component:</span>
              <div style={{ fontWeight: '600', color: 'rgba(168, 85, 247, 0.9)' }}>
                {parsedOrchestra.messageName}
              </div>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Category:</span>
              <div style={{ fontWeight: '600', color: 'rgba(251, 191, 36, 0.9)' }}>
                {parsedOrchestra.msgType}
              </div>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>ID:</span>
              <div style={{ fontWeight: '600', color: 'rgba(96, 165, 250, 0.9)' }}>
                {parsedOrchestra.messageId}
              </div>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Fields:</span>
              <div style={{ fontWeight: '600', color: 'rgba(34, 197, 94, 0.9)' }}>
                {parsedOrchestra.fields.length}
              </div>
            </div>
          </div>
          
          <div className="custom-scrollbar pr-4" style={{
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {parsedOrchestra.fields
              .sort((a, b) => parseInt(a.id) - parseInt(b.id))
              .map((field, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: idx < parsedOrchestra.fields.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <span style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: '600',
                    color: 'rgba(96, 165, 250, 0.9)',
                    minWidth: '2rem'
                  }}>
                    {field.id}
                  </span>
                  <span style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: '500'
                  }}>
                    {field.name}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.8rem',
                  fontFamily: 'ui-monospace, monospace'
                }}>
                  <span>{field.type}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
                  <span style={{ color: 'rgba(34, 197, 94, 0.7)' }}>SBE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

