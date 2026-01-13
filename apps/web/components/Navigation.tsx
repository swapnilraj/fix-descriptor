"use client";
import Link from 'next/link';
import Image from 'next/image';

type NavigationProps = {
  currentPage: 'problem' | 'spec' | 'explorer';
};

export default function Navigation({ currentPage }: NavigationProps) {
  return (
    <header style={{ 
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      background: '#0a0a0a',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 2rem)', 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: 'clamp(1rem, 3vw, 2rem)' 
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(1rem, 3vw, 1.5rem)',
        }}>
          <Link href="/" style={{ 
              fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
              fontWeight: '600',
              color: 'rgba(255,255,255,0.9)',
              textDecoration: 'none'
            }}>
              ERC-FIX
          </Link>
          <a
            href="https://nethermind.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              opacity: 0.6,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
            }}
          >
            <Image
              src="/brand/nethermind-white-horizontal.svg"
              alt="Nethermind"
              width={120}
              height={28}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </a>
        </div>
        <nav style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 2rem)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
          <Link 
            href="/" 
            style={{ 
              color: currentPage === 'problem' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', 
              textDecoration: 'none',
              borderBottom: currentPage === 'problem' ? '2px solid rgba(255,255,255,0.9)' : 'none',
              paddingBottom: currentPage === 'problem' ? '0.25rem' : '0'
            }}
          >
            Problem Statement
          </Link>
          <Link 
            href="/spec" 
            style={{ 
              color: currentPage === 'spec' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', 
              textDecoration: 'none',
              borderBottom: currentPage === 'spec' ? '2px solid rgba(255,255,255,0.9)' : 'none',
              paddingBottom: currentPage === 'spec' ? '0.25rem' : '0'
            }}
          >
            Specification
          </Link>
          <Link 
            href="/explorer" 
            style={{ 
              color: currentPage === 'explorer' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', 
              textDecoration: 'none',
              borderBottom: currentPage === 'explorer' ? '2px solid rgba(255,255,255,0.9)' : 'none',
              paddingBottom: currentPage === 'explorer' ? '0.25rem' : '0'
            }}
          >
            Explorer
          </Link>
        </nav>
      </div>
    </header>
  );
}

