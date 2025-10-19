export default function FragmentedEcosystem() {
  return (
    <svg
      viewBox="0 0 900 560"
      className="w-full h-auto"
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: '500px',
        touchAction: 'pan-x pinch-zoom'
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* TradFi Side */}
      <g>
        <rect
          x="50"
          y="50"
          width="300"
          height="380"
          rx="8"
          fill="rgba(59, 130, 246, 0.08)"
          stroke="rgba(59, 130, 246, 0.4)"
          strokeWidth="2"
        />
        <text x="200" y="85" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="600">
          Traditional Finance
        </text>
        <text x="200" y="105" textAnchor="middle" fill="rgba(59, 130, 246, 0.8)" fontSize="12" fontWeight="500">
          All speaking FIX protocol
        </text>

        {/* OMS/EMS Platforms */}
        <rect
          x="80"
          y="130"
          width="240"
          height="50"
          rx="6"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth="1"
        />
        <text x="200" y="160" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="500">
          OMS/EMS Platforms
        </text>

        {/* Buy-Side (Asset Managers & Hedge Funds) */}
        <rect
          x="80"
          y="200"
          width="240"
          height="60"
          rx="6"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth="1"
        />
        <text x="200" y="223" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Buy-Side
        </text>
        <text x="200" y="239" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="500" opacity="0.85">
          (Asset Managers &amp; Hedge Funds)
        </text>

        {/* Sell-Side (Investment Banks, Brokers/Dealers) */}
        <rect
          x="80"
          y="280"
          width="240"
          height="60"
          rx="6"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth="1"
        />
        <text x="200" y="303" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Sell-Side
        </text>
        <text x="200" y="319" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="500" opacity="0.85">
          (Investment Banks, Brokers/Dealers)
        </text>

        {/* Trading Venues & Market Infra (Custodians, Fund Admins, Exchanges) */}
        <rect
          x="80"
          y="360"
          width="240"
          height="60"
          rx="6"
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth="1"
        />
        <text x="200" y="383" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">
          Trading Venues &amp; Market Infra
        </text>
        <text x="200" y="399" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="500" opacity="0.85">
          (Custodians, Fund Admins, Exchanges)
        </text>
      </g>

      {/* DeFi / Blockchain Side */}
      <g>
        <rect
          x="550"
          y="50"
          width="300"
          height="380"
          rx="8"
          fill="rgba(168, 85, 247, 0.08)"
          stroke="rgba(168, 85, 247, 0.4)"
          strokeWidth="2"
        />
        <text x="700" y="85" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="600">
          Blockchain / DeFi
        </text>
        <text x="700" y="105" textAnchor="middle" fill="rgba(168, 85, 247, 0.8)" fontSize="12" fontWeight="500">
          Custom formats / JSON
        </text>

        {/* Smart Contracts */}
        <rect
          x="580"
          y="130"
          width="240"
          height="50"
          rx="6"
          fill="rgba(168, 85, 247, 0.1)"
          stroke="rgba(168, 85, 247, 0.5)"
          strokeWidth="1"
        />
        <text x="700" y="160" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="500">
          Smart Contracts
        </text>

        {/* Token contracts (custom schemas) */}
        <rect x="580" y="200" width="240" height="50" rx="6" fill="rgba(168, 85, 247, 0.1)" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" />
        <text x="700" y="230" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="500">Token contracts (custom schemas)</text>

        {/* Issuer platforms */}
        <rect x="580" y="270" width="240" height="50" rx="6" fill="rgba(168, 85, 247, 0.1)" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" />
        <text x="700" y="300" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="500">Issuer platforms (proprietary)</text>

        {/* Explorers / raw contract data */}
        <rect x="580" y="340" width="240" height="50" rx="6" fill="rgba(168, 85, 247, 0.1)" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" />
        <text x="700" y="370" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="500">Explorers (raw contract data)</text>
      </g>

      {/* The Gap in the Middle */}
      <g>
        <rect
          x="370"
          y="150"
          width="160"
          height="200"
          rx="6"
          fill="rgba(239, 68, 68, 0.05)"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="2"
          strokeDasharray="6,4"
        />
        <text x="450" y="185" textAnchor="middle" fill="rgba(239, 68, 68, 0.9)" fontSize="16" fontWeight="600">
          The Gap
        </text>
        <text x="450" y="220" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.8">
          No common
        </text>
        <text x="450" y="237" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.8">
          language
        </text>
        <line
          x1="385"
          y1="260"
          x2="515"
          y2="260"
          stroke="rgba(239, 68, 68, 0.4)"
          strokeWidth="2"
        />
        <text x="450" y="285" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">Manual translation</text>
        <text x="450" y="300" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">Custom adapters</text>
        <text x="450" y="315" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">OMS requires manual entry</text>
        <text x="450" y="330" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">Risk systems need custom parsers</text>
      </g>

      {/* Broken connection lines */}
      <line
        x1="350"
        y1="250"
        x2="370"
        y2="250"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="2"
        strokeDasharray="4,4"
      />
      <line
        x1="530"
        y1="250"
        x2="550"
        y2="250"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="2"
        strokeDasharray="4,4"
      />

      {/* Bottom Impact Box */}
      <g>
        <rect
          x="100"
          y="460"
          width="700"
          height="50"
          rx="6"
          fill="rgba(239, 68, 68, 0.05)"
          stroke="rgba(239, 68, 68, 0.3)"
          strokeWidth="1"
        />
        <text x="450" y="485" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="600">
          Result: Prevents institutional adoption and cross-platform settlement
        </text>
        <text x="450" y="502" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">
          Each transaction requires manual reconciliation between systems
        </text>
      </g>
    </svg>
  );
}

