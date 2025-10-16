"use client";
import Link from 'next/link';

type NavigationProps = {
  currentPage: 'explorer' | 'spec' | 'problem';
  showLogo?: boolean;
};

export default function Navigation({ currentPage, showLogo = true }: NavigationProps) {
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
        justifyContent: showLogo ? 'space-between' : 'flex-end', 
        alignItems: 'center', 
        gap: 'clamp(1rem, 3vw, 2rem)' 
      }}>
        {showLogo && (
          <Link href="/" style={{ 
            fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
            fontWeight: '600',
            color: 'rgba(255,255,255,0.9)',
            textDecoration: 'none'
          }}>
            FixDescriptorKit
          </Link>
        )}
        <nav style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 2rem)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
          <Link 
            href="/" 
            style={{ 
              color: currentPage === 'explorer' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', 
              textDecoration: 'none',
              borderBottom: currentPage === 'explorer' ? '2px solid rgba(255,255,255,0.9)' : 'none',
              paddingBottom: currentPage === 'explorer' ? '0.25rem' : '0'
            }}
          >
            Explorer
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
            href="/problem" 
            style={{ 
              color: currentPage === 'problem' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', 
              textDecoration: 'none',
              borderBottom: currentPage === 'problem' ? '2px solid rgba(255,255,255,0.9)' : 'none',
              paddingBottom: currentPage === 'problem' ? '0.25rem' : '0'
            }}
          >
            The Problem
          </Link>
        </nav>
      </div>
    </header>
  );
}

