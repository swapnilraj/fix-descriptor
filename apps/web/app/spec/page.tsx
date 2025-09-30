"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SpecPage() {
  const [activeSection, setActiveSection] = useState<string>('');

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
    { id: 'verification', title: '10. Verification' },
    { id: 'security', title: '11. Security Considerations' },
    { id: 'gas-costs', title: '12. Gas Cost Analysis' },
    { id: 'implementation', title: '13. Implementation Guide' },
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
  const SectionHeading = ({ id, children, fontSize = '2rem' }: { id: string; children: React.ReactNode; fontSize?: string }) => (
    <h2 
      id={id}
      onClick={() => handleSectionClick(id)}
      style={{ 
        fontSize, 
        fontWeight: '600',
        marginBottom: '1.5rem',
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
            fontSize: '1.25rem', 
            fontWeight: '500', 
            marginBottom: '1rem', 
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
      <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
        {children}
      </h3>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: '#0a0a0a',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: 'rgba(255,255,255,0.9)',
            textDecoration: 'none'
          }}>
            FixDescriptorKit
          </Link>
          <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              Explorer
            </Link>
            <Link href="/spec" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none', borderBottom: '2px solid rgba(255,255,255,0.9)', paddingBottom: '0.25rem' }}>
              Specification
            </Link>
          </nav>
        </div>
      </header>

      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Table of Contents - Sidebar */}
        <aside style={{ 
          width: '280px', 
          padding: '3rem 2rem',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          position: 'sticky',
          top: '80px',
          height: 'calc(100vh - 80px)',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                padding: '0.5rem 0',
                color: activeSection === section.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                fontSize: '0.875rem',
                textDecoration: 'none',
                borderLeft: activeSection === section.id ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                paddingLeft: '1rem',
                transition: 'all 0.2s'
              }}
            >
              {section.title}
            </a>
          ))}
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '3rem 4rem', maxWidth: '900px' }}>
          {/* Title */}
          <div style={{ marginBottom: '3rem' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: '600',
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}>
              FIX Descriptor Specification
            </h1>
            <p style={{ 
              fontSize: '1.25rem',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: '1.6'
            }}>
              Canonicalization, CBOR, and Merkle Specification for Onchain FIX Asset Descriptors
            </p>
            <div style={{ 
              marginTop: '2rem',
              padding: '1rem 1.5rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.7)'
            }}>
              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Version 1.0</strong> · Last Updated: September 2025
            </div>

            {/* Prominent CTA for Explorer */}
            <div style={{ 
              marginTop: '2rem',
              padding: '1.5rem 2rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                🎮 First time reading this spec?
              </div>
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Try the interactive explorer to see each step of the transformation process in action. 
                Visualize how FIX messages become canonical trees, CBOR bytes, and Merkle commitments.
              </p>
              <Link href="/" style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '6px',
                color: 'rgba(59, 130, 246, 1)',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}>
                Launch Interactive Explorer →
              </Link>
            </div>
          </div>

          {/* Section 1: Overview */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="overview">
              1. Overview
            </SectionHeading>

            <SubsectionHeading id="problem-statement">
              1.1 Problem Statement
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem' }}>
              When tokenizing securities, traditional financial systems need standardized instrument data. 
              The <strong>Financial Information eXchange (FIX) Protocol</strong> is the de facto standard 
              for describing financial instruments in traditional markets. However, today every blockchain 
              integration requires custom adapters and manual data mapping between token contracts and 
              existing financial infrastructure.
            </p>

            <SubsectionHeading id="solution">
              1.2 Solution
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem' }}>
              This specification defines how to <strong>embed FIX descriptors directly in token contracts</strong> using 
              canonical CBOR encoding and Merkle commitments. This enables automatic integration with existing 
              financial infrastructure while maintaining onchain verifiability—without requiring any onchain FIX parsing.
            </p>

            <SubsectionHeading id="what-this-covers">
              1.3 What This Spec Covers
            </SubsectionHeading>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
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
              padding: '1.5rem',
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
              padding: '1.5rem',
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
              padding: '1.5rem',
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
              padding: '1.5rem',
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
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="running-example">
              2. Running Example: US Treasury Bond
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem' }}>
              Throughout this specification, we&apos;ll reference this concrete example: 
              a <strong>US Treasury Bond</strong> maturing on November 15, 2030, with a 4.25% coupon rate.
            </p>

            <SubsectionHeading id="example-fix-input">
              FIX Message Input
            </SubsectionHeading>
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                <strong>Size:</strong> ~243 bytes
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
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
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem' }}>
              All leaves are sorted and combined into a binary Merkle tree, producing a <strong>fixRoot</strong>.
            </p>

            <SubsectionHeading id="example-onchain">
              Onchain Storage
            </SubsectionHeading>
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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
              padding: '1.5rem',
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
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="terminology">
              3. Terminology and Notation
            </SectionHeading>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
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
                  padding: '1.5rem',
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
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="architecture">
              4. Architecture Overview
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem' }}>
              Before diving into the detailed specifications, here&apos;s the big picture of how 
              FIX descriptors flow from input to onchain storage:
            </p>

            <div style={{ 
              padding: '2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.8rem',
              marginBottom: '3rem',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.8)', lineHeight: '2' }}>{`                ┌─────────────────────┐
                │   FIX Message       │
                │                     │
                │ Input: Standard     │
                │ securities data     │
                │ (business fields)   │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │  Canonical Tree     │
                │                     │
                │ • Remove session    │
                │   fields            │
                │ • Sort map keys     │
                │ • Preserve groups   │
                └──────────┬──────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   CBOR   │   │  Merkle  │   │  Path    │
    │ Encoding │   │   Tree   │   │ Indexing │
    └────┬─────┘   └────┬─────┘   └────┬─────┘
         │              │              │
         │ Compact,     │ Commitment   │ Field
         │ determinis-  │ for verifi-  │ location
         │ tic binary   │ cation       │ tracking
         │              │              │
         └──────────────┴──────────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │   Onchain Storage    │
            │                      │
            │ • FixDescriptor      │
            │   struct (minimal)   │
            │ • CBOR via SSTORE2   │
            │ • Merkle root        │
            │ • Verification func  │
            └──────────────────────┘`}</pre>
            </div>

            <SubsectionHeading id="architecture-components">
              Key Components
            </SubsectionHeading>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
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
              padding: '1.5rem',
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
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="descriptor-content">
              5. Descriptor Content
            </SectionHeading>

            <SubsectionHeading id="included-fields">
              5.1 Included Fields
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Business and instrument fields such as:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Identification:</strong> 48 (SecurityID), 22 (SecurityIDSource), 55 (Symbol), 454 (SecurityAltID group)</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Classification:</strong> 167 (SecurityType), 461 (CFICode)</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Economics/Terms:</strong> 15 (Currency), 541 (MaturityDate), 223 (CouponRate)</li>
              <li><strong>Roles:</strong> 453 (Parties group) and nested PartySubIDs if used</li>
            </ul>

            <SubsectionHeading id="excluded-fields">
              5.2 Excluded Fields
            </SubsectionHeading>
            <div style={{ 
              padding: '1.5rem',
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
              padding: '1.5rem',
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
          <section style={{ marginBottom: '4rem' }}>
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
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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
                padding: '1.5rem',
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
                padding: '1.5rem',
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
            <ol style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
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
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="cbor-encoding">
              7. Canonical CBOR Encoding
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              The canonical tree is serialized to CBOR using canonical form:
            </p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
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
              padding: '1.5rem',
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
          <section style={{ marginBottom: '4rem' }}>
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
              padding: '1.5rem',
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

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem' }}>
              <strong>Path encoding rules:</strong> Each path is an array of unsigned integers, encoded as canonical CBOR. 
              Paths are used for both Merkle leaves and verification.
            </p>

            <SubsectionHeading id="leaf-hash">
              8.2 Leaf Hash
            </SubsectionHeading>
            <div style={{ 
              padding: '1.5rem',
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
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>pathCBOR</code>: the canonical CBOR bytes of the path array</li>
              <li><code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>valueBytes</code>: the exact FIX value bytes (UTF-8 string payload, no CBOR framing)</li>
            </ul>

            <SubsectionHeading id="leaf-set">
              8.3 Leaf Set
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              Produce one leaf per <strong>present field</strong>:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
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
              padding: '1.5rem',
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
          <section style={{ marginBottom: '4rem' }}>
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
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>The CBOR is deployed as the runtime bytecode of a minimal data contract (prefixed with a STOP byte)</li>
              <li style={{ marginBottom: '0.75rem' }}>Anyone can retrieve bytes via <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.9em' }}>eth_getCode(fixCBORPtr)</code></li>
              <li>Optionally expose a chunk retrieval function using EXTCODECOPY</li>
            </ul>

            <SubsectionHeading id="events-versioning">
              9.5 Events and Versioning
            </SubsectionHeading>
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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

          {/* Section 10: Verification */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="verification">
              10. Onchain Verification
            </SectionHeading>

            <SubsectionHeading id="library-interface">
              Library Interface
            </SubsectionHeading>
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
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
            <ol style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
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

          {/* Section 11: Security Considerations */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="security">
              11. Security Considerations
            </SectionHeading>

            <SubsectionHeading id="trust-assumptions">
              Trust Assumptions
            </SubsectionHeading>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
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
              padding: '1.5rem',
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
              padding: '1.5rem',
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

          {/* Section 12: Gas Cost Analysis */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="gas-costs">
              12. Gas Cost Analysis
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem' }}>
              Understanding gas costs helps implementers make informed decisions about descriptor size and verification strategies.
            </p>

            <SubsectionHeading id="deployment-costs">
              Deployment Costs
            </SubsectionHeading>
            <div style={{ 
              padding: '1.5rem',
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
              padding: '1.5rem',
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

          {/* Section 13: Implementation Guide */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="implementation">
              13. Implementation Guide
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              Given a FIX descriptor message, follow this implementation flow:
            </p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
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
                  padding: '1.5rem',
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
              padding: '1.5rem',
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
            marginTop: '6rem',
            paddingTop: '3rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.9rem'
          }}>
            <p style={{ marginBottom: '1rem' }}>
              <strong>FixDescriptorKit Specification v1.0</strong>
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', marginRight: '1.5rem' }}>
                Try the Explorer
              </Link>
              <a href="https://github.com/swapnilraj/fix-descriptor" style={{ color: 'rgba(255,255,255,0.6)' }}>
                View on GitHub
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
