# Generated ABIs

This directory contains TypeScript ABI files automatically generated from Foundry smart contract compilation.

## 🔄 Regeneration

To regenerate these files after contract changes:

```bash
npm run generate-abis
```

## 📁 Generated Files

- `DataContractFactory.ts` - ABI for SSTORE2-style data contract deployment
- `DescriptorRegistry.ts` - ABI for FIX descriptor registry contract  
- `FixMerkleVerifier.ts` - ABI for Merkle proof verification library

## ⚠️ Important

**Do not edit these files manually!** They are automatically generated from:
- `contracts/out/DataContractFactory.sol/DataContractFactory.json`
- `contracts/out/DescriptorRegistry.sol/DescriptorRegistry.json`
- `contracts/out/FixMerkleVerifier.sol/FixMerkleVerifier.json`

Changes should be made to the source Solidity contracts in the `contracts/src/` directory.

## 🔧 Build Process

The generation happens automatically during:
- `npm run vercel-build` (for Vercel deployment - with fallback to committed files)
- `npm run generate-abis` (manual generation - requires Foundry)
- `npm run generate-abis-if-possible` (safe generation with fallback)

### Vercel Deployment Strategy

On Vercel (where Foundry is not available):
1. Attempts to generate fresh ABIs if Foundry is available
2. Falls back to using committed ABI files if Foundry is not found
3. Continues with the build process regardless

This ensures deployments work even without Foundry in the build environment.

The script `scripts/generate-abis.js` handles the conversion from Foundry JSON to TypeScript.
