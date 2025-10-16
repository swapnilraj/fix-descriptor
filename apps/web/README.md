# FixDescriptorKit Web Application

> **Interactive demo and deployment interface for FIX descriptor transformation and onchain verification**

A Next.js 15 application that provides an interactive web interface for converting FIX asset descriptors into canonical CBOR and Merkle commitments, with full blockchain integration for deployment and verification.

[![Next.js](https://img.shields.io/badge/Next.js-15.5+-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 🎯 Purpose

This web application serves as:
- **Interactive Explorer** - Visualize the complete FIX → CBOR → Merkle transformation pipeline
- **Development Tool** - Test and debug descriptor transformations before deployment
- **Deployment Interface** - Deploy descriptors to blockchain networks via MetaMask
- **Specification Reference** - Browse the complete technical specification with examples
- **Educational Demo** - Learn how FIX descriptors work through live visualizations

## ✨ Key Features

### 1. **Interactive Transformation Explorer**
- **FIX Parser** - Real-time parsing of FIX messages with validation
- **Tree Visualizer** - Interactive hierarchical view of the canonical descriptor tree
- **CBOR Inspector** - Hex dump and decoded view of canonical CBOR bytes
- **Merkle Tree Viewer** - Visual representation of Merkle tree structure with leaf enumeration

### 2. **Field Inspector**
- **Path Browser** - Navigate descriptor fields by hierarchical paths
- **Proof Generator** - Generate Merkle proofs for any field
- **Interactive Verification** - Test proof verification with visual feedback

### 3. **Blockchain Integration**
- **MetaMask Connection** - Seamless wallet integration for blockchain interactions
- **Multi-Network Support** - Deploy to Hoodi Testnet
- **Token Deployment** - Deploy ERC20 tokens with embedded FIX descriptors
- **Transaction Monitoring** - Real-time feedback on deployment status

### 4. **API Endpoints**
- **Preview API** (`/api/preview`) - Process FIX messages and return transformation results
- **Proof API** (`/api/proof`) - Generate Merkle proofs for specific field paths
- **Deploy API** (`/api/deploy-token`) - Server-side deployment coordination
- **Diagnostics API** (`/api/diagnostics`) - System health checks

### 5. **Technical Specification**
- **Complete Spec** - Full technical specification with interactive navigation
- **Running Examples** - Live examples throughout the spec (US Treasury Bond)
- **Architecture Diagrams** - Visual pipeline representations
- **Security & Gas Analysis** - Detailed cost breakdowns and security considerations

## 🗂️ Application Structure

```
apps/web/
├── app/
│   ├── page.tsx                      # Main explorer interface
│   ├── spec/
│   │   └── page.tsx                  # Technical specification page
│   ├── api/
│   │   ├── preview/route.ts          # Transformation preview endpoint
│   │   ├── proof/route.ts            # Merkle proof generation
│   │   ├── deploy-token/route.ts     # Deployment coordination
│   │   └── diagnostics/route.ts      # Health checks
│   ├── layout.tsx                    # Root layout with styling
│   └── globals.css                   # Global styles
├── lib/
│   ├── viemClient.ts                 # Blockchain client configuration
│   └── abis/                         # Smart contract ABIs
│       ├── AssetTokenERC20.ts
│       ├── AssetTokenERC721.ts
│       ├── AssetTokenFactory.ts
│       └── ...
├── public/                           # Static assets
└── package.json
```

## 🔧 Technology Stack

### Frontend
- **Next.js 15** - Full-stack React framework with App Router
- **React 19** - UI component library
- **TypeScript** - Type-safe development
- **Viem** - Ethereum library for wallet and contract interactions

### Backend (API Routes)
- **Next.js API Routes** - Serverless API endpoints
- **fixdescriptorkit-typescript** - Core transformation library
- **Zod** - Runtime validation for API inputs

### Blockchain
- **Viem** - Chain abstraction and wallet integration
- **MetaMask** - Browser wallet for transaction signing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask browser extension (for blockchain features)

### Installation

```bash
# From the repository root
cd apps/web

# Install dependencies
npm install

# Build the TypeScript library (required dependency)
npm run predev

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📖 Usage Guide

### 1. Exploring the Transformation Pipeline

1. **Navigate to the main page** (`/`)
2. **Enter or modify a FIX message** in the input panel
3. **View transformations** across four tabs:
   - **Tree View**: Hierarchical JSON representation
   - **CBOR View**: Binary encoding with hex dump
   - **Merkle Tree**: Visual tree structure with leaves
   - **Field Inspector**: Browse fields and generate proofs

### 2. Generating Merkle Proofs

1. Go to the **Field Inspector** tab
2. Select a field from the dropdown (e.g., `[15] Currency`)
3. View the generated proof with directions
4. Copy the proof for use in smart contracts

### 3. Deploying to Blockchain

1. **Connect MetaMask** using the "Connect Wallet" button
2. **Review Descriptor** - Verify CBOR size, Merkle root, gas estimates
3. **Configure Token** - Set name, symbol, initial supply
4. **Deploy** - Sign transaction in MetaMask
8. **Monitor Deployment** - View transaction hash and contract address

### 4. Reading the Specification

1. Navigate to `/spec`
2. Use the **sidebar navigation** to jump to sections
3. **Click section headings** to generate shareable links
4. Follow **"💡 See this in the explorer"** callouts to jump back to live demos

## 🔌 API Reference

### `POST /api/preview`

Process a FIX message and return all transformation results.

**Request:**
```json
{
  "fixRaw": "8=FIX.4.4|9=0000|35=d|55=ACME|15=USD|10=000"
}
```

**Response:**
```json
{
  "tree": { ... },
  "canonical": { ... },
  "cborHex": "a2...",
  "cborSize": 243,
  "leaves": [ ... ],
  "root": "0x7a3f...",
  "proof": { ... }
}
```

### `POST /api/proof`

Generate a Merkle proof for a specific field path.

**Request:**
```json
{
  "leaves": [ ... ],
  "path": [15]
}
```

**Response:**
```json
{
  "proof": ["0x1a2b...", "0x3c4d..."],
  "directions": [false, true],
  "leaf": "0xaabb..."
}
```

### `POST /api/deploy-token`

Coordinate deployment of a token with embedded descriptor.

**Request:**
```json
{
  "descriptorData": { ... },
  "tokenType": "ERC20",
  "tokenConfig": {
    "name": "My Token",
    "symbol": "MTK",
    "initialSupply": "1000000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0xdef...",
  "contractAddress": "0xabc..."
}
```

## 🎨 UI Components

### Main Explorer Interface (`page.tsx`)

- **Input Panel** - FIX message editor with syntax highlighting
- **Tab Navigation** - Switch between different views
- **Tree View Panel** - Expandable JSON tree with syntax highlighting
- **CBOR View Panel** - Hex dump with byte offset annotations
- **Merkle Tree Panel** - Visual tree with leaf enumeration
- **Field Inspector Panel** - Field browser with proof generation
- **Deployment Panel** - Wallet integration and transaction management

### Specification Page (`spec/page.tsx`)

- **Sticky Header** - Navigation and explorer link
- **Sidebar TOC** - Table of contents with active section highlighting
- **Main Content** - Full specification with examples
- **Section Anchors** - Clickable headings for deep linking
- **Explorer Callouts** - Links back to interactive demos
- **Code Examples** - Syntax-highlighted code blocks
- **Architecture Diagrams** - ASCII art pipeline visualizations

## 🌐 Supported Networks

| Network | Chain ID | RPC URL | Faucet |
|---------|----------|---------|--------|
| **Sepolia Testnet** | 11155111 | `https://ethereum-sepolia-rpc.publicnode.com` | [Sepolia Faucet](https://sepoliafaucet.com) |

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit

# Integration testing (requires running dev server)
# Test transformation pipeline
curl -X POST http://localhost:3000/api/preview \
  -H "Content-Type: application/json" \
  -d '{"fixRaw":"8=FIX.4.4|55=ACME|15=USD"}'

# Test proof generation
curl -X POST http://localhost:3000/api/proof \
  -H "Content-Type: application/json" \
  -d '{"leaves":[...],"path":[15]}'
```

## 📦 Deployment

### Vercel (Recommended)

This application is optimized for deployment on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

See [DEPLOYMENT.md](../../DEPLOYMENT.md) in the root for detailed instructions.

### Environment Variables

```env
# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Optional: Custom RPC endpoints
NEXT_PUBLIC_SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com
```

## 🛠️ Development

### Adding a New API Endpoint

1. Create a new route file in `app/api/your-endpoint/route.ts`
2. Export `GET`, `POST`, or other HTTP method handlers
3. Use Zod for request validation
4. Return JSON responses with proper error handling

Example:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  field: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    
    // Process request
    const result = processData(validated);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### Adding a New Network

1. Update the network list in `page.tsx`
2. Add the network configuration to `lib/viemClient.ts`
3. Update contract ABIs if needed

### Modifying the UI

- **Styling**: Uses inline styles for component isolation
- **State Management**: React hooks (`useState`, `useEffect`)
- **Type Safety**: All components are fully typed with TypeScript
- **Responsive**: UI adapts to mobile and desktop viewports

## 🔍 Troubleshooting

### MetaMask Not Connecting

- Ensure MetaMask is installed and unlocked
- Check that you're on a supported network
- Try refreshing the page and reconnecting

### Transformation Errors

- Verify FIX message syntax (pipe-delimited: `tag=value|tag=value`)
- Check that all required fields are present
- Use the browser console for detailed error messages

### Deployment Failures

- Verify wallet has sufficient funds for gas
- Check network connectivity
- Ensure contract ABIs are up to date
- Review transaction in block explorer

## 📚 Learn More

- **Main Repository**: [FixDescriptorKit](../../README.md)
- **Technical Specification**: `/spec` page or [SPEC.md](../../SPEC.md)
- **Deployment Guide**: [DEPLOYMENT.md](../../DEPLOYMENT.md)
- **TypeScript Library**: [fixdescriptorkit-typescript](../../packages/fixdescriptorkit-typescript/README.md)
- **Smart Contracts**: [contracts](../../contracts/README.md)

## 🤝 Contributing

Contributions are welcome! To add new features or fix bugs:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License - See [LICENSE](../../LICENSE) for details

---

**Built with ❤️ using Next.js and the FIX Protocol**