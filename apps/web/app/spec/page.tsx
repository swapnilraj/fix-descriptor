"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function SpecPage() {
  const [activeSection, setActiveSection] = useState<string>('');
  const [tocOpen, setTocOpen] = useState<boolean>(false);

  const sections = [
    { id: 'overview', title: '1. Overview' },
    { id: 'running-example', title: '2. Running Example' },
    { id: 'terminology', title: '3. Terminology' },
    { id: 'architecture', title: '4. Architecture Overview' },
    { id: 'descriptor-content', title: '5. Descriptor Content' },
    { id: 'canonical-tree', title: '6. Canonical Tree Model' },
    { id: 'cbor-encoding', title: '7. CBOR Encoding' },
    { id: 'merkle-commitment', title: '8. Merkle Commitment' },
    { id: 'onchain-representation', title: '9. Onchain Representation' },
    { id: 'human-readable', title: '10. Human-Readable Output' },
    { id: 'fix-dictionary', title: '11. FIX Dictionary Architecture' },
    { id: 'verification', title: '12. Onchain Verification' },
    { id: 'retrieval', title: '13. Offchain Retrieval' },
    { id: 'security', title: '14. Security Considerations' },
    { id: 'gas-costs', title: '15. Gas Cost Analysis' },
    { id: 'implementation', title: '16. Implementation Guide' },
  ];

  // Set active section from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setActiveSection(hash);
    }
  }, []);

  // Helper function to handle section clicks
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    window.history.pushState({}, '', `#${sectionId}`);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Component for clickable section headings
  const SectionHeading = ({ id, children, fontSize = 'clamp(1.5rem, 4vw, 2rem)' }: { id: string; children: React.ReactNode; fontSize?: string }) => (
    <h2 
      id={id}
      onClick={() => handleSectionClick(id)}
      style={{ 
        fontSize, 
        fontWeight: '600',
        marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        position: 'relative',
        display: 'block',
        transition: 'color 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
        const link = e.currentTarget.querySelector('.section-link') as HTMLElement;
        if (link) link.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'rgba(255,255,255,1)';
        const link = e.currentTarget.querySelector('.section-link') as HTMLElement;
        if (link) link.style.opacity = '0';
      }}
    >
      {children}
      <span 
        className="section-link"
        style={{ 
          marginLeft: '0.5rem', 
          opacity: '0', 
          transition: 'opacity 0.2s',
          fontSize: '0.8em',
          color: 'rgba(255,255,255,0.4)'
        }}
      >
        #
      </span>
    </h2>
  );

  // Component for subsection headings
  const SubsectionHeading = ({ id, children }: { id?: string; children: React.ReactNode }) => {
    if (id) {
      return (
        <h3 
          id={id}
          onClick={() => handleSectionClick(id)}
          style={{ 
            fontSize: 'clamp(1.1rem, 3vw, 1.25rem)', 
            fontWeight: '500', 
            marginBottom: 'clamp(0.75rem, 2vw, 1rem)', 
            color: 'rgba(255,255,255,0.9)',
            cursor: 'pointer',
            display: 'block',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            const link = e.currentTarget.querySelector('.section-link') as HTMLElement;
            if (link) link.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            const link = e.currentTarget.querySelector('.section-link') as HTMLElement;
            if (link) link.style.opacity = '0';
          }}
        >
          {children}
          <span 
            className="section-link"
            style={{ 
              marginLeft: '0.5rem', 
              opacity: '0', 
              transition: 'opacity 0.2s',
              fontSize: '0.9em',
              color: 'rgba(255,255,255,0.3)'
            }}
          >
            #
          </span>
        </h3>
      );
    }
    return (
      <h3 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.25rem)', fontWeight: '500', marginBottom: 'clamp(0.75rem, 2vw, 1rem)', color: 'rgba(255,255,255,0.9)' }}>
        {children}
      </h3>
    );
  };

  // Reusable, consistent SVG icon component
  type IconName = 'file' | 'package' | 'fingerprint' | 'shieldCheck' | 'download' | 'refresh';
  const Icon = ({ name, size = 16, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) => {
    const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
    switch (name) {
      case 'file':
        return (
          <svg {...common}>
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        );
      case 'package':
        return (
          <svg {...common}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        );
      case 'fingerprint':
        return (
          <svg {...common}>
            <circle cx="12" cy="12" r="3" />
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          </svg>
        );
      case 'shieldCheck':
        return (
          <svg {...common}>
            <path d="M12 3l7 4v6c0 5-3.5 7.5-7 8-3.5-.5-7-3-7-8V7l7-4z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case 'download':
        return (
          <svg {...common}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
        );
      case 'refresh':
        return (
          <svg {...common}>
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Consistent arrow connector
  const Arrow = () => (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '1.25rem 0' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.45 }} aria-hidden>
        <path d="M12 5v14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M8 15l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  // Branching connector (true split)
  const SplitConnector = () => (
    <div style={{ width: '100%', height: '40px', margin: '4px 0 16px 0' }} aria-hidden>
      <svg viewBox="0 0 100 40" width="100%" height="40" fill="none" stroke="currentColor" style={{ opacity: 0.5 }}>
        <path d="M50 0 L50 10" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M50 10 Q46 20 32 36" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M50 10 Q54 20 68 36" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
      <Navigation currentPage="spec" />

      {/* Mobile TOC Section */}
      {tocOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '2rem',
          overflowY: 'auto'
        }}
        onClick={() => setTocOpen(false)}
        >
          <div style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Contents
              </div>
              <button
                onClick={() => setTocOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.9)',
                  padding: '0.5rem 1rem',
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                Close
              </button>
            </div>
            {sections.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionClick(section.id);
                  setTocOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'clamp(0.75rem, 2vw, 0.875rem) clamp(0.75rem, 2vw, 1rem)',
                  color: activeSection === section.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  textDecoration: 'none',
                  borderLeft: activeSection === section.id ? '3px solid rgba(255,255,255,0.9)' : '3px solid transparent',
                  paddingLeft: 'clamp(0.75rem, 2vw, 1rem)',
                  transition: 'all 0.2s',
                  minHeight: '44px'
                }}
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Floating TOC Button for Mobile */}
      <button
        onClick={() => setTocOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'clamp(1rem, 3vw, 2rem)',
          right: 'clamp(1rem, 3vw, 2rem)',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50px',
          color: 'rgba(255,255,255,0.9)',
          padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.25rem, 3vw, 1.5rem)',
          fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
          fontWeight: '500',
          cursor: 'pointer',
          zIndex: 150,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          minHeight: '44px',
          display: 'none'
        }}
        className="mobile-toc-button"
      >
        📑 Contents
      </button>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-toc-button {
            display: block !important;
          }
          .desktop-sidebar {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-toc-button {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Table of Contents - Sidebar (Desktop) */}
        <aside className="desktop-sidebar" style={{ 
          width: '280px', 
          padding: 'clamp(2rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          position: 'sticky',
          top: '80px',
          height: 'calc(100vh - 80px)',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)', color: 'rgba(255,255,255,0.4)', marginBottom: 'clamp(0.75rem, 2vw, 1rem)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contents
          </div>
          {sections.map(section => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleSectionClick(section.id);
              }}
              style={{
                display: 'block',
                padding: 'clamp(0.4rem, 1.5vw, 0.5rem) 0',
                color: activeSection === section.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
                textDecoration: 'none',
                borderLeft: activeSection === section.id ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                paddingLeft: 'clamp(0.75rem, 2vw, 1rem)',
                transition: 'all 0.2s'
              }}
            >
              {section.title}
            </a>
          ))}
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 4rem)', maxWidth: 'min(900px, 100%)', width: '100%' }}>
          {/* Title */}
          <div style={{ marginBottom: 'clamp(2rem, 5vw, 3rem)' }}>
            <h1 style={{ 
              fontSize: 'clamp(2rem, 5vw, 3rem)', 
              fontWeight: '600',
              marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}>
              FIX Descriptor Specification
            </h1>
            <p style={{ 
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: '1.6'
            }}>
              Canonicalization, CBOR, and Merkle Specification for Onchain FIX Asset Descriptors
            </p>
            <div style={{ 
              marginTop: 'clamp(1.5rem, 3vw, 2rem)',
              padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
              color: 'rgba(255,255,255,0.7)'
            }}>
              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Version 1.0</strong> · Last Updated: September 2025
            </div>

            {/* Prominent CTA for Explorer */}
            <div style={{ 
              marginTop: 'clamp(1.5rem, 3vw, 2rem)',
              padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1.25rem, 4vw, 2rem)',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
            }}>
              <div style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)', fontWeight: '500', marginBottom: 'clamp(0.5rem, 2vw, 0.75rem)', color: 'rgba(255,255,255,0.9)' }}>
                🎮 First time reading this spec?
              </div>
              <p style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: 'clamp(0.75rem, 2vw, 1rem)' }}>
                Try the interactive explorer to see each step of the transformation process in action. 
                Visualize how FIX messages become canonical trees, CBOR bytes, and Merkle commitments.
              </p>
              <Link href="/" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(0.65rem, 2vw, 0.75rem) clamp(1.25rem, 3vw, 1.5rem)',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '6px',
                color: 'rgba(59, 130, 246, 1)',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                transition: 'all 0.2s',
                minHeight: '44px'
              }}>
                Launch Interactive Explorer →
              </Link>
            </div>
          </div>

          {/* Section 1: Overview */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="overview">
              1. Overview
            </SectionHeading>

            <SubsectionHeading id="problem-statement">
              1.1 Problem Statement
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              When tokenizing securities, traditional financial systems need standardized instrument data. 
              The <strong>Financial Information eXchange (FIX) Protocol</strong> is the de facto standard 
              for describing financial instruments in traditional markets. However, today every blockchain 
              integration requires custom adapters and manual data mapping between token contracts and 
              existing financial infrastructure.
            </p>

            <SubsectionHeading id="solution">
              1.2 Solution
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              This specification defines how to <strong>embed FIX descriptors directly in token contracts</strong> using 
              canonical CBOR encoding and Merkle commitments. This enables automatic integration with existing 
              financial infrastructure while maintaining onchain verifiability—without requiring any onchain FIX parsing.
            </p>

            <SubsectionHeading id="what-this-covers">
              1.3 What This Spec Covers
            </SubsectionHeading>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.5rem' }}>Converting FIX messages to canonical trees</li>
              <li style={{ marginBottom: '0.5rem' }}>CBOR encoding rules for deterministic representation</li>
              <li style={{ marginBottom: '0.5rem' }}>Merkle commitment generation for efficient field verification</li>
              <li style={{ marginBottom: '0.5rem' }}>Onchain storage patterns (SSTORE2-based)</li>
              <li>Verification mechanisms for proving specific fields</li>
            </ul>

            <SubsectionHeading id="what-this-does-not-cover">
              1.4 What This Spec Does NOT Cover
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Which FIX fields to include (business policy decision)</li>
                <li style={{ marginBottom: '0.5rem' }}>Token standards (ERC20, ERC721, etc.)</li>
                <li style={{ marginBottom: '0.5rem' }}>Trading or settlement logic</li>
                <li>Onchain FIX parsing (all parsing happens off-chain)</li>
              </ul>
            </div>

            <SubsectionHeading id="how-it-works">
              1.5 How It Works (High Level)
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Input
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: 0 }}>
                A FIX message (or subset) describing a financial instrument—the &quot;asset descriptor&quot;—using 
                standard FIX tags and groups. Example: Symbol, SecurityID, MaturityDate, CouponRate, Parties, etc.
              </p>
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Processing (Off-Chain)
              </div>
              <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0, paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Build a <strong>canonical tree</strong> (deterministic structure with sorted keys)</li>
                <li style={{ marginBottom: '0.5rem' }}>Encode to <strong>canonical CBOR</strong> (single, unique byte representation)</li>
                <li>Generate <strong>Merkle root</strong> committing to every field</li>
              </ul>
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Output (Onchain)
              </div>
              <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0, paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Minimal <strong>descriptor struct</strong> in the token contract</li>
                <li style={{ marginBottom: '0.5rem' }}>CBOR bytes stored via <strong>SSTORE2</strong> (gas-efficient)</li>
                <li>Verification function: anyone can prove any field with a <strong>Merkle proof</strong></li>
              </ul>
            </div>
          </section>

          {/* Section 2: Running Example */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="running-example">
              2. Running Example: US Treasury Bond
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Throughout this specification, we&apos;ll reference this concrete example: 
              a <strong>US Treasury Bond</strong> maturing on November 15, 2030, with a 4.25% coupon rate.
            </p>

            <SubsectionHeading id="example-fix-input">
              FIX Message Input
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '2rem',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>{`55=USTB-2030-11-15        (Symbol)
48=US91282CEZ76           (SecurityID)
22=4                      (SecurityIDSource: ISIN)
167=TBOND                 (SecurityType)
461=DBFTFR                (CFICode)
541=20301115              (MaturityDate)
223=4.250                 (CouponRate)
15=USD                    (Currency)

454=[                     (SecurityAltID group - 2 entries)
  {455=91282CEZ7, 456=1},
  {455=US91282CEZ76, 456=4}
]

453=[                     (Parties group - 2 entries)
  {448=US_TREASURY, 447=D, 452=1},
  {448=CUSTODIAN_BANK_ABC, 447=D, 452=24}
]`}</pre>
              </div>

            <SubsectionHeading id="example-tree-output">
              Canonical Tree (JSON Representation)
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              After parsing and canonicalization (sorting keys, removing session fields):
            </p>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '2rem',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>{`{
  15: "USD",
  22: "4",
  48: "US91282CEZ76",
  55: "USTB-2030-11-15",
  167: "TBOND",
  223: "4.250",
  453: [
    { 447: "D", 448: "US_TREASURY", 452: "1" },
    { 447: "D", 448: "CUSTODIAN_BANK_ABC", 452: "24" }
  ],
  454: [
    { 455: "91282CEZ7", 456: "1" },
    { 455: "US91282CEZ76", 456: "4" }
  ],
  461: "DBFTFR",
  541: "20301115"
}`}</pre>
            </div>

            <SubsectionHeading id="example-cbor">
              CBOR Encoding
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              This tree is encoded to canonical CBOR (deterministic binary format):
            </p>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                <strong>Size:</strong> ~243 bytes
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                <strong>Format:</strong> CBOR map with integer keys (sorted), text string values
              </div>
            </div>

            <SubsectionHeading id="example-merkle">
              Merkle Tree
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Each field becomes a Merkle leaf. Example paths:
            </p>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '1rem'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>
                [15] → &quot;USD&quot; = keccak256(CBOR.encode([15]) || &quot;USD&quot;)
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>
                [223] → &quot;4.250&quot; = keccak256(CBOR.encode([223]) || &quot;4.250&quot;)
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>
                [453, 0, 448] → &quot;US_TREASURY&quot; = keccak256(CBOR.encode([453, 0, 448]) || &quot;US_TREASURY&quot;)
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                [454, 1, 456] → &quot;4&quot; = keccak256(CBOR.encode([454, 1, 456]) || &quot;4&quot;)
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              All leaves are sorted and combined into a binary Merkle tree, producing a <strong>fixRoot</strong>.
            </p>

            <SubsectionHeading id="example-onchain">
              Onchain Storage
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '2rem'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>{`FixDescriptor {
  fixMajor: 4,
  fixMinor: 4,
  dictHash: 0x...,
  fixRoot: 0x7a3f... (Merkle root),
  fixCBORPtr: 0x123... (SSTORE2 address),
  fixCBORLen: 243
}`}</pre>
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'rgba(59, 130, 246, 0.9)' }}>
                💡 See this in the explorer
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0, fontSize: '0.9rem' }}>
                Visit the <Link href="/" style={{ color: 'rgba(59, 130, 246, 1)', textDecoration: 'none' }}>Interactive Explorer</Link> to 
                see this exact transformation step-by-step with visualizations of the tree, CBOR bytes, and Merkle structure.
              </p>
            </div>
          </section>

          {/* Section 3: Terminology */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="terminology">
              3. Terminology and Notation
            </SectionHeading>

            <div style={{ display: 'grid', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
              {[
                {
                  term: 'Descriptor',
                  definition: 'The FIX message subset describing instrument characteristics (not transport/session data). Contains only business-relevant fields like Symbol, SecurityID, MaturityDate, CouponRate, Parties, etc.'
                },
                {
                  term: 'Canonical Form',
                  definition: 'A single, deterministic representation ensuring all implementations produce identical output. Achieved through: sorted map keys, consistent encoding, and removal of optional formatting.'
                },
                {
                  term: 'FIX Tag',
                  definition: 'An integer field identifier defined by the FIX Protocol (e.g., 55=Symbol, 15=Currency, 541=MaturityDate)'
                },
                {
                  term: 'Group',
                  definition: 'A repeating structure in FIX introduced by a "NoXXX" count tag (e.g., 454=NoSecurityAltID, 453=NoPartyIDs). Each group contains N entries where each entry is a map of fields.'
                },
                {
                  term: 'Path',
                  definition: 'The location of a field in the tree, encoded as an array of integers. Scalar fields use [tag]; group fields include the group tag, zero-based entry index, and field tag (e.g., [453, 0, 448] = first Party\'s PartyID)'
                },
                {
                  term: 'Leaf',
                  definition: 'A (path, value) pair in the Merkle tree representing a single field. Computed as: leaf = keccak256(pathCBOR || valueBytes)'
                },
                {
                  term: 'CBOR',
                  definition: 'Concise Binary Object Representation (RFC 8949) - a binary data format. This spec uses canonical CBOR: definite lengths, sorted map keys, no semantic tags.'
                },
                {
                  term: 'SSTORE2',
                  definition: 'A gas-efficient pattern for storing data in contract bytecode rather than storage slots. Data is deployed as the runtime bytecode of a minimal contract and retrieved via EXTCODECOPY.'
                },
                {
                  term: 'Merkle Proof',
                  definition: 'A list of sibling hashes proving a specific field exists in the committed descriptor. Allows efficient verification of any field without revealing the entire descriptor.'
                },
                {
                  term: 'fixRoot',
                  definition: 'The Merkle root hash committing to all fields in the descriptor. Stored onchain and used to verify field proofs.'
                }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  padding: 'clamp(1rem, 3vw, 1.5rem)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    marginBottom: '0.75rem',
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    {item.term}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                    {item.definition}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              marginTop: '2rem',
              padding: '1rem 1.5rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.7)'
            }}>
              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Note:</strong> Normative keywords 
              <strong> MUST</strong>, <strong> SHOULD</strong>, <strong> MAY</strong> are used per RFC 2119.
            </div>
          </section>

          {/* Section 4: Architecture Overview */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="architecture">
              4. Architecture Overview
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Before diving into the detailed specifications, here&apos;s the big picture of how 
              FIX descriptors flow from input to onchain storage:
            </p>

            <div className="arch-diagram" style={{ 
              padding: 'clamp(2.5rem, 5vw, 3rem)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.55) 0%, rgba(2, 6, 23, 0.55) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(100, 116, 139, 0.18)',
              marginBottom: '3rem',
              maxWidth: '900px',
              margin: '0 auto 3rem auto',
              position: 'relative'
            }}>
              <style>{`
                @media (max-width: 640px) {
                  .arch-diagram .diagram-guide { display: none; }
                  .arch-diagram .split-desktop { display: none; }
                  .arch-diagram .split-mobile { display: block; }
                  .arch-diagram .diagram-card { padding: 1rem 1.25rem !important; border-radius: 10px !important; }
                  .arch-diagram .parallel-grid, .arch-diagram .retrieval-grid { grid-template-columns: 1fr !important; row-gap: 0.75rem !important; }
                  .arch-diagram .diagram-card h4, .arch-diagram .diagram-card div { line-height: 1.3; }
                }
                @media (min-width: 641px) {
                  .arch-diagram .split-desktop { display: block; }
                  .arch-diagram .split-mobile { display: none; }
                }
              `}</style>
              {/* Stage 1: Input */}
              <div style={{ marginBottom: '2rem' }}>
                <div className="diagram-card" style={{
                  background: 'linear-gradient(135deg, rgba(79,70,229,0.50) 0%, rgba(67,56,202,0.50) 100%)',
                  padding: '1.5rem 2rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 8px 24px rgba(79, 70, 229, 0.15)',
                  border: '1px solid rgba(99,102,241,0.30)'
                }}>
                  <div style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: 'white',
                    marginBottom: '0.5rem'
                  }}>
                    FIX Message Input
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                    Standard securities data (business fields)
                  </div>
                </div>
              </div>

              <Arrow />

              {/* Stage 2: Canonical Tree */}
              <div style={{ marginBottom: '2rem' }}>
                <div className="diagram-card" style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.45) 0%, rgba(124,58,237,0.45) 100%)',
                  padding: '1.25rem 2rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.18)',
                  border: '1px solid rgba(124,58,237,0.30)'
                }}>
                  <div style={{ 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '0.5rem'
                  }}>
                    Canonical Tree
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                    Sort keys, remove session fields, preserve groups
                  </div>
                </div>
              </div>

              <div className="split-connectors">
                <div className="split-desktop"><SplitConnector /></div>
                <div className="split-mobile"><Arrow /></div>
              </div>

              {/* Stage 3: Parallel Processing - CBOR & Merkle */}
              <div style={{ marginBottom: '2rem' }}>
                <div className="parallel-grid" style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1rem'
                }}>
                  <div className="diagram-card" style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.40) 0%, rgba(147,51,234,0.40) 100%)',
                    padding: '1.5rem 1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(168, 85, 247, 0.20)',
                    border: '1px solid rgba(168, 85, 247, 0.28)'
                  }}>
                    <div style={{ 
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.5rem'
                    }}>
                      CBOR Encoding
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                      Deterministic binary format
                    </div>
                  </div>
                  <div className="diagram-card" style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.40) 0%, rgba(147,51,234,0.40) 100%)',
                    padding: '1.5rem 1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(168, 85, 247, 0.20)',
                    border: '1px solid rgba(168, 85, 247, 0.28)'
                  }}>
                    <div style={{ 
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.5rem'
                    }}>
                      Merkle Tree
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                      Cryptographic commitment
                    </div>
                  </div>
                </div>
              </div>

              <Arrow />

              {/* Stage 4: Storage */}
              <div style={{ marginBottom: '2rem' }}>
                <div className="diagram-card" style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.45) 0%, rgba(5,150,105,0.45) 100%)',
                  padding: '1.5rem 2rem',
                  borderRadius: '12px',
                  boxShadow: '0 6px 18px rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16,185,129,0.25)'
                }}>
                  <div style={{ 
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    Onchain Storage
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.875rem',
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon name="file" />
                      FixDescriptor struct
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon name="package" />
                      CBOR via SSTORE2
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon name="fingerprint" />
                      Merkle root
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon name="shieldCheck" />
                      Verification function
                    </div>
                  </div>
                </div>
              </div>

              <Arrow />

              {/* Stage 5: Retrieval & Verification */}
              <div>
                <div className="retrieval-grid" style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1rem'
                }}>
                  <div className="diagram-card" style={{
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.40) 0%, rgba(139,92,246,0.40) 100%)',
                    padding: '1.5rem 1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.18)',
                    border: '1px solid rgba(139, 92, 246, 0.28)'
                  }}>
                    <div style={{ 
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.5rem'
                    }}>
                      Offchain Retrieval
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                      Read CBOR, decode tree
                    </div>
                  </div>
                  <div className="diagram-card" style={{
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.40) 0%, rgba(139,92,246,0.40) 100%)',
                    padding: '1.5rem 1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.18)',
                    border: '1px solid rgba(139, 92, 246, 0.28)'
                  }}>
                    <div style={{ 
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.5rem'
                    }}>
                      Onchain Verification
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                      Prove fields with Merkle proofs
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <SubsectionHeading id="architecture-components">
              Key Components
            </SubsectionHeading>

            <div style={{ display: 'grid', gap: 'clamp(0.75rem, 2vw, 1rem)', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
              {[
                {
                  title: '1. FIX Message → Canonical Tree',
                  description: 'Parse FIX, extract business fields, build a hierarchical structure with integer keys and sorted maps.'
                },
                {
                  title: '2. Canonical Tree → CBOR',
                  description: 'Serialize to canonical CBOR - a compact binary format that ensures any two implementations produce identical bytes for the same input.'
                },
                {
                  title: '3. Canonical Tree → Merkle Root',
                  description: 'Enumerate all fields as (path, value) pairs, hash each to create leaves, sort, and build a binary Merkle tree.'
                },
                {
                  title: '4. Storage → Onchain',
                  description: 'Deploy CBOR via SSTORE2, store Merkle root and metadata in a FixDescriptor struct embedded in the token contract.'
                },
                {
                  title: '5. Verification',
                  description: 'Anyone can verify any field by providing: path, value, and Merkle proof. Contract hashes the leaf and walks the proof tree to confirm it reaches the stored root.'
                }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '1.25rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                    {item.title}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontSize: '0.9rem' }}>
                    {item.description}
                  </div>
                </div>
              ))}
            </div>

            <SubsectionHeading id="why-this-design">
              Why This Design?
            </SubsectionHeading>

            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Canonical:</strong> Multiple implementations produce identical output
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Compact:</strong> CBOR is significantly smaller than JSON or FIX tag=value
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Verifiable:</strong> Merkle proofs allow checking any field without downloading full descriptor
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Gas-efficient:</strong> SSTORE2 reduces storage costs vs traditional storage slots
              </li>
              <li>
                <strong>No onchain parsing:</strong> All complexity happens off-chain; onchain code only verifies hashes
              </li>
            </ul>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem', color: 'rgba(59, 130, 246, 0.9)' }}>
                💡 Visualize this pipeline
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0, fontSize: '0.9rem' }}>
                The <Link href="/" style={{ color: 'rgba(59, 130, 246, 1)', textDecoration: 'none' }}>Interactive Explorer</Link> lets 
                you step through this exact pipeline with a real Treasury bond example.
              </p>
            </div>
          </section>

          {/* Section 5: Descriptor Content */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="descriptor-content">
              5. Descriptor Content
            </SectionHeading>

            <SubsectionHeading id="included-fields">
              5.1 Included Fields
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Business and instrument fields such as:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Identification:</strong> 48 (SecurityID), 22 (SecurityIDSource), 55 (Symbol), 454 (SecurityAltID group)</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Classification:</strong> 167 (SecurityType), 461 (CFICode)</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Economics/Terms:</strong> 15 (Currency), 541 (MaturityDate), 223 (CouponRate)</li>
              <li><strong>Roles:</strong> 453 (Parties group) and nested PartySubIDs if used</li>
            </ul>

            <SubsectionHeading id="excluded-fields">
              5.2 Excluded Fields
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0 }}>
                Transport/session mechanics (e.g., 8 (BeginString), 9 (BodyLength), 10 (CheckSum), sequence numbers, 
                admin/session fields) <strong style={{ color: 'rgba(239, 68, 68, 0.9)' }}>MUST NOT</strong> be part 
                of the committed descriptor.
              </p>
            </div>

            <SubsectionHeading id="dictionary-binding">
              5.3 Dictionary Binding
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Implementations <strong>MUST</strong> record the FIX version and dictionary used to ensure semantic 
              consistency across implementations:
            </p>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '1rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>fixMajor, fixMinor (e.g., 4, 4)</div>
              <div>dictHash = keccak256 of the exact FIX dictionary / FIX Orchestra bytes</div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '0', fontSize: '0.9rem' }}>
              <strong>Example:</strong> FIX 4.4 using FIX Trading Community dictionary would have fixMajor=4, fixMinor=4, 
              and dictHash computed from the canonical FIX dictionary file.
            </p>
          </section>

          {/* Section 6: Canonical Tree Model */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="canonical-tree">
              6. Canonical Tree Model
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              The descriptor is represented as a hierarchical tree. First, let&apos;s see an example transformation, 
              then we&apos;ll define the rules.
            </p>

            <SubsectionHeading id="tree-example">
              Example Transformation
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Input FIX (simplified):
            </p>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '1rem'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>{`55=USTB-2030-11-15
167=TBOND
223=4.250
453=[{448=US_TREASURY,452=1}]`}</pre>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Canonical Tree (JSON representation):
            </p>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '2rem'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>{`{
  55: "USTB-2030-11-15",
  167: "TBOND",
  223: "4.250",
  453: [
    {
      448: "US_TREASURY",
      452: "1"
    }
  ]
}`}</pre>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <strong>Note:</strong> Keys are integers, values are strings, arrays preserve order, and map keys are sorted.
            </p>

            <SubsectionHeading id="tree-structure">
              Structure Rules
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              The descriptor is represented as a hierarchical tree:
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                  Scalars
                </div>
                <div style={{ 
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  tag → value
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>
                  Value is the exact FIX value bytes interpreted as UTF-8 text
                </p>
              </div>

              <div style={{ 
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                  Groups
                </div>
                <div style={{ 
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  groupTag → [ entry0, entry1, … ]
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>
                  Each entry is a map {`{ tag → value | nested group }`}
                </p>
              </div>
            </div>

            <SubsectionHeading id="mandatory-rules">
              Mandatory Rules
            </SubsectionHeading>
            <ol style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '1rem' }}>
                Each <strong>map key</strong> is the integer FIX tag
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <strong>Scalar values</strong> are text strings; do not convert numerics—preserve FIX string forms 
                (e.g., &quot;4.250&quot;, &quot;20301115&quot;)
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <strong>Group entries:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>MUST begin with the delimiter field (for human clarity), but map keys are still sorted</li>
                  <li style={{ marginBottom: '0.5rem' }}>Optional fields MAY be omitted; absence means &quot;no leaf&quot;</li>
                  <li>Array order is preserved as given by the issuer (indices 0..N-1)</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* Section 7: CBOR Encoding */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="cbor-encoding">
              7. Canonical CBOR Encoding
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              The canonical tree is serialized to CBOR using canonical form:
            </p>

            <div style={{ display: 'grid', gap: 'clamp(0.75rem, 2vw, 1rem)', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
              {[
                { label: 'Top Level', value: 'CBOR map ({}), keys = unsigned integers (FIX tags), sorted ascending' },
                { label: 'Scalar Value', value: 'CBOR text string with exact FIX value bytes (UTF-8). No reformatting' },
                { label: 'Group', value: 'CBOR array ([]) of CBOR maps. Each entry is a map with integer keys sorted ascending' },
                { label: 'Lengths', value: 'Definite lengths only; no indefinite-length items' },
                { label: 'Tags', value: 'No semantic tags are used' }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '1.25rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    {item.label}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', margin: 0 }}>
                <strong style={{ color: 'rgba(34, 197, 94, 0.9)' }}>Result:</strong> This ensures a 
                <strong> single, unique</strong> CBOR byte string for a given descriptor tree.
              </p>
            </div>
          </section>

          {/* Section 8: Merkle Commitment */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="merkle-commitment">
              8. Merkle Commitment
            </SectionHeading>

            <SubsectionHeading id="path-encoding">
              8.1 Path Encoding
            </SubsectionHeading>
            
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Each leaf commits to a (path, valueBytes) pair. Let&apos;s start with examples:
            </p>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>[15] → Simple field 15 (Currency)</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>[223] → Simple field 223 (CouponRate)</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>[453, 0, 448] → Group 453, first entry, field 448</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>[454, 1, 456] → Group 454, second entry, field 456</div>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>[453, 0, 802, 2, 523] → Nested group example</div>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <strong>Path encoding rules:</strong> Each path is an array of unsigned integers, encoded as canonical CBOR. 
              Paths are used for both Merkle leaves and verification.
            </p>

            <SubsectionHeading id="leaf-hash">
              8.2 Leaf Hash
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '1rem',
              marginBottom: '1rem',
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center'
            }}>
              leaf = keccak256( pathCBOR || valueBytes )
            </div>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.5rem' }}><code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>pathCBOR</code>: the canonical CBOR bytes of the path array</li>
              <li><code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>valueBytes</code>: the exact FIX value bytes (UTF-8 string payload, no CBOR framing)</li>
            </ul>

            <SubsectionHeading id="leaf-set">
              8.3 Leaf Set
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              Produce one leaf per <strong>present field</strong>:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.5rem' }}>Scalars: one leaf for each (tag, value)</li>
              <li>Each group entry: one leaf per present field inside that entry (with its path including the group index)</li>
            </ul>

            <SubsectionHeading id="root-construction">
              8.4 Root Construction
            </SubsectionHeading>
            <ol style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>Sort all leaves by <strong>pathCBOR</strong> lexicographically (byte order)</li>
              <li style={{ marginBottom: '0.75rem' }}>Build a standard <strong>binary Merkle tree</strong>:
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>Pair adjacent leaves; each parent = keccak256(left || right)</li>
                  <li>If odd node remains at a level, <strong>promote</strong> it (no duplicate hashing)</li>
                </ul>
              </li>
              <li>The final parent is the <strong>Merkle root</strong> (fixRoot)</li>
            </ol>

            <SubsectionHeading id="proofs">
              8.5 Proofs
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              A Merkle proof is the usual vector of sibling hashes from the leaf to the root. The verifier needs:
            </p>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>pathCBOR (bytes)</div>
              <div style={{ marginBottom: '0.5rem' }}>valueBytes (bytes)</div>
              <div style={{ marginBottom: '0.5rem' }}>siblingHashes[]: bytes32[]</div>
              <div style={{ marginBottom: '0.5rem' }}>directions[]: bool[]</div>
              <div>fixRoot: bytes32</div>
            </div>
          </section>

          {/* Section 9: Onchain Representation */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="onchain-representation">
              9. Onchain Representation
            </SectionHeading>

            <SubsectionHeading id="integration-with-assets">
              9.1 Integration with Asset Contracts
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '1.8', marginBottom: '1.25rem' }}>
              The FixDescriptor <strong>MUST</strong> be embedded directly in the asset contract (ERC20, ERC721, etc.)
              rather than stored in a separate registry. This eliminates permissioning issues, creates an implicit
              mapping from asset address to descriptor, and ensures the issuer retains full control.
            </p>

            <SubsectionHeading id="descriptor-struct">
              9.2 Descriptor Struct
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '2rem',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>{`struct FixDescriptor {
  uint16  fixMajor;       // e.g., 4
  uint16  fixMinor;       // e.g., 4
  bytes32 dictHash;       // FIX dictionary hash
  bytes32 fixRoot;        // Merkle root
  address fixCBORPtr;     // SSTORE2 data address
  uint32  fixCBORLen;     // CBOR length
  string  fixURI;         // optional mirror
}`}</pre>
            </div>

            <SubsectionHeading id="standard-interface">
              9.3 Standard Interface
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '2rem',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>{`interface IFixDescriptor {
  function getFixDescriptor() external view returns (FixDescriptor memory descriptor);
  function getFixRoot() external view returns (bytes32 root);
  function verifyField(
    bytes calldata pathCBOR,
    bytes calldata value,
    bytes32[] calldata proof,
    bool[] calldata directions
  ) external view returns (bool valid);
}`}</pre>
            </div>

            <SubsectionHeading id="cbor-storage">
              9.4 CBOR Storage (SSTORE2 Pattern)
            </SubsectionHeading>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.75rem' }}>The CBOR is deployed as the runtime bytecode of a minimal data contract (prefixed with a STOP byte)</li>
              <li style={{ marginBottom: '0.75rem' }}>Anyone can retrieve bytes via <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.9em' }}>eth_getCode(fixCBORPtr)</code></li>
              <li>Optionally expose a chunk retrieval function using EXTCODECOPY</li>
            </ul>

            <SubsectionHeading id="events-versioning">
              9.5 Events and Versioning
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '1rem'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>
                event FixDescriptorSet(bytes32 fixRoot, bytes32 dictHash, address fixCBORPtr, uint32 fixCBORLen)
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                event FixDescriptorUpdated(bytes32 oldRoot, bytes32 newRoot, address newPtr)
              </div>
            </div>
          </section>

          {/* Section 10: Human-Readable Output */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="human-readable">
              10. Human-Readable Output
            </SectionHeading>

            <p style={{ marginBottom: '2rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.7)' }}>
              While the canonical CBOR encoding provides compact and deterministic storage, it uses numeric tag values that are not human-readable. 
              The <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>getHumanReadableDescriptor()</code> function 
              provides an on-chain method to generate a human-readable representation of the FIX descriptor by substituting tag numbers with their textual names from a FIX dictionary.
            </p>

            <SubsectionHeading id="readable-function">
              10.1 The getHumanReadableDescriptor() Function
            </SubsectionHeading>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              marginBottom: '2rem',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.875rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ color: 'rgba(147, 197, 253, 0.9)', marginBottom: '0.5rem' }}>
                function getHumanReadableDescriptor() external view returns (string memory)
              </div>
            </div>

            <p style={{ marginBottom: '2rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.7)' }}>
              This function:
            </p>
            <ul style={{ marginBottom: '2rem', paddingLeft: '2rem', lineHeight: '2', color: 'rgba(255,255,255,0.7)' }}>
              <li>Reads the CBOR-encoded descriptor from the SSTORE2 contract</li>
              <li>Parses the CBOR map to extract tags and values</li>
              <li>Looks up human-readable tag names from the FixDictionary contract</li>
              <li>Formats the output in FIX format: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>TagName=Value|TagName2=Value2|...</code></li>
              <li>Handles both scalar fields and repeating groups</li>
            </ul>

            <SubsectionHeading id="readable-output-format">
              10.2 Output Format
            </SubsectionHeading>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                marginBottom: '1rem',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
                border: '1px solid rgba(255,255,255,0.1)',
                overflowX: 'auto'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>Scalar Fields:</div>
                <div style={{ color: 'rgba(34, 197, 94, 0.9)', whiteSpace: 'nowrap' }}>
                  Symbol=AAPL|SecurityID=US0378331005|SecurityIDSource=1|SecurityType=CS|Currency=USD
                </div>
              </div>

              <div style={{
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
                border: '1px solid rgba(255,255,255,0.1)',
                overflowX: 'auto'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>Repeating Groups:</div>
                <div style={{ color: 'rgba(34, 197, 94, 0.9)', whiteSpace: 'nowrap' }}>
                  NoSecurityAltID=2|[0]SecurityAltID=000402AJ1|[0]SecurityAltIDSource=1|[1]SecurityAltID=US000402AJ19|[1]SecurityAltIDSource=4
                </div>
              </div>
            </div>

            <SubsectionHeading id="readable-benefits">
              10.3 Benefits
            </SubsectionHeading>

            <ul style={{ marginBottom: '2rem', paddingLeft: '2rem', lineHeight: '2', color: 'rgba(255,255,255,0.7)' }}>
              <li><strong>On-chain Composability:</strong> Other contracts can call this function to read human-readable descriptors</li>
              <li><strong>No Off-chain Dependencies:</strong> Everything is verifiable and readable directly on the blockchain</li>
              <li><strong>Gas Efficient:</strong> Uses optimized SSTORE2 pattern for dictionary storage</li>
              <li><strong>Standard Compliance:</strong> Output follows FIX protocol format conventions</li>
            </ul>

            <SubsectionHeading id="readable-vs-offchain">
              10.4 On-chain vs Off-chain Decoding
            </SubsectionHeading>

            <p style={{ marginBottom: '1.5rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.7)' }}>
              Both approaches can show human-readable tag names. The key difference is WHERE decoding happens and WHETHER other contracts can call it.
            </p>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'rgba(59, 130, 246, 0.9)' }}>
                Off-chain Decoding
              </div>
              <ul style={{ paddingLeft: '1.5rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                <li>Uses fixparser library (JavaScript/TypeScript)</li>
                <li>Can show tag names from off-chain dictionaries</li>
                <li>0 gas cost (view call)</li>
                <li>Not callable by other smart contracts</li>
                <li>Requires off-chain infrastructure/libraries</li>
              </ul>
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(34, 197, 94, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'rgba(34, 197, 94, 0.9)' }}>
                On-chain Human-Readable
              </div>
              <ul style={{ paddingLeft: '1.5rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                <li>Calls getHumanReadableDescriptor() on the contract</li>
                <li>Shows tag names from on-chain FixDictionary</li>
                <li>0 gas cost (when called as view)</li>
                <li>~200k-500k gas (when called by another contract)</li>
                <li>Fully composable with other smart contracts</li>
                <li>Trustless, no off-chain dependencies</li>
              </ul>
            </div>
          </section>

          {/* Section 11: FIX Dictionary Architecture */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="fix-dictionary">
              11. FIX Dictionary Architecture
            </SectionHeading>

            <p style={{ marginBottom: '2rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.7)' }}>
              The FIX Dictionary provides an on-chain mapping from numeric FIX tag numbers to their human-readable names. It uses an innovative storage 
              strategy that eliminates expensive mapping lookups by storing tag names in fixed-size slots, enabling O(1) direct indexing.
            </p>

            <SubsectionHeading id="dictionary-storage-strategy">
              11.1 Storage Strategy
            </SubsectionHeading>

            <p style={{ marginBottom: '1.5rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.7)' }}>
              Instead of using a Solidity mapping, the dictionary stores all tag names in a single SSTORE2 contract with a fixed 24-byte slot per tag:
            </p>

            <div style={{
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.875rem' }}>
                <div style={{ color: 'rgba(147, 197, 253, 0.9)', marginBottom: '1rem' }}>
                  Slot Structure (24 bytes per tag):
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                  <div>Byte 0:     Length of tag name (0-23)</div>
                  <div>Bytes 1-23: UTF-8 encoded tag name (zero-padded)</div>
                </div>
              </div>
            </div>

            <p style={{ marginBottom: '1.5rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.7)' }}>
              <strong>Example for Tag 15 (Currency):</strong>
            </p>

            <div style={{
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              marginBottom: '2rem',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.875rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                <div>Offset: 15 × 24 = 360 bytes</div>
                <div style={{ marginTop: '1rem' }}>
                  <div>[Slot at offset 360]</div>
                  <div>Byte 0:    0x08 (length = 8)</div>
                  <div>Bytes 1-8: &quot;Currency&quot;</div>
                  <div>Bytes 9-23: 0x00... (zero padding)</div>
                </div>
              </div>
            </div>

            <SubsectionHeading id="dictionary-lookup">
              11.2 Tag Name Lookup
            </SubsectionHeading>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              marginBottom: '2rem',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.875rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ color: 'rgba(147, 197, 253, 0.9)', marginBottom: '0.5rem' }}>
                function getTagName(uint16 tag) public view returns (string memory)
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
                {/* Direct offset calculation: O(1) lookup */}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                offset = tag × 24 + 1  {/* +1 to skip STOP byte */}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                extcodecopy(dataContract, slot, offset, 24)
              </div>
            </div>

            <SubsectionHeading id="dictionary-gas-efficiency">
              11.3 Gas Efficiency
            </SubsectionHeading>

            <ul style={{ marginBottom: '2rem', paddingLeft: '2rem', lineHeight: '2', color: 'rgba(255,255,255,0.7)' }}>
              <li><strong>No Expensive Mappings:</strong> Avoids 20,000+ gas per SSTORE for mapping updates</li>
              <li><strong>Single Deployment:</strong> All 957 tags stored in one SSTORE2 contract (~23KB)</li>
              <li><strong>O(1) Lookups:</strong> Direct offset calculation without iteration</li>
              <li><strong>EXTCODECOPY:</strong> Efficient bytecode reading (100 gas + 3 gas/word)</li>
            </ul>

            <SubsectionHeading id="dictionary-versioning">
              11.4 Dictionary Versioning
            </SubsectionHeading>

            <p style={{ marginBottom: '2rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.7)' }}>
              Different FIX versions (4.2, 4.4, 5.0) can have different dictionaries. The <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>FixDictionaryFactory</code> contract 
              manages deployments keyed by FIX major and minor version numbers.
            </p>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              marginBottom: '2rem',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.875rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ color: 'rgba(147, 197, 253, 0.9)' }}>
                mapping(uint16 =&gt; mapping(uint16 =&gt; FixDictionary)) public dictionaries;
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
                {/* dictionaries[fixMajor][fixMinor] => FixDictionary contract */}
              </div>
            </div>
          </section>

          {/* Section 12: Verification (was 10) */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="verification">
              12. Onchain Verification
            </SectionHeading>

            <SubsectionHeading id="library-interface">
              Library Interface
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '2rem',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>{`library FixMerkleVerifier {
  function verify(
      bytes32 root,
      bytes calldata pathCBOR,
      bytes calldata value,
      bytes32[] calldata proof,
      bool[] calldata directions
  ) internal pure returns (bool);
}`}</pre>
            </div>

            <SubsectionHeading id="verification-algorithm">
              Verification Algorithm
            </SubsectionHeading>
            <ol style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.9em' }}>
                  bytes32 leaf = keccak256(abi.encodePacked(pathCBOR, value))
                </code>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                For each sibling in <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.9em' }}>proof</code> with corresponding direction in <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.9em' }}>directions</code>:
                if current node is right, parent = keccak256(sibling || current); if left, parent = keccak256(current || sibling)
              </li>
              <li>Compare final parent to root</li>
            </ol>
          </section>

          {/* Section 11: Onchain Retrieval */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="retrieval">
              13. Offchain Retrieval
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Once a FIX descriptor is committed onchain, participants MUST be able to retrieve
              the canonical CBOR representation and reconstruct the original descriptor tree. This
              section specifies the retrieval interface and decoding requirements.
            </p>

            <SubsectionHeading id="retrieval-interface">
              11.1 Retrieval Interface
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Token contracts that store FIX descriptors SHOULD expose a function to retrieve
              the CBOR-encoded canonical tree. The retrieval function MUST support chunked
              access to accommodate large descriptors.
            </p>
            <div style={{
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
              marginBottom: '2rem',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>{`function getFixCBORChunk(uint256 start, uint256 size)
    external view returns (bytes memory);`}</pre>
            </div>

            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Chunked Access:</strong> The function accepts <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.9em' }}>start</code> offset and <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.9em' }}>size</code> parameters,
                allowing callers to retrieve large CBOR in multiple transactions to manage gas costs.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Bounds Handling:</strong> Implementations MUST clamp the requested range to available data
                and return an empty bytes array if the start offset exceeds the CBOR length.
              </li>
              <li>
                <strong>SSTORE2 Access:</strong> Since CBOR is stored via SSTORE2 (as contract bytecode),
                retrieval functions SHOULD use efficient bytecode access patterns to minimize gas consumption.
              </li>
            </ul>

            <SubsectionHeading id="cbor-decoding">
              11.2 CBOR Decoding Requirements
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Retrieved CBOR bytes MUST be decoded according to the canonical structure defined
              in Section 6. Decoders MUST reconstruct the descriptor tree with the following guarantees:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                CBOR maps SHALL be converted to descriptor tree objects with numeric tag keys
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                Scalar string values SHALL remain as UTF-8 text
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                CBOR arrays SHALL be decoded as group entries, each containing a map of fields
              </li>
              <li>
                Decoders MUST preserve the canonical key ordering present in the CBOR encoding
              </li>
            </ul>

            <SubsectionHeading id="fix-reconstruction">
              11.3 FIX Message Reconstruction
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              After decoding CBOR to the descriptor tree, applications MAY reconstruct a FIX message
              representation. The reconstruction process SHALL:
            </p>
            <ol style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                Traverse the descriptor tree in numeric tag order (canonically sorted)
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                Emit scalar fields as <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.9em' }}>tag=value</code> pairs
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                For group nodes, emit the group count tag followed by entry fields in sequence
              </li>
              <li>
                Optionally add FIX session headers (BeginString, BodyLength, MsgType) and trailer (CheckSum) for display purposes
              </li>
            </ol>

            <div style={{
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', marginBottom: '0.5rem', fontWeight: '500' }}>
                Note on Session Fields
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0 }}>
                Session fields (tags 8, 9, 10, 34, 35, 49, 52, 56) are excluded from the canonical
                tree and CBOR encoding. Reconstructed messages MAY include synthetic session headers
                for compatibility with FIX parsers, but these MUST NOT affect the Merkle root or verification.
              </p>
            </div>

            <SubsectionHeading id="retrieval-use-cases">
              11.4 Use Cases
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Onchain retrieval enables several important workflows:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Transparency:</strong> Any party can audit the complete descriptor data
                associated with a tokenized asset without relying on off-chain sources
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Interoperability:</strong> Third-party contracts can read descriptor fields
                to make decisions (e.g., risk assessment based on maturity date)
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Verification:</strong> Off-chain systems can retrieve CBOR, enumerate leaves,
                and generate Merkle proofs for specific fields to be verified onchain
              </li>
              <li>
                <strong>Compliance:</strong> Regulators or auditors can independently verify that
                onchain descriptors match disclosed security information
              </li>
            </ul>
          </section>

          {/* Section 14: Security Considerations (was 12) */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="security">
              14. Security Considerations
            </SectionHeading>

            <SubsectionHeading id="trust-assumptions">
              Trust Assumptions
            </SubsectionHeading>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Issuer Control:</strong> The descriptor is set by the token contract issuer. There is no external 
                authority validating the FIX data accuracy—users must trust the issuer.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Immutability vs Updates:</strong> Contracts can be designed with fixed descriptors (immutable) or 
                updatable descriptors (governed by issuer). Both patterns are valid; the choice is a business decision.
              </li>
              <li>
                <strong>Dictionary Hash:</strong> The dictHash ensures all parties use the same FIX dictionary. Mismatched 
                dictionaries can lead to semantic disagreements about field meanings.
              </li>
            </ul>

            <SubsectionHeading id="verification-guarantees">
              What Merkle Proofs Guarantee
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', marginBottom: '0.5rem', fontWeight: '500' }}>
                ✓ Merkle proofs prove:
              </p>
              <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>A specific field at a specific path has a specific value</li>
                <li style={{ marginBottom: '0.5rem' }}>The field is part of the canonical tree committed to</li>
                <li>No one can present a false value without breaking the proof</li>
              </ul>
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.7)', marginBottom: '0.5rem', fontWeight: '500' }}>
                ✗ Merkle proofs do NOT prove:
              </p>
              <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>The accuracy of the descriptor data</li>
                <li style={{ marginBottom: '0.5rem' }}>The completeness of the descriptor</li>
                <li>Real-world correspondence (e.g., ISIN validity)</li>
              </ul>
            </div>
          </section>

          {/* Section 15: Gas Cost Analysis (was 13) */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="gas-costs">
              15. Gas Cost Analysis
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: 'clamp(1.5rem, 3vw, 2rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              Understanding gas costs helps implementers make informed decisions about descriptor size and verification strategies.
            </p>

            <SubsectionHeading id="human-readable-gas">
              15.1 Human-Readable Descriptor Costs
            </SubsectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              The human-readable descriptor feature introduces additional gas considerations for deployment and usage.
            </p>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                One-Time Deployment Costs
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '0.5rem' }}>FixDictionary (23KB): <span style={{ color: 'rgba(251, 191, 36, 0.9)' }}>~8,700,000 gas</span></div>
                <div style={{ marginBottom: '0.5rem' }}>FixDictionaryFactory: <span style={{ color: 'rgba(251, 191, 36, 0.9)' }}>~620,000 gas</span></div>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  Cost on L1 (30 gwei): <span style={{ color: 'rgba(239, 68, 68, 0.9)' }}>~$650 USD</span>
                </div>
                <div>Cost on L2 (0.001 gwei): <span style={{ color: 'rgba(34, 197, 94, 0.9)' }}>~$0.02 USD</span></div>
              </div>
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                Off-chain Usage (View Calls)
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(34,197,94,0.15)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    color: 'rgba(34,197,94,0.95)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>0 gas</span>
                  <span>Gas Cost</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                  View functions execute locally without transactions. Unlimited free calls for web apps, analytics, and data explorers.
                </div>
              </div>
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.75rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                On-chain Usage (Contract Calls)
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(34,197,94,0.15)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    color: 'rgba(34,197,94,0.95)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>low</span>
                  <span>Simple descriptor (5 fields): ~180,000 gas</span>
                </div>
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(251,191,36,0.15)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    color: 'rgba(251,191,36,0.95)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>medium</span>
                  <span>Medium descriptor (12 fields): ~250,000 gas</span>
                </div>
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: 'rgba(239,68,68,0.95)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>high</span>
                  <span>Complex descriptor (25+ fields): ~500,000 gas</span>
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(59, 130, 246, 0.1)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                  Per-tag lookup cost: ~4,400 gas (O(1) constant time)
                </div>
              </div>
            </div>

            <SubsectionHeading id="base-operations">
              15.2 Base Operation Costs
            </SubsectionHeading>

            <SubsectionHeading id="deployment-costs">
              Deployment Costs
            </SubsectionHeading>
            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                CBOR Storage (SSTORE2)
              </div>
              <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>~200 gas per byte + ~32k deployment overhead</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Example:</strong> 243-byte descriptor ≈ 80k gas</li>
                <li>3-4x cheaper than traditional storage slots</li>
              </ul>
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                Descriptor Struct Storage + Verification
              </div>
              <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>FixDescriptor struct: ~60-80k gas (3-4 slots)</li>
                <li style={{ marginBottom: '0.5rem' }}><strong>Total deployment:</strong> ~140-160k gas (typical)</li>
                <li><strong>verifyField() call:</strong> ~30-40k gas (depth 4-6)</li>
              </ul>
            </div>
          </section>

          {/* Section 16: Implementation Guide (was 14) */}
          <section style={{ marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <SectionHeading id="implementation">
              16. Implementation Guide
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              Given a FIX descriptor message, follow this implementation flow:
            </p>

            <div style={{ display: 'grid', gap: 'clamp(0.75rem, 2vw, 1rem)', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
              {[
                { num: 1, title: 'Parse FIX', desc: 'Extract only business fields (exclude session tags - see Section 5)' },
                { num: 2, title: 'Build Canonical Tree', desc: 'Map scalars directly; create array of entry maps for groups (see Section 6)' },
                { num: 3, title: 'Serialize to CBOR', desc: 'Use canonical form - integer keys sorted, definite lengths (see Section 7)' },
                { num: 4, title: 'Enumerate Leaves', desc: 'Compute pathCBOR for each present field; collect (pathCBOR, valueBytes) pairs (see Section 8.1-8.3)' },
                { num: 5, title: 'Compute Merkle Root', desc: 'Sort leaves by pathCBOR; build binary Merkle tree using keccak256 (see Section 8.4)' },
                { num: 6, title: 'Deploy CBOR', desc: 'Deploy as SSTORE2-style data contract; return fixCBORPtr and fixCBORLen (see Section 9.4)' },
                { num: 7, title: 'Set Descriptor', desc: 'Store in the asset contract (not a registry): fixMajor, fixMinor, dictHash, fixRoot, fixCBORPtr, fixCBORLen, fixURI (see Section 9.2)' },
                { num: 8, title: 'Emit Event', desc: 'Emit FixDescriptorSet event for indexing (see Section 9.5)' },
                { num: 9, title: 'Produce Utilities', desc: 'Build proof generator and reader tools for fetching CBOR and generating proofs off-chain' }
              ].map((step) => (
                <div key={step.num} style={{ 
                  padding: 'clamp(1rem, 3vw, 1.5rem)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  gap: '1.5rem'
                }}>
                  <div style={{ 
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.3)',
                    minWidth: '2rem'
                  }}>
                    {step.num}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>
                      {step.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.75rem', color: 'rgba(59, 130, 246, 0.9)' }}>
                💡 Reference Implementation
            </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: '1rem', fontSize: '0.9rem' }}>
                This specification has a complete reference implementation available in two forms:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <strong style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>Interactive Explorer:</strong>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    Try the <Link href="/" style={{ color: 'rgba(59, 130, 246, 1)', textDecoration: 'none' }}>web interface</Link> to 
                    see the transformation pipeline in action with live visualizations.
                  </div>
                </div>
                <div>
                  <strong style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>Open Source Code:</strong>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    View the complete source code on <a href="https://github.com/swapnilraj/fix-descriptor" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(59, 130, 246, 1)', textDecoration: 'none' }}>GitHub</a>, including:
                    <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                      <li>TypeScript library (packages/fixdescriptorkit-typescript)</li>
                      <li>Solidity smart contracts (contracts/src)</li>
                      <li>Web application (apps/web)</li>
                      <li>Test suites and examples</li>
                </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div style={{ 
            marginTop: 'clamp(4rem, 8vw, 6rem)',
            paddingTop: 'clamp(2rem, 4vw, 3rem)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
          }}>
            <p style={{ marginBottom: 'clamp(0.75rem, 2vw, 1rem)' }}>
              <strong>FixDescriptorKit Specification v1.0</strong>
            </p>
            <p style={{ marginBottom: 'clamp(0.75rem, 2vw, 1rem)', display: 'flex', flexWrap: 'wrap', gap: 'clamp(1rem, 3vw, 1.5rem)', justifyContent: 'center', alignItems: 'center' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                Try the Explorer
              </Link>
              <a href="https://github.com/swapnilraj/fix-descriptor" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                View on GitHub
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
