export default function IntegrationFlow() {
  return (
    <svg
      viewBox="0 0 900 600"
      className="w-full h-auto"
      style={{ 
        maxWidth: '900px', 
        margin: '0 auto',
        minHeight: '500px',
        touchAction: 'pan-x pinch-zoom'
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Bank A - Token Issuer */}
      <g>
        <rect
          x="50"
          y="50"
          width="180"
          height="80"
          rx="8"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth="2"
        />
        <text x="140" y="80" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="600">
          Bank A
        </text>
        <text x="140" y="100" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          Token Issuer
        </text>
        <text x="140" y="115" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.6" fontFamily="monospace">
          Custom contract fields
        </text>
      </g>

      {/* Bank B + OMS */}
      <g>
        <rect
          x="350"
          y="50"
          width="180"
          height="80"
          rx="8"
          fill="rgba(239, 68, 68, 0.1)"
          stroke="rgba(239, 68, 68, 0.5)"
          strokeWidth="2"
        />
        <text x="440" y="75" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="600">
          Bank B
        </text>
        <text x="440" y="95" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          Must build custom adapter
        </text>
        <text x="440" y="110" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          → OMS Integration
        </text>
        <text x="440" y="125" textAnchor="middle" fill="rgba(239, 68, 68, 0.8)" fontSize="10" fontWeight="500">
          8-12 weeks
        </text>
      </g>

      {/* Arrow Bank A to Bank B */}
      <line
        x1="240"
        y1="90"
        x2="340"
        y2="90"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />

      {/* Bank C + Risk System */}
      <g>
        <rect
          x="350"
          y="180"
          width="180"
          height="80"
          rx="8"
          fill="rgba(239, 68, 68, 0.1)"
          stroke="rgba(239, 68, 68, 0.5)"
          strokeWidth="2"
        />
        <text x="440" y="205" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="600">
          Bank C
        </text>
        <text x="440" y="225" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          Must build different adapter
        </text>
        <text x="440" y="240" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          → Risk System Integration
        </text>
        <text x="440" y="255" textAnchor="middle" fill="rgba(239, 68, 68, 0.8)" fontSize="10" fontWeight="500">
          8-12 weeks
        </text>
      </g>

      {/* Arrow Bank A to Bank C */}
      <line
        x1="230"
        y1="130"
        x2="350"
        y2="200"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />

      {/* Bank D + Custodian */}
      <g>
        <rect
          x="350"
          y="310"
          width="180"
          height="80"
          rx="8"
          fill="rgba(239, 68, 68, 0.1)"
          stroke="rgba(239, 68, 68, 0.5)"
          strokeWidth="2"
        />
        <text x="440" y="335" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="600">
          Bank D
        </text>
        <text x="440" y="355" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          Must build another adapter
        </text>
        <text x="440" y="370" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          → Custodian Integration
        </text>
        <text x="440" y="385" textAnchor="middle" fill="rgba(239, 68, 68, 0.8)" fontSize="10" fontWeight="500">
          8-12 weeks
        </text>
      </g>

      {/* Arrow Bank A to Bank D */}
      <line
        x1="230"
        y1="130"
        x2="350"
        y2="330"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />

      {/* Integration Steps Breakdown */}
      <g>
        <rect
          x="600"
          y="50"
          width="250"
          height="340"
          rx="8"
          fill="rgba(100, 100, 100, 0.05)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
        />
        <text x="725" y="75" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">
          Per-Institution Timeline
        </text>
        
        <text x="615" y="105" fill="currentColor" fontSize="11" opacity="0.8" fontWeight="500">
          Week 1-2:
        </text>
        <text x="615" y="120" fill="currentColor" fontSize="10" opacity="0.7">
          Documentation exchange
        </text>
        <text x="615" y="133" fill="currentColor" fontSize="10" opacity="0.6">
          (term sheets, specs)
        </text>

        <text x="615" y="160" fill="currentColor" fontSize="11" opacity="0.8" fontWeight="500">
          Week 3-6:
        </text>
        <text x="615" y="175" fill="currentColor" fontSize="10" opacity="0.7">
          Custom adapter development
        </text>

        <text x="615" y="202" fill="currentColor" fontSize="11" opacity="0.8" fontWeight="500">
          Week 7-8:
        </text>
        <text x="615" y="217" fill="currentColor" fontSize="10" opacity="0.7">
          Testing and validation
        </text>

        <text x="615" y="244" fill="currentColor" fontSize="11" opacity="0.8" fontWeight="500">
          Week 9-12:
        </text>
        <text x="615" y="259" fill="currentColor" fontSize="10" opacity="0.7">
          Production deployment
        </text>

        <text x="615" y="286" fill="currentColor" fontSize="11" opacity="0.8" fontWeight="500">
          Ongoing:
        </text>
        <text x="615" y="301" fill="currentColor" fontSize="10" opacity="0.7">
          Maintenance when contract
        </text>
        <text x="615" y="314" fill="currentColor" fontSize="10" opacity="0.7">
          structure changes
        </text>

        <rect
          x="610"
          y="335"
          width="230"
          height="45"
          rx="4"
          fill="rgba(239, 68, 68, 0.1)"
          stroke="rgba(239, 68, 68, 0.3)"
          strokeWidth="1"
        />
        <text x="725" y="355" textAnchor="middle" fill="rgba(239, 68, 68, 0.9)" fontSize="12" fontWeight="600">
          Each new token type
        </text>
        <text x="725" y="370" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">
          restarts this cycle
        </text>
      </g>

      {/* Costs Summary */}
      <g>
        <rect
          x="50"
          y="480"
          width="800"
          height="90"
          rx="6"
          fill="rgba(245, 158, 11, 0.05)"
          stroke="rgba(245, 158, 11, 0.3)"
          strokeWidth="1"
        />
        <text x="450" y="510" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="600">
          Real Costs
        </text>
        <text x="200" y="535" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.8">
          Engineering resources
        </text>
        <text x="450" y="535" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.8">
          Delayed settlement capabilities
        </text>
        <text x="700" y="535" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.8">
          Reduced liquidity
        </text>
        <text x="450" y="555" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          Compounding effect across all counterparties
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

