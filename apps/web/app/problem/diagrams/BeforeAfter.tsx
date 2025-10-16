export default function BeforeAfter() {
  return (
    <svg
      viewBox="0 0 1000 450"
      className="w-full h-auto"
      style={{ 
        maxWidth: '1000px', 
        margin: '0 auto',
        minHeight: '400px',
        touchAction: 'pan-x pinch-zoom'
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Without Standard - Left Side */}
      <g>
        <text x="250" y="40" textAnchor="middle" fill="rgba(239, 68, 68, 0.9)" fontSize="16" fontWeight="600">
          Without Standard
        </text>
        
        {/* Step 1 */}
        <rect
          x="100"
          y="70"
          width="300"
          height="50"
          rx="6"
          fill="rgba(100, 100, 100, 0.1)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />
        <text x="250" y="100" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Issue token with custom JSON
        </text>

        {/* Arrow */}
        <line x1="250" y1="120" x2="250" y2="145" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" markerEnd="url(#arrow-down)" />

        {/* Step 2 */}
        <rect
          x="100"
          y="145"
          width="300"
          height="50"
          rx="6"
          fill="rgba(100, 100, 100, 0.1)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />
        <text x="250" y="175" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Weeks of documentation
        </text>
        <text x="360" y="175" textAnchor="start" fill="rgba(239, 68, 68, 0.8)" fontSize="10">
          2-4 weeks
        </text>

        {/* Arrow */}
        <line x1="250" y1="195" x2="250" y2="220" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" markerEnd="url(#arrow-down)" />

        {/* Step 3 */}
        <rect
          x="100"
          y="220"
          width="300"
          height="50"
          rx="6"
          fill="rgba(100, 100, 100, 0.1)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />
        <text x="250" y="250" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Custom adapters per platform
        </text>
        <text x="360" y="250" textAnchor="start" fill="rgba(239, 68, 68, 0.8)" fontSize="10">
          8-12 weeks
        </text>

        {/* Arrow */}
        <line x1="250" y1="270" x2="250" y2="295" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" markerEnd="url(#arrow-down)" />

        {/* Step 4 */}
        <rect
          x="100"
          y="295"
          width="300"
          height="50"
          rx="6"
          fill="rgba(100, 100, 100, 0.1)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />
        <text x="250" y="325" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Manual updates & coordination
        </text>

        {/* Arrow */}
        <line x1="250" y1="345" x2="250" y2="370" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" markerEnd="url(#arrow-down)" />

        {/* Step 5 */}
        <rect
          x="100"
          y="370"
          width="300"
          height="50"
          rx="6"
          fill="rgba(239, 68, 68, 0.1)"
          stroke="rgba(239, 68, 68, 0.5)"
          strokeWidth="2"
        />
        <text x="250" y="400" textAnchor="middle" fill="rgba(239, 68, 68, 0.9)" fontSize="12" fontWeight="600">
          Integration breaks on changes
        </text>
      </g>

      {/* Divider */}
      <line
        x1="500"
        y1="30"
        x2="500"
        y2="420"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
        strokeDasharray="8,4"
      />

      {/* With ERC-FIX - Right Side */}
      <g>
        <text x="750" y="40" textAnchor="middle" fill="rgba(34, 197, 94, 0.9)" fontSize="16" fontWeight="600">
          With ERC-FIX
        </text>
        
        {/* Step 1 */}
        <rect
          x="600"
          y="70"
          width="300"
          height="50"
          rx="6"
          fill="rgba(34, 197, 94, 0.1)"
          stroke="rgba(34, 197, 94, 0.5)"
          strokeWidth="1"
        />
        <text x="750" y="100" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Issue token with FIX descriptor
        </text>
        <text x="860" y="100" textAnchor="start" fill="rgba(34, 197, 94, 0.8)" fontSize="10">
          1 day
        </text>

        {/* Arrow */}
        <line x1="750" y1="120" x2="750" y2="145" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="2" markerEnd="url(#arrow-down-green)" />

        {/* Step 2 */}
        <rect
          x="600"
          y="145"
          width="300"
          height="50"
          rx="6"
          fill="rgba(34, 197, 94, 0.1)"
          stroke="rgba(34, 197, 94, 0.5)"
          strokeWidth="1"
        />
        <text x="750" y="175" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Systems read FIX natively
        </text>
        <text x="860" y="175" textAnchor="start" fill="rgba(34, 197, 94, 0.8)" fontSize="10">
          Instant
        </text>

        {/* Arrow */}
        <line x1="750" y1="195" x2="750" y2="220" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="2" markerEnd="url(#arrow-down-green)" />

        {/* Step 3 */}
        <rect
          x="600"
          y="220"
          width="300"
          height="50"
          rx="6"
          fill="rgba(34, 197, 94, 0.1)"
          stroke="rgba(34, 197, 94, 0.5)"
          strokeWidth="1"
        />
        <text x="750" y="250" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Automatic integration
        </text>
        <text x="860" y="250" textAnchor="start" fill="rgba(34, 197, 94, 0.8)" fontSize="10">
          No dev work
        </text>

        {/* Arrow */}
        <line x1="750" y1="270" x2="750" y2="295" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="2" markerEnd="url(#arrow-down-green)" />

        {/* Step 4 */}
        <rect
          x="600"
          y="295"
          width="300"
          height="50"
          rx="6"
          fill="rgba(34, 197, 94, 0.1)"
          stroke="rgba(34, 197, 94, 0.5)"
          strokeWidth="1"
        />
        <text x="750" y="325" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Cryptographic verification
        </text>

        {/* Arrow */}
        <line x1="750" y1="345" x2="750" y2="370" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="2" markerEnd="url(#arrow-down-green)" />

        {/* Step 5 */}
        <rect
          x="600"
          y="370"
          width="300"
          height="50"
          rx="6"
          fill="rgba(34, 197, 94, 0.15)"
          stroke="rgba(34, 197, 94, 0.6)"
          strokeWidth="2"
        />
        <text x="750" y="400" textAnchor="middle" fill="rgba(34, 197, 94, 0.95)" fontSize="12" fontWeight="600">
          Updates are versioned automatically
        </text>
      </g>

      {/* Arrow markers */}
      <defs>
        <marker
          id="arrow-down"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <polygon points="0 0, 10 5, 0 10" fill="rgba(255, 255, 255, 0.3)" />
        </marker>
        <marker
          id="arrow-down-green"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <polygon points="0 0, 10 5, 0 10" fill="rgba(34, 197, 94, 0.5)" />
        </marker>
      </defs>
    </svg>
  );
}

