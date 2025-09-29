"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SpecPage() {
  const [activeSection, setActiveSection] = useState<string>('');

  const sections = [
    { id: 'overview', title: '1. Overview' },
    { id: 'terminology', title: '2. Terminology' },
    { id: 'descriptor-content', title: '3. Descriptor Content' },
    { id: 'canonical-tree', title: '4. Canonical Tree Model' },
    { id: 'cbor-encoding', title: '5. CBOR Encoding' },
    { id: 'merkle-commitment', title: '6. Merkle Commitment' },
    { id: 'onchain-representation', title: '7. On-Chain Representation' },
    { id: 'verification', title: '8. Verification' },
    { id: 'implementation', title: '9. Implementation Flow' },
    { id: 'example', title: '10. Example' },
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
            display: 'inline-block',
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
              Canonicalization, CBOR, and Merkle Specification for On-Chain FIX Asset Descriptors
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
          </div>

          {/* Section 1: Overview */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="overview">
              1. Overview
            </SectionHeading>

            <SubsectionHeading id="scope-goals">
              Scope and Goals
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              This specification defines how to convert a FIX-based asset descriptor into a canonical, 
              public CBOR payload and a Merkle commitment suitable for on-chain verification—without 
              requiring any on-chain FIX parsing.
            </p>

            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Input
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: 0 }}>
                A FIX message (or subset) that describes a financial instrument (the "asset descriptor"), 
                using standard FIX tags and groups.
              </p>
            </div>

            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Output (Off-Chain)
              </div>
              <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0, paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>A <strong>canonical CBOR</strong> byte string representing the descriptor</li>
                <li style={{ marginBottom: '0.5rem' }}>A <strong>Merkle root</strong> committing to every field in the descriptor</li>
                <li>Optional per-field <strong>Merkle proofs</strong></li>
              </ul>
            </div>

            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Output (On-Chain)
              </div>
              <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0, paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>A minimal <strong>descriptor struct</strong> storing: FIX version, dictionary hash, Merkle root, and a pointer to CBOR bytes (SSTORE2-style)</li>
                <li>A <strong>verification function</strong> to check (path, value, proof) against the committed root</li>
              </ul>
            </div>

            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '0.5rem', color: 'rgba(34, 197, 94, 0.9)' }}>
                Non-Goals
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0 }}>
                This specification does <strong>not</strong> prescribe parsing FIX on-chain or which business 
                tags an issuer must include (that's policy). This spec defines <strong>how</strong> to encode, 
                not <strong>what</strong> to encode.
              </p>
            </div>
          </section>

          {/* Section 2: Terminology */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="terminology">
              2. Terminology and Notation
            </SectionHeading>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {[
                {
                  term: 'FIX Tag',
                  definition: 'An integer field identifier (e.g., 55, 15, 541)'
                },
                {
                  term: 'Group',
                  definition: 'A repeating structure introduced by a "NoXXX" count tag (e.g., 454, 453), followed by N entries. Each group defines a delimiter field (first field of each entry; e.g., 455 for group 454, 448 for group 453)'
                },
                {
                  term: 'Path',
                  definition: 'A sequence of integers identifying a specific field occurrence in the descriptor tree; includes group indices for repeated entries (e.g., [454, 1, 456] = SecurityAltID, entry index 1, tag 456)'
                },
                {
                  term: 'CBOR',
                  definition: 'Concise Binary Object Representation (RFC 8949), using canonical form (definite lengths, sorted map keys)'
                },
                {
                  term: 'Keccak',
                  definition: 'keccak256 hash (as per Ethereum)'
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

          {/* Section 3: Descriptor Content */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="descriptor-content">
              3. Descriptor Content
            </SectionHeading>

            <SubsectionHeading id="included-fields">
              3.1 Included Fields
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
              3.2 Excluded Fields
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
              3.3 Dictionary Binding
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Implementations <strong>MUST</strong> record:
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
              <div style={{ marginBottom: '0.5rem' }}>fixMajor, fixMinor (e.g., 4, 4)</div>
              <div>dictHash = keccak256 of the exact FIX dictionary / FIX Orchestra bytes</div>
            </div>
          </section>

          {/* Section 4: Canonical Tree Model */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="canonical-tree">
              4. Canonical Tree Model
            </SectionHeading>

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
                (e.g., "4.250", "20301115")
              </li>
              <li style={{ marginBottom: '1rem' }}>
                <strong>Group entries:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>MUST begin with the delimiter field (for human clarity), but map keys are still sorted</li>
                  <li style={{ marginBottom: '0.5rem' }}>Optional fields MAY be omitted; absence means "no leaf"</li>
                  <li>Array order is preserved as given by the issuer (indices 0..N-1)</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* Section 5: CBOR Encoding */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="cbor-encoding">
              5. Canonical CBOR Encoding
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

          {/* Section 6: Merkle Commitment */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="merkle-commitment">
              6. Merkle Commitment
            </SectionHeading>

            <SubsectionHeading id="path-encoding">
              6.1 Path Encoding
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Each leaf commits to a (path, valueBytes) pair. The path <strong>MUST</strong> be encoded as 
              canonical CBOR array of unsigned integers:
            </p>
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.9rem',
              marginBottom: '2rem'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>[15] → Scalar at top level</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>[454, 1, 456] → Group 454, entry index 1, tag 456</div>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>[453, 0, 802, 2, 523] → Nested group example</div>
            </div>

            <SubsectionHeading id="leaf-hash">
              6.2 Leaf Hash
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
              6.3 Leaf Set
            </SubsectionHeading>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              Produce one leaf per <strong>present field</strong>:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Scalars: one leaf for each (tag, value)</li>
              <li>Each group entry: one leaf per present field inside that entry (with its path including the group index)</li>
            </ul>

            <SubsectionHeading id="root-construction">
              6.4 Root Construction
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
              6.5 Proofs
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
              <div style={{ marginBottom: '0.5rem' }}>proof[]: bytes32[]</div>
              <div>fixRoot: bytes32</div>
            </div>
          </section>

          {/* Section 7: On-Chain Representation */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="onchain-representation">
              7. On-Chain Representation
            </SectionHeading>

            <SubsectionHeading id="descriptor-struct">
              7.1 Descriptor Struct
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

            <SubsectionHeading id="cbor-storage">
              7.2 CBOR Storage (SSTORE2 Pattern)
            </SubsectionHeading>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>The CBOR is deployed as the runtime bytecode of a minimal data contract (prefixed with a STOP byte)</li>
              <li style={{ marginBottom: '0.75rem' }}>Anyone can retrieve bytes via <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.9em' }}>eth_getCode(fixCBORPtr)</code></li>
              <li>Optionally expose a chunk retrieval function using EXTCODECOPY</li>
            </ul>

            <SubsectionHeading id="events-versioning">
              7.3 Events and Versioning
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
                event AssetFIXCommitted(id, fixRoot, dictHash, fixCBORPtr, fixCBORLen)
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                event AssetFIXUpdated(id, oldRoot, newRoot, newPtr)
              </div>
            </div>
          </section>

          {/* Section 8: Verification */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="verification">
              8. On-Chain Verification
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
      bytes32[] calldata proof
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
                For each sibling in proof with implied ordering, compute parent = keccak256(left || right)
              </li>
              <li>Compare final parent to root</li>
            </ol>
          </section>

          {/* Section 9: Implementation Flow */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="implementation">
              9. Reference Implementation Flow
            </SectionHeading>

            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              Given a FIX descriptor message:
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { num: 1, title: 'Parse FIX', desc: 'Extract only business fields (exclude session tags)' },
                { num: 2, title: 'Build Canonical Tree', desc: 'Map scalars directly; create array of entry maps for groups' },
                { num: 3, title: 'Serialize to CBOR', desc: 'Use canonical form (integer keys, sorted; definite lengths)' },
                { num: 4, title: 'Enumerate Leaves', desc: 'Compute pathCBOR for each present field; collect (pathCBOR, valueBytes) pairs' },
                { num: 5, title: 'Compute Merkle Root', desc: 'Sort leaves by pathCBOR; build binary Merkle tree using keccak256' },
                { num: 6, title: 'Deploy CBOR', desc: 'Deploy as SSTORE2-style data contract; return fixCBORPtr and fixCBORLen' },
                { num: 7, title: 'Write Descriptor', desc: 'Store on-chain in registry with fixMajor, fixMinor, dictHash, fixRoot, fixCBORPtr' },
                { num: 8, title: 'Produce Utilities', desc: 'Proof generator and reader tools for fetching CBOR and generating proofs' }
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
          </section>

          {/* Section 10: Example */}
          <section style={{ marginBottom: '4rem' }}>
            <SectionHeading id="example">
              10. Example
            </SectionHeading>

            <SubsectionHeading id="example-descriptor">
              Treasury-Style Descriptor Fields
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
              <pre style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>{`55=USTB-2030-11-15
48=US91282CEZ76  22=4
167=TBOND  461=DBFTFR
541=20301115  223=4.250  15=USD
454=[ {455=91282CEZ7, 456=1}, {455=US91282CEZ76, 456=4} ]
453=[ {448=US_TREASURY,447=D,452=1}, 
      {448=CUSTODIAN_BANK_ABC,447=D,452=24} ]`}</pre>
            </div>

            <SubsectionHeading id="processing-results">
              Processing Results
            </SubsectionHeading>
            <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>CBOR:</strong> Canonical map with integer keys; arrays for 454 and 453 
                (Representative size: ~243 bytes)
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Leaves (examples):</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>path [15], value "USD" → keccak(pathCBOR || "USD")</li>
                  <li style={{ marginBottom: '0.5rem' }}>path [454,1,456], value "4" → keccak(...)</li>
                  <li>path [453,0,448], value "US_TREASURY" → keccak(...)</li>
                </ul>
              </li>
              <li>
                <strong>Root:</strong> fixRoot computed from sorted leaves
              </li>
            </ul>
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
              <a href="https://github.com/swapnilraj/fixdescriptorkit-evm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                View on GitHub
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
