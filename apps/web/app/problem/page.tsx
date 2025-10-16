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
      color: '#ffffff',
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
            The Integration Problem with Tokenized Securities
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '800px',
            margin: '0 auto 1.5rem',
            lineHeight: '1.6',
          }}>
            Blockchain tokens and traditional financial infrastructure cannot communicate without extensive custom development.
          </p>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
            color: 'rgba(255, 255, 255, 0.6)',
            maxWidth: '700px',
            margin: '0 auto',
          }}>
            Each new token requires 2-4 months of custom integration work per platform
          </p>
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
          }}>
            The Current Reality
          </h2>
          
          <div style={{
            marginBottom: '2rem',
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
              <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(245, 158, 11, 0.7)' }}>•</span>
                <strong>Result:</strong> Settlement delays, manual reconciliation, and operational risk
              </li>
            </ul>
          </div>

          <div>
            <div style={{
              marginTop: '3rem',
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
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2rem',
            lineHeight: '1.6',
          }}>
            Each token implementation requires platform-specific adapters
          </p>

          <div style={{
            marginBottom: '2rem',
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
                  Week 1-2
                </div>
                <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' }}>
                  Documentation exchange
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                  Term sheets, contract specifications
                </div>
              </div>

              <div style={{
                padding: '1.25rem',
                background: 'rgba(100, 100, 100, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                  Week 3-6
                </div>
                <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' }}>
                  Custom adapter development
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
                  Week 7-8
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
                  Week 9-12
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
            }}>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.85)',
                margin: 0,
                textAlign: 'center',
              }}>
                <strong>Real costs:</strong> Engineering resources, delayed settlement capabilities, reduced liquidity
              </p>
              <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: '0.5rem 0 0',
                textAlign: 'center',
              }}>
                Compounding effect: Each new token type restarts this cycle
              </p>
            </div>
          </div>

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
              <div style={{ minWidth: '700px' }}>
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

          <div style={{
            marginBottom: '2rem',
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
              Traditional finance systems (Bloomberg, custodians, OMS platforms) have standardized on the FIX protocol for decades. 
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
                <strong>Example:</strong> A tokenized Treasury bond trading between a DeFi protocol and a traditional custodian 
                requires manual reconciliation at every step. The DeFi contract has no concept of FIX tags. The custodian&apos;s 
                OMS cannot parse blockchain metadata. Settlement that should take minutes takes days.
              </p>
            </div>
          </div>

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
            marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
            color: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center',
          }}>
            Business Impact
          </h2>

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
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'rgba(59, 130, 246, 0.9)',
              }}>
                Speed to Market
              </h3>
              <p style={{
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.75)',
                margin: 0,
              }}>
                Launch in days, not months. Deploy once and integrate with every FIX-compatible platform instantly.
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'rgba(59, 130, 246, 0.9)',
              }}>
                Network Effects
              </h3>
              <p style={{
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.75)',
                margin: 0,
              }}>
                Each integration makes the next easier. Build on a foundation that every counterparty understands.
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'rgba(59, 130, 246, 0.9)',
              }}>
                Institutional Readiness
              </h3>
              <p style={{
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.75)',
                margin: 0,
              }}>
                Speak the language financial institutions already use. No learning curve, no adaptation required.
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: 'rgba(59, 130, 246, 0.9)',
              }}>
                Real Capital Unlock
              </h3>
              <p style={{
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.75)',
                margin: 0,
              }}>
                Enable seamless cross-platform settlement. Unlock liquidity when systems can communicate natively.
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
            ERC-FIX embeds standardized FIX descriptors directly in token contracts, enabling native integration 
            with existing financial infrastructure—no adapters, no waiting, no gatekeepers.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link
              href="/"
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
        <p>ERC-FIX: Standardized FIX descriptors for tokenized securities</p>
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

