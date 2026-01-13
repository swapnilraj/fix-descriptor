"use client";
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import IncompatibilityFlow from './diagrams/IncompatibilityFlow';
import IntegrationFlow from './diagrams/IntegrationFlow';
import FragmentedEcosystem from './diagrams/FragmentedEcosystem';
import BeforeAfter from './diagrams/BeforeAfter';
import './print.css';

export default function ProblemPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 100%)',
      color: 'rgba(255, 255, 255, 1)',
    }}>
      <Navigation currentPage="problem" />

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(2rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)',
      }}>
        {/* Hero Section */}
        <section style={{
          marginBottom: 'clamp(3rem, 8vw, 6rem)',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            fontWeight: '700',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
            letterSpacing: '-0.02em',
            lineHeight: '1.1',
          }}>
            Each new token requires 3–5 weeks of custom integration per platform
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '800px',
            margin: '0 auto 1.5rem',
            lineHeight: '1.6',
          }}>
            Blockchain tokens and traditional financial infrastructure can&apos;t communicate. Every integration becomes a custom project—forcing months of adapter development, manual reconciliation, and operational risk.
          </p>
          <p style={{
            fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
            color: 'rgba(255, 255, 255, 0.55)',
            maxWidth: '750px',
            margin: '0 auto 2rem',
          }}>
            ERC-FIX changes this by embedding standardized FIX descriptors directly in token contracts.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginTop: '2rem',
          }}>
            <a
              href="/spec"
              style={{
                display: 'inline-block',
                padding: '0.875rem 1.75rem',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '8px',
                color: 'rgba(96, 165, 250, 0.95)',
                textDecoration: 'none',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Read the Specification
            </a>
            <a
              href="/explorer"
              style={{
                display: 'inline-block',
                padding: '0.875rem 1.75rem',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '8px',
                color: 'rgba(192, 132, 252, 0.95)',
                textDecoration: 'none',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(147, 51, 234, 0.3) 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Try the Explorer
            </a>
          </div>
        </section>

        {/* Section 2: The Current Reality */}
        <section style={{
          marginBottom: 'clamp(4rem, 10vw, 8rem)',
          padding: 'clamp(2rem, 5vw, 3rem)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600',
            marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
            color: 'rgba(255, 255, 255, 0.95)',
            lineHeight: '1.3',
          }}>
            The Current Reality: Settlement Delays, Manual Reconciliation, and Capital Inefficiency
          </h2>

          <div>
            <div style={{
              marginBottom: '3rem',
              padding: 'clamp(0.5rem, 2vw, 1.5rem)',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2)',
            }}>
              <div style={{ minWidth: '600px' }}>
                <IncompatibilityFlow />
              </div>
            </div>
            <p style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'center',
              marginTop: '0.5rem',
              fontStyle: 'italic',
              display: 'none',
            }}
            className="mobile-scroll-hint">
              ← Scroll to view full diagram →
            </p>
          </div>

          <div style={{
            marginTop: '2rem',
          }}>
            <h3 style={{
              fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
              fontWeight: '500',
              marginBottom: '1rem',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              Scenario: Bank A tokenizes a US Treasury bond
            </h3>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
              lineHeight: '1.8',
              color: 'rgba(255, 255, 255, 0.75)',
            }}>
              <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(59, 130, 246, 0.6)' }}>•</span>
                Bank A implements the token using custom Solidity contract fields for instrument data (coupon rate, maturity date, ISIN, etc.)
              </li>
              <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(59, 130, 246, 0.6)' }}>•</span>
                Bank A transfers the tokenized bond to Bank B as part of a settlement
              </li>
              <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(239, 68, 68, 0.6)' }}>•</span>
                Bank B&apos;s off-chain systems (OMS, risk management, compliance) cannot read the custom contract structure
              </li>
              <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(239, 68, 68, 0.6)' }}>•</span>
                Bank B must manually extract instrument data or wait for Bank A to provide documentation
              </li>
              <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(239, 68, 68, 0.6)' }}>•</span>
                Without standardized descriptors, each counterparty requires custom integration code
              </li>
            </ul>
          </div>
          <style jsx>{`
            @media (max-width: 768px) {
              .mobile-scroll-hint {
                display: block !important;
              }
            }
          `}</style>
        </section>

        {/* Section 3: Custom Integration Overhead */}
        <section style={{
          marginBottom: 'clamp(4rem, 10vw, 8rem)',
          padding: 'clamp(2rem, 5vw, 3rem)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
            color: 'rgba(255, 255, 255, 0.95)',
          }}>
            Custom Integration Overhead
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
            color: 'rgba(255, 255, 255, 0.75)',
            marginBottom: '1.5rem',
            lineHeight: '1.6',
          }}>
            Every new token still requires bespoke work per counterparty. Even in the best case, this consumes weeks and repeats whenever schemas change.
          </p>

          <div>
            <div style={{
              padding: 'clamp(0.5rem, 2vw, 1.5rem)',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2)',
              marginBottom: '3rem',
            }}>
              <div style={{ minWidth: '750px' }}>
                <IntegrationFlow />
              </div>
            </div>
            <p style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'center',
              marginTop: '0.5rem',
              fontStyle: 'italic',
              display: 'none',
            }}
            className="mobile-scroll-hint">
              ← Scroll to view full diagram →
            </p>
          </div>

          <div style={{
            marginTop: '2rem',
          }}>
            <h3 style={{
              fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
              fontWeight: '500',
              marginBottom: '1rem',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              The Integration Timeline
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <div style={{
                padding: '1.25rem',
                background: 'rgba(100, 100, 100, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                  Week 1
                </div>
                <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' }}>
                  Documentation exchange
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                  Term sheets, contract specs, interface mapping
                </div>
              </div>

              <div style={{
                padding: '1.25rem',
                background: 'rgba(100, 100, 100, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                  Weeks 1–3
                </div>
                <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' }}>
                  Build custom adapter
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                  Per receiving institution
                </div>
              </div>

              <div style={{
                padding: '1.25rem',
                background: 'rgba(100, 100, 100, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                  Week 3–4
                </div>
                <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' }}>
                  Testing and validation
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                  Across all systems
                </div>
              </div>

              <div style={{
                padding: '1.25rem',
                background: 'rgba(100, 100, 100, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                  Week 4–5
                </div>
                <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' }}>
                  Production deployment
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                  And monitoring
                </div>
              </div>

              <div style={{
                padding: '1.25rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(239, 68, 68, 0.7)', marginBottom: '0.5rem' }}>
                  Ongoing
                </div>
                <div style={{ fontSize: '1rem', color: 'rgba(239, 68, 68, 0.9)', fontWeight: '500' }}>
                  Maintenance
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(239, 68, 68, 0.7)', marginTop: '0.25rem' }}>
                  When contract structure changes
                </div>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                <strong>Pain multiplier:</strong> N institutions × ~4 weeks ≈ <strong>N×4 weeks</strong> of engineering time
              </p>
              <p style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', margin: '0.5rem 0 0' }}>
                Ongoing maintenance repeats with every contract change
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}>
              <h4 style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '1rem',
                fontWeight: '600'
              }}>
                Operational Consequences
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: '1.8',
              }}>
                <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: 'rgba(239, 68, 68, 0.7)' }}>•</span>
                  Inaccurate records
                </li>
                <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: 'rgba(239, 68, 68, 0.7)' }}>•</span>
                  Complex account reconciliation
                </li>
                <li style={{ paddingLeft: '1.5rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: 'rgba(239, 68, 68, 0.7)' }}>•</span>
                  Lack of standardized reporting
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: The TradFi ↔ DeFi Disconnect */}
        <section style={{
          marginBottom: 'clamp(4rem, 10vw, 8rem)',
          padding: 'clamp(2rem, 5vw, 3rem)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
            color: 'rgba(255, 255, 255, 0.95)',
          }}>
            The TradFi ↔ DeFi Disconnect
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2rem',
            lineHeight: '1.6',
          }}>
            Lack of interoperability between traditional finance and blockchain ecosystems
          </p>

          <div>
            <div style={{
              padding: 'clamp(0.5rem, 2vw, 1.5rem)',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2)',
              marginBottom: '3rem',
            }}>
              <div style={{ minWidth: '700px' }}>
                <FragmentedEcosystem />
              </div>
            </div>
            <p style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'center',
              marginTop: '0.5rem',
              fontStyle: 'italic',
              display: 'none',
            }}
            className="mobile-scroll-hint">
              ← Scroll to view full diagram →
            </p>
          </div>

          <div style={{
            marginTop: '2rem',
          }}>
            <h3 style={{
              fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
              fontWeight: '500',
              marginBottom: '1rem',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              Cross-Platform Settlement Challenge
            </h3>

            <p style={{
              fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.75)',
              marginBottom: '1.5rem',
            }}>
              Traditional finance systems (traditional brokers, investment banks, investment funds) have standardized on the FIX protocol for decades.
              Blockchain-based securities speak an entirely different language—custom JSON schemas, proprietary contract fields,
              and fragmented metadata standards. This fundamental incompatibility prevents seamless cross-platform settlement
              and forces institutions to build translation layers that introduce risk, delay, and operational overhead.
            </p>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.85)',
                margin: 0,
              }}>
                <strong>Example:</strong> A tokenized Treasury bond trading between a DeFi protocol and a traditional broker, investment bank, or investment fund
                requires manual reconciliation at every step. The DeFi contract has no concept of FIX tags. The traditional institution&apos;s
                OMS cannot parse blockchain metadata. Settlement that should take minutes takes days.
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'rgba(168, 85, 247, 0.05)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
          }}>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.85)',
              margin: 0,
              textAlign: 'center',
            }}>
              <strong>Why this matters:</strong> Without a common language, institutional capital remains siloed.
              Cross-platform settlement remains a manual process, preventing the liquidity and efficiency gains that tokenization promises.
            </p>
          </div>
        </section>

        {/* Section 5: Before vs. After */}
        <section style={{
          marginBottom: 'clamp(4rem, 10vw, 8rem)',
          padding: 'clamp(2rem, 5vw, 3rem)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
            color: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center',
          }}>
            Integration Process Comparison
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '3rem',
            lineHeight: '1.6',
            textAlign: 'center',
          }}>
            The difference between custom integration and standardized descriptors
          </p>

          <div>
            <div style={{
              padding: 'clamp(0.5rem, 2vw, 1.5rem)',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2)',
            }}>
              <div style={{ minWidth: '800px' }}>
                <BeforeAfter />
              </div>
            </div>
            <p style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'center',
              marginTop: '0.5rem',
              fontStyle: 'italic',
              display: 'none',
            }}
            className="mobile-scroll-hint">
              ← Scroll to view full diagram →
            </p>
          </div>
        </section>

        {/* Section 6: Why This Matters */}
        <section style={{
          marginBottom: 'clamp(4rem, 10vw, 8rem)',
          padding: 'clamp(2rem, 5vw, 3rem)',
          background: 'rgba(59, 130, 246, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center',
          }}>
            Real-World Impact
          </h2>
          <p style={{
            fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2.5rem',
            lineHeight: '1.6',
            textAlign: 'center',
          }}>
            These delays compound across the ecosystem, blocking capital flows and institutional adoption
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            <div style={{
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                color: 'rgba(59, 130, 246, 0.95)',
              }}>
                3–5 weeks
              </div>
              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'rgba(255, 255, 255, 0.9)',
              }}>
                Per Integration
              </h3>
              <p style={{
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.75)',
                margin: 0,
              }}>
                Multiplied by N counterparties. For 10 institutions, that&apos;s <strong style={{color: 'rgba(239, 68, 68, 0.9)'}}>40+ weeks</strong> of aggregated engineering time before full market access.
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                color: 'rgba(59, 130, 246, 0.95)',
              }}>
                $200K–500K
              </div>
              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'rgba(255, 255, 255, 0.9)',
              }}>
                Engineering Cost
              </h3>
              <p style={{
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.75)',
                margin: 0,
              }}>
                Per receiving institution for a single token. Senior developers building, testing, and maintaining custom adapters—before any revenue is generated.
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                color: 'rgba(59, 130, 246, 0.95)',
              }}>
                Manual Process
              </div>
              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'rgba(255, 255, 255, 0.9)',
              }}>
                Operational Risk
              </h3>
              <p style={{
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.75)',
                margin: 0,
              }}>
                Every contract change requires coordination across all counterparties. Settlement errors, reconciliation failures, and audit trails become manual operations.
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                color: 'rgba(59, 130, 246, 0.95)',
              }}>
                Zero Liquidity
              </div>
              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'rgba(255, 255, 255, 0.9)',
              }}>
                Until Integration
              </h3>
              <p style={{
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.75)',
                margin: 0,
              }}>
                Tokens remain siloed until each institution completes their custom work. No cross-platform trading, no secondary markets, no capital efficiency.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Transition to Solution */}
        <section style={{
          marginBottom: 'clamp(3rem, 8vw, 5rem)',
          padding: 'clamp(3rem, 6vw, 4rem)',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'rgba(255, 255, 255, 0.95)',
          }}>
            There&apos;s a Better Way
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            color: 'rgba(255, 255, 255, 0.75)',
            marginBottom: '2rem',
            lineHeight: '1.6',
            maxWidth: '700px',
            margin: '0 auto 2rem',
          }}>
            The solution is ERC-FIX: embed standardized FIX descriptors directly in your token contracts so existing
            systems can read them natively.
          </p>

          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'left',
          }}>
            <h3 style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
              fontWeight: '600',
              marginBottom: '0.75rem',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              Standardization: The Foundation of Modern Finance
            </h3>
            <p style={{
              fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
              color: 'rgba(255, 255, 255, 0.75)',
              lineHeight: '1.7',
              margin: 0,
            }}>
              Traditional finance has thrived on standards like SWIFT MT, FpML, and ISO 20022; enabling instant trade execution, automated reconciliation, and seamless settlement across thousands of institutions. ERC-FIX brings this proven approach to blockchain.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
              <h3 style={{ margin: 0, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Zero custom adapters</h3>
              <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.75)' }}>Read natively across 300+ FIX-compatible platforms.</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
              <h3 style={{ margin: 0, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Fast time-to-market</h3>
              <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.75)' }}>From 3–5 weeks to ~1 day per platform.</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
              <h3 style={{ margin: 0, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Cryptographic assurance</h3>
              <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.75)' }}>Versioned descriptors with verifiable fields.</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem' }}>
              <h3 style={{ margin: 0, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Scales with network</h3>
              <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.75)' }}>Integrations go from N×M to N+M when everyone speaks FIX.</p>
            </div>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 1.5rem' }}>
            Time savings: <strong>3–5 weeks → 1 day</strong> per platform.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link
              href="/explorer"
              style={{
                padding: '1rem 2rem',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                borderRadius: '8px',
                color: 'rgba(59, 130, 246, 0.95)',
                textDecoration: 'none',
                fontSize: '1.05rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Try the Demo
            </Link>
            <Link
              href="/spec"
              style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.85)',
                textDecoration: 'none',
                fontSize: '1.05rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Read the Spec
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: '2rem',
        paddingBottom: '2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.9rem',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <p style={{ margin: 0 }}>
            ERC-FIX by{' '}
            <a
              href="https://nethermind.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                transition: 'color 0.2s',
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }}
            >
              <img 
                src="/nethermind-icon.svg" 
                alt="Nethermind" 
                style={{ 
                  height: '1.2rem', 
                  width: '1.2rem',
                  display: 'block',
                  transform: 'translateY(0.25rem)',
                  marginLeft: '0.25rem'
                }} 
              />
              Nethermind
            </a>
          </p>
          <p style={{ margin: 0 }}>Standardized FIX descriptors for tokenized securities</p>
        </div>
        <p className="print-only" style={{ 
          display: 'none', 
          marginTop: '1rem',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.4)' 
        }}
        suppressHydrationWarning>
          Document generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </footer>
    </div>
  );
}

