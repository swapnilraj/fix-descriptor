# FixDescriptorKit Deployment Guide

## Deploy to Vercel

### Option 1: Deploy from Repository Root (Recommended)

1. **Connect your GitHub repository to Vercel**
2. **Configure Project Settings in Vercel Dashboard:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run vercel-build` (from root)
   - **Output Directory:** `apps/web/.next`
   - **Install Command:** `npm install` (from root)

### Option 2: Deploy from apps/web directory (Alternative)
```bash
cd /Users/swp/dev/swapnilraj/fixdescriptorkit-evm/apps/web
vercel --prod
```

**Note:** The first option is recommended for monorepo deployments as it handles dependencies correctly.

### 2. Set Environment Variables in Vercel Dashboard

After deployment, go to your Vercel project dashboard → Settings → Environment Variables and add:

**Required Environment Variable:**
- **Name:** `FIXPARSER_LICENSE_KEY`
- **Value:** `FIXParser_QjtkyzBGvFLS0tLS1CRUdJTiBQR1AgU0lHTkVEIE1FU1NBR0UtLS0tLQpIYXNoOiBTSEE1MTIKCjguMy4zfHN3cEBuZXRoZXJtaW5kLmlvfDE3ODgzOTM2MDAwMDB8ZnJlZQotLS0tLUJFR0lOIFBHUCBTSUdOQVRVUkUtLS0tLQoKd3JzRUFSWUtBRzBGZ21pNGZYZ0pFQ0p3M09mWVRzVEpSUlFBQUFBQUFCd0FJSE5oYkhSQWJtOTBZWFJwCmIyNXpMbTl3Wlc1d1ozQnFjeTV2Y21jaHZ2SS9ZQnR1QlB1R3ozKzY3Y3hWcitPeEZveE8xNzhLL1dtdApUSlAxeGhZaEJDVmdXQ2dKSU50bVgrZVpnaUp3M09mWVRzVEpBQUNHYWdEK0o3ZTN4ZzByc0d4TVYwZlEKMzlIM29EUjFlTitPb2xCR2VKM002djkxVGhBQS8yeEFlSUlhbi9VaS9qT2xyNVdRdGdGR1BpemYrbjdwCmpZMWllZEJVTkxnTgo9eGZNWgotLS0tLUVORCBQR1A=`
- **Environments:** Production, Preview, Development

**Optional Contract Environment Variables:**
- **Name:** `NEXT_PUBLIC_DATA_FACTORY_ADDRESS`
- **Value:** Your deployed DataContractFactory address
- **Name:** `NEXT_PUBLIC_DESCRIPTOR_REGISTRY_ADDRESS` 
- **Value:** Your deployed DescriptorRegistry address

### 3. Redeploy to Apply Environment Variables
```bash
vercel --prod
```

## Build Process

The deployment will:
1. Install dependencies from the monorepo root
2. Build the `fixdescriptorkit-typescript` library
3. Build the Next.js application
4. Deploy serverless functions for API routes

## Features

✅ FIX message parsing and canonicalization
✅ CBOR encoding with deterministic output  
✅ Merkle tree generation and proof verification
✅ On-chain deployment via SSTORE2
✅ Smart contract integration with Hoodi testnet
✅ Wallet connectivity and transaction signing

## Troubleshooting

If deployment fails:
1. Ensure you're deploying from the `apps/web` directory
2. Check that all dependencies are correctly installed
3. Verify environment variables are set in Vercel dashboard
4. Check build logs for specific error messages
