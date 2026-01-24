"use client";
import { useState, useRef, useEffect } from 'react';

interface MessageType {
  name: string;
  msgType: string;
}

interface MessageTypeSelectorProps {
  availableMessageTypes: MessageType[];
  selectedMessageType: string;
  onSelect: (messageType: string) => void;
  currentMessageId?: string;
}

export default function MessageTypeSelector({ 
  availableMessageTypes, 
  selectedMessageType, 
  onSelect,
  currentMessageId
}: MessageTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter message types based on search query
  const filteredMessageTypes = availableMessageTypes.filter(msg => 
    msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.msgType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMsg = availableMessageTypes.find(msg => msg.name === selectedMessageType);

  return (
    <div style={{
      marginBottom: '1.5rem',
      border: '1px solid rgba(168, 85, 247, 0.2)',
      borderRadius: '8px',
      background: 'rgba(168, 85, 247, 0.03)',
      padding: '1.25rem'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <label style={{
          fontSize: '0.875rem',
          color: 'rgba(168, 85, 247, 0.9)',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="rgba(168, 85, 247, 0.9)" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          Select Message Type
        </label>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={availableMessageTypes.length === 0}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.95)',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: availableMessageTypes.length > 0 ? 'pointer' : 'not-allowed',
              outline: 'none',
              transition: 'all 0.2s',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onMouseOver={(e) => {
              if (availableMessageTypes.length > 0) {
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            <span>
              {availableMessageTypes.length > 0 && selectedMsg
                ? `${selectedMsg.name} (${selectedMsg.msgType})`
                : 'Load Orchestra schema first...'}
            </span>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              fill="none"
              style={{
                transition: 'transform 0.2s',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <path 
                d="M2 4L6 8L10 4" 
                stroke="rgba(168, 85, 247, 0.9)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isOpen && availableMessageTypes.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              left: 0,
              right: 0,
              background: 'rgba(26, 26, 26, 0.98)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              maxHeight: '300px',
              overflow: 'hidden',
              zIndex: 1000,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Search input */}
              <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  type="text"
                  placeholder="Search message types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Options list */}
              <div className="custom-scrollbar" style={{ 
                maxHeight: '240px', 
                overflowY: 'auto'
              }}>
                {filteredMessageTypes.length > 0 ? (
                  filteredMessageTypes.map((msg) => (
                    <button
                      key={msg.name}
                      onClick={() => {
                        onSelect(msg.name);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: msg.name === selectedMessageType 
                          ? 'rgba(168, 85, 247, 0.15)' 
                          : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        color: msg.name === selectedMessageType 
                          ? 'rgba(168, 85, 247, 0.9)' 
                          : 'rgba(255,255,255,0.9)',
                        fontSize: '0.875rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseOver={(e) => {
                        if (msg.name !== selectedMessageType) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (msg.name !== selectedMessageType) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div>{msg.name}</div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'rgba(255,255,255,0.5)', 
                        marginTop: '0.25rem' 
                      }}>
                        Category: {msg.msgType}
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.875rem'
                  }}>
                    No message types found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Display current message ID */}
        {currentMessageId && (
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(168, 85, 247, 0.9)',
            padding: '0.75rem 1rem',
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '6px',
            fontFamily: 'ui-monospace, monospace'
          }}>
            <strong style={{ fontWeight: '600' }}>Message ID:</strong>{' '}
            <span style={{ color: 'rgba(96, 165, 250, 0.9)' }}>{currentMessageId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

