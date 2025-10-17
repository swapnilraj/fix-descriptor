export default function IntegrationFlow() {
  return (
    <svg
      viewBox="0 0 950 620"
      className="w-full h-auto"
      style={{ 
        maxWidth: '950px', 
        margin: '0 auto',
        minHeight: '500px',
        touchAction: 'pan-x pinch-zoom'
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Title */}
      <text x="475" y="30" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="600" opacity="0.9">
        The N×M Problem: Every Token × Every Counterparty
      </text>

      {/* Bank A - Token Issuer */}
      <g>
        <rect
          x="50"
          y="70"
          width="200"
          height="90"
          rx="8"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth="2"
        />
        <text x="150" y="105" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="600">
          Issuer
        </text>
        <text x="150" y="125" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.75">
          Issues token with
        </text>
        <text x="150" y="140" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.75" fontFamily="monospace">
          custom contract schema
        </text>
      </g>

      {/* Institution 1 + OMS */}
      <g>
        <rect
          x="380"
          y="70"
          width="200"
          height="90"
          rx="8"
          fill="rgba(239, 68, 68, 0.08)"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="2"
        />
        <text x="480" y="100" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="600">
          Institution 1
        </text>
        <text x="480" y="120" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.75">
          Custom adapter for OMS
        </text>
        <text x="480" y="148" textAnchor="middle" fill="rgba(239, 68, 68, 0.85)" fontSize="11" fontWeight="600">
          ~3–5 weeks
        </text>
      </g>

      {/* Arrow Issuer to Institution 1 */}
      <line
        x1="260"
        y1="115"
        x2="370"
        y2="115"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />

      {/* Institution 2 + Risk System */}
      <g>
        <rect
          x="380"
          y="200"
          width="200"
          height="90"
          rx="8"
          fill="rgba(239, 68, 68, 0.08)"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="2"
        />
        <text x="480" y="230" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="600">
          Institution 2
        </text>
        <text x="480" y="250" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.75">
          Custom adapter for Risk
        </text>
        <text x="480" y="278" textAnchor="middle" fill="rgba(239, 68, 68, 0.85)" fontSize="11" fontWeight="600">
          ~3–5 weeks
        </text>
      </g>

      {/* Arrow Issuer to Institution 2 */}
      <line
        x1="240"
        y1="160"
        x2="380"
        y2="230"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />

      {/* Institution 3 + Custodian */}
      <g>
        <rect
          x="380"
          y="330"
          width="200"
          height="90"
          rx="8"
          fill="rgba(239, 68, 68, 0.08)"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="2"
        />
        <text x="480" y="360" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="600">
          Institution 3
        </text>
        <text x="480" y="380" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.75">
          Custom adapter for Custody
        </text>
        <text x="480" y="408" textAnchor="middle" fill="rgba(239, 68, 68, 0.85)" fontSize="11" fontWeight="600">
          ~3–5 weeks
        </text>
      </g>

      {/* Arrow Issuer to Institution 3 */}
      <line
        x1="240"
        y1="160"
        x2="380"
        y2="360"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />

      {/* "..." to show more */}
      <text x="480" y="455" textAnchor="middle" fill="currentColor" fontSize="24" opacity="0.4" fontWeight="300">
        ⋮
      </text>

      {/* Integration Steps Breakdown */}
      <g>
        <rect
          x="650"
          y="70"
          width="260"
          height="350"
          rx="8"
          fill="rgba(100, 100, 100, 0.05)"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1.5"
        />
        <text x="780" y="95" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600" opacity="0.95">
          Per-Institution Work
        </text>
        
        <text x="665" y="125" fill="currentColor" fontSize="11" opacity="0.85" fontWeight="600">
          Week 1:
        </text>
        <text x="665" y="142" fill="currentColor" fontSize="10" opacity="0.7">
          • Documentation exchange
        </text>
        <text x="665" y="157" fill="currentColor" fontSize="10" opacity="0.65">
          • Interface mapping
        </text>

        <text x="665" y="185" fill="currentColor" fontSize="11" opacity="0.85" fontWeight="600">
          Weeks 1–3:
        </text>
        <text x="665" y="202" fill="currentColor" fontSize="10" opacity="0.7">
          • Build custom adapter
        </text>
        <text x="665" y="217" fill="currentColor" fontSize="10" opacity="0.65">
          • Schema parsing logic
        </text>

        <text x="665" y="245" fill="currentColor" fontSize="11" opacity="0.85" fontWeight="600">
          Week 3–4:
        </text>
        <text x="665" y="262" fill="currentColor" fontSize="10" opacity="0.7">
          • Testing & validation
        </text>

        <text x="665" y="290" fill="currentColor" fontSize="11" opacity="0.85" fontWeight="600">
          Week 4–5:
        </text>
        <text x="665" y="307" fill="currentColor" fontSize="10" opacity="0.7">
          • Production deployment
        </text>

        <text x="665" y="335" fill="currentColor" fontSize="11" opacity="0.85" fontWeight="600">
          Ongoing:
        </text>
        <text x="665" y="352" fill="currentColor" fontSize="10" opacity="0.7">
          • Maintenance on changes
        </text>

        <rect
          x="660"
          y="375"
          width="240"
          height="35"
          rx="4"
          fill="rgba(239, 68, 68, 0.1)"
          stroke="rgba(239, 68, 68, 0.35)"
          strokeWidth="1.5"
        />
        <text x="780" y="397" textAnchor="middle" fill="rgba(239, 68, 68, 0.9)" fontSize="11" fontWeight="600">
          × N institutions = N×4 weeks
        </text>
      </g>

      {/* Impact Summary */}
      <g>
        <rect
          x="50"
          y="500"
          width="860"
          height="100"
          rx="8"
          fill="rgba(245, 158, 11, 0.06)"
          stroke="rgba(245, 158, 11, 0.35)"
          strokeWidth="1.5"
        />
        <text x="480" y="530" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600" opacity="0.9">
          Ecosystem Impact
        </text>
        
        <text x="175" y="560" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.8" fontWeight="500">
          Delayed Time-to-Market
        </text>
        <text x="175" y="577" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.65">
          Weeks per counterparty
        </text>
        
        <text x="480" y="560" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.8" fontWeight="500">
          Ongoing Maintenance Burden
        </text>
        <text x="480" y="577" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.65">
          Every contract change repeats
        </text>
        
        <text x="785" y="560" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.8" fontWeight="500">
          Fragmented Liquidity
        </text>
        <text x="785" y="577" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.65">
          Limited interoperability
        </text>
      </g>

      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="rgba(255, 255, 255, 0.3)" />
        </marker>
      </defs>
    </svg>
  );
}

