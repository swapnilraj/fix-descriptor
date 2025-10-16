export default function IncompatibilityFlow() {
  // Bank icon component
  const BankIcon = ({ x, y, color, opacity = 0.8 }: { x: number; y: number; color: string; opacity?: number }) => (
    <g transform={`translate(${x}, ${y})`}>
      {/* Roof/Pediment */}
      <path
        d="M 0 0 L 40 -20 L 80 0 Z"
        fill={color}
        opacity={opacity}
      />
      {/* Base platform */}
      <rect x="0" y="60" width="80" height="8" fill={color} opacity={opacity} />
      <rect x="-4" y="68" width="88" height="6" fill={color} opacity={opacity} />
      
      {/* Columns */}
      <rect x="8" y="0" width="10" height="60" fill={color} opacity={opacity} />
      <rect x="35" y="0" width="10" height="60" fill={color} opacity={opacity} />
      <rect x="62" y="0" width="10" height="60" fill={color} opacity={opacity} />
      
      {/* Column capitals */}
      <rect x="6" y="-3" width="14" height="3" fill={color} opacity={opacity} />
      <rect x="33" y="-3" width="14" height="3" fill={color} opacity={opacity} />
      <rect x="60" y="-3" width="14" height="3" fill={color} opacity={opacity} />
    </g>
  );

  return (
    <svg
      viewBox="0 0 900 450"
      className="w-full h-auto"
      style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        display: 'block',
        minHeight: '400px',
        touchAction: 'pan-x pinch-zoom'
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Bank A Section */}
      <g>
        {/* Background box */}
        <rect
          x="80"
          y="40"
          width="240"
          height="160"
          rx="8"
          fill="rgba(59, 130, 246, 0.05)"
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="2"
        />
        
        {/* Bank Icon */}
        <BankIcon x={160} y={70} color="rgba(59, 130, 246, 1)" opacity={0.7} />
        
        <text x="200" y="165" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="600">
          Bank A
        </text>
        <text x="200" y="182" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          Smart Contract
        </text>
      </g>
      
      {/* Contract Fields Box */}
      <g>
        <rect
          x="80"
          y="210"
          width="240"
          height="80"
          rx="6"
          fill="rgba(59, 130, 246, 0.08)"
          stroke="rgba(59, 130, 246, 0.25)"
          strokeWidth="1"
        />
        <text x="95" y="232" fill="currentColor" fontSize="10" opacity="0.7" fontFamily="monospace">
          customCouponRate
        </text>
        <text x="95" y="250" fill="currentColor" fontSize="10" opacity="0.7" fontFamily="monospace">
          customMaturityDate
        </text>
        <text x="95" y="268" fill="currentColor" fontSize="10" opacity="0.7" fontFamily="monospace">
          customISIN
        </text>
      </g>

      {/* Transfer Arrow */}
      <g>
        <line
          x1="330"
          y1="120"
          x2="540"
          y2="120"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <text x="435" y="108" textAnchor="middle" fill="currentColor" fontSize="12" opacity="0.7">
          Transfer Token
        </text>
      </g>

      {/* Bank B Section - Unable to Parse */}
      <g>
        {/* Background box with dashed border */}
        <rect
          x="550"
          y="40"
          width="240"
          height="160"
          rx="8"
          fill="rgba(239, 68, 68, 0.05)"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="2"
          strokeDasharray="6,4"
        />
        
        {/* Bank Icon */}
        <BankIcon x={630} y={70} color="rgba(239, 68, 68, 1)" opacity={0.6} />
        
        <text x="670" y="165" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="600">
          Bank B
        </text>
        <text x="670" y="182" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          Off-chain Systems
        </text>
      </g>
      
      {/* Error State */}
      <g>
        <rect
          x="550"
          y="210"
          width="240"
          height="80"
          rx="6"
          fill="rgba(239, 68, 68, 0.08)"
          stroke="rgba(239, 68, 68, 0.3)"
          strokeWidth="1"
        />
        <text x="670" y="245" textAnchor="middle" fill="rgba(239, 68, 68, 0.9)" fontSize="32" fontWeight="600">
          ?
        </text>
        <text x="670" y="273" textAnchor="middle" fill="rgba(239, 68, 68, 0.8)" fontSize="11">
          Cannot parse custom fields
        </text>
      </g>

      {/* Alternative Path - Manual Process */}
      <g>
        <line
          x1="200"
          y1="300"
          x2="200"
          y2="330"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />
        <line
          x1="200"
          y1="330"
          x2="670"
          y2="330"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />
        <line
          x1="670"
          y1="330"
          x2="670"
          y2="300"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
          markerEnd="url(#arrowhead-alt)"
        />
        
        <rect
          x="385"
          y="310"
          width="130"
          height="40"
          rx="4"
          fill="rgba(245, 158, 11, 0.1)"
          stroke="rgba(245, 158, 11, 0.5)"
          strokeWidth="1"
        />
        <text x="450" y="328" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.8">
          Manual docs
        </text>
        <text x="450" y="342" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.8">
          + Custom adapter
        </text>
      </g>

      {/* Problem Highlight */}
      <g>
        <rect
          x="200"
          y="375"
          width="500"
          height="60"
          rx="6"
          fill="rgba(239, 68, 68, 0.05)"
          stroke="rgba(239, 68, 68, 0.3)"
          strokeWidth="1"
        />
        <text x="450" y="400" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="500">
          No standard format = No automatic integration
        </text>
        <text x="450" y="420" textAnchor="middle" fill="currentColor" fontSize="12" opacity="0.7">
          Each counterparty requires custom development
        </text>
      </g>

      {/* Arrow markers */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="rgba(255, 255, 255, 0.4)" />
        </marker>
        <marker
          id="arrowhead-alt"
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

