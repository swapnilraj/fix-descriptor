# Contract Verification Setup

This document explains the automated contract verification feature for deployed AssetTokenERC20 contracts.

## Overview

When a user deploys a token through the web app, the contract is automatically verified on Etherscan (or compatible block explorers). This allows users to:
- View the contract source code on the block explorer
- Interact with the contract directly from the block explorer
- Build trust through transparent, verified code

## Setup

### 1. Configure Etherscan API Key

Add your Etherscan API key to the environment:

```bash
# For the web app
cd apps/web
echo "NEXT_PUBLIC_ETHERSCAN_API_KEY=your_api_key_here" >> .env.local
```

**Get an API key:**
- Visit https://etherscan.io/myapikey (Ethereum Mainnet)
- Or https://sepolia.etherscan.io/myapikey (Sepolia Testnet)
- Sign up/login and create a new API key
- Free tier is sufficient for most use cases

### 2. Generate Contract Verification JSON

The verification process uses Foundry's standard JSON input format. This file is pre-generated and committed to the repository:

```
apps/web/lib/AssetTokenERC20-standard-json.json (~83KB)
```

**When to Regenerate:**
- After modifying `AssetTokenERC20.sol` or its dependencies
- After upgrading Solidity compiler version
- After changing optimization settings in `foundry.toml`

**How to Regenerate:**

```bash
# Using npm script (recommended)
npm run generate-verification-json

# Or run the script directly
./scripts/generate-verification-json.sh

# Commit the changes
git add apps/web/lib/AssetTokenERC20-standard-json.json
git commit -m "Update contract verification JSON"
```

**Automatic Generation:**

The verification JSON is **automatically regenerated** before every build and dev run if Foundry is available:

```bash
# Development (runs automatically)
npm run dev
# → prebuild: Generates verification JSON (if forge available)
# → Falls back silently if forge not available

# Production build (runs automatically)  
npm run build
# → prebuild: Generates verification JSON (if forge available)
# → Falls back silently if forge not available

# Vercel build (runs automatically)
npm run vercel-build
# → Tries to generate (fails on Vercel - no forge)
# → Uses committed file ✅
```

**Important:** 
- ✅ JSON regenerates automatically on every `npm run dev` or `npm run build`
- ✅ The generated file MUST be committed to git for Vercel deployments
- ✅ Vercel doesn't have Foundry, so it uses the committed file
- ⚠️ After modifying contracts, run `npm run dev` (or `build`) to regenerate, then commit

## How It Works

### Architecture

1. **Etherscan Client** (`apps/web/lib/etherscan.ts`)
   - Handles API communication with Etherscan
   - Submits verification requests
   - Polls verification status

2. **Contract Sources** (`apps/web/lib/contractSources.ts`)
   - Provides flattened contract source code
   - Defines compiler settings (version, optimization, etc.)

3. **Verification Endpoint** (`apps/web/app/api/verify-contract/route.ts`)
   - Server-side API route
   - Encodes constructor arguments
   - Submits verification to Etherscan
   - Polls for completion

4. **Frontend Integration** (`apps/web/app/explorer/page.tsx`)
   - Calls verification endpoint after successful deployment
   - Shows real-time status updates
   - Handles errors gracefully

### Deployment Flow

1. User fills in token details and clicks "Deploy Token"
2. Token is deployed via AssetTokenFactory
3. Transaction is confirmed and token address is extracted
4. **Verification starts automatically:**
   - UI shows "⏳ Verifying contract on block explorer..."
   - API encodes constructor arguments
   - Contract source and metadata are submitted to Etherscan
   - System polls for verification completion (up to 30 seconds)
5. **Verification completes:**
   - ✅ Success: "✓ Contract Verified" message shown
   - ⚠️ Failed: Warning shown, but deployment is still successful
   - User can view verified contract on block explorer

### Constructor Arguments

The AssetTokenERC20 contract has the following constructor:

```solidity
constructor(
    string memory name,
    string memory symbol,
    uint256 initialSupply,
    address initialOwner
)
```

During deployment through the factory:
- `initialOwner` is the factory address (factory sets descriptor, then transfers ownership)
- These arguments are ABI-encoded and sent to Etherscan for verification

## Supported Networks

The Etherscan client supports verification on:
- Ethereum Mainnet (chainId: 1)
- Sepolia Testnet (chainId: 11155111)
- Polygon, BSC, Arbitrum, Optimism, Base (and their testnets)

For unsupported networks, the verification step will fail gracefully without affecting the deployment.

## Compiler Settings

The contract is compiled with:
- **Solidity Version**: 0.8.20
- **Optimization**: Enabled
- **Runs**: 200
- **via-ir**: true (Foundry's intermediate representation mode)

These settings must match exactly between compilation and verification.

## Troubleshooting

### Verification Fails

Common reasons for verification failure:
1. **API key not set**: Add `NEXT_PUBLIC_ETHERSCAN_API_KEY` to `.env.local`
2. **Rate limiting**: Etherscan free tier has rate limits (5 requests/second)
3. **Contract already verified**: Etherscan won't re-verify already verified contracts
4. **Compiler mismatch**: Ensure flattened source matches deployed bytecode
5. **Constructor args mismatch**: Verify the encoded constructor arguments are correct

### Manual Verification

If automatic verification fails, you can verify manually:

1. Visit the block explorer (e.g., https://sepolia.etherscan.io)
2. Navigate to your contract address
3. Click "Contract" tab → "Verify and Publish"
4. Select "Solidity (Single file)"
5. Use these settings:
   - Compiler: v0.8.20+commit.a1b79de6
   - Optimization: Yes, 200 runs
   - Contract Name: `src/AssetTokenERC20.sol:AssetTokenERC20`
6. Paste the flattened source from `apps/web/lib/AssetTokenERC20-flattened.sol`
7. Enter constructor arguments (use the encoded hex from deployment)

### Regenerating Flattened Source

If you modify the contract and need to regenerate:

```bash
cd contracts
forge flatten src/AssetTokenERC20.sol > ../apps/web/lib/AssetTokenERC20-flattened.sol
cd ../apps/web/lib
# Fix the pragma line (line 2)
sed -i '' '2s/.*/pragma solidity ^0.8.20;/' AssetTokenERC20-flattened.sol
```

## Testing

To test the verification flow:

1. Deploy a test token on Sepolia
2. Check the deployment UI for verification status
3. Verify the contract appears verified on Sepolia Etherscan
4. Check that the "Read Contract" tab is available with decoded functions

## API Reference

### POST /api/verify-contract

Verifies a deployed contract on Etherscan.

**Request:**
```json
{
  "contractAddress": "0x...",
  "tokenName": "My Token",
  "tokenSymbol": "MTK",
  "initialSupply": "1000000000000000000000000",
  "initialOwner": "0x...",  // Factory address
  "chainId": 11155111
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Contract verified successfully",
  "guid": "...",
  "result": "Pass - Verified"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "message": "Verification failed or timed out",
  "guid": "...",
  "result": "...",
  "error": "..."
}
```

## Security Considerations

- The `NEXT_PUBLIC_ETHERSCAN_API_KEY` is exposed to the frontend
- This is acceptable for verification (read-only operation)
- Rate limits prevent abuse
- API key should still be kept private when possible (use server-side env vars in production)

## Future Enhancements

Potential improvements:
- Support for multi-file verification (standard JSON input)
- Async verification with webhook notifications
- Verification retry logic
- Support for more block explorers (Blockscout, etc.)
- Verification status persistence in database

