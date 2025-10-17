# Contract Verification Files

This directory contains files used for automatic Etherscan contract verification.

## Files

### `AssetTokenERC20-standard-json.json` (83KB) ⚠️ **MUST BE COMMITTED**

**Purpose:** Solidity standard JSON input for Etherscan verification

**Contains:**
- Complete source code for AssetTokenERC20 and all dependencies
- Compiler settings (version, optimization, etc.)
- File structure and mappings

**Important:** This file is loaded at build time by `contractSources.ts` and MUST be committed to git for Vercel deployments to work!

### `AssetTokenERC20-flattened.sol` (Legacy)

Legacy flattened source code. Not used in current implementation (standard JSON is preferred).

### `contractSources.ts`

TypeScript module that imports and exports the verification data:
- `ASSET_TOKEN_ERC20_STANDARD_JSON` - The standard JSON input
- `COMPILER_VERSION` - Solidity compiler version
- `OPTIMIZATION_ENABLED` - Optimization flag
- `OPTIMIZATION_RUNS` - Optimization runs

### `etherscan.ts`

Etherscan API client for contract verification:
- `verifyContract()` - Submit verification request
- `checkVerificationStatus()` - Check verification status
- `pollVerificationStatus()` - Poll until complete

## Regenerating the Standard JSON

**When to regenerate:**
- After modifying `AssetTokenERC20.sol`
- After updating Solidity compiler version
- After changing optimization settings in `foundry.toml`

**How to regenerate:**

```bash
# Using npm script (recommended - from any directory)
npm run generate-verification-json

# Or from project root
./scripts/generate-verification-json.sh

# From web app directory
npm run generate-verification-json

# Then commit the changes
git add apps/web/lib/AssetTokenERC20-standard-json.json
git commit -m "Update contract verification JSON"
```

**Automatic Regeneration:**

The file is **automatically regenerated** before every build and dev run:
- ✅ `npm run dev` → Regenerates JSON (if forge available)
- ✅ `npm run build` → Regenerates JSON (if forge available)  
- ✅ Vercel builds: Uses committed file (Foundry not available)
- ⚠️ Always commit the file after contract changes!

**Workflow:**
1. Modify `AssetTokenERC20.sol`
2. Run `npm run dev` (JSON regenerates automatically)
3. Commit the updated JSON file
4. Push to Vercel (uses your committed file)

## Vercel Deployment

**The standard JSON file is pre-generated and committed to git**, so:
- ✅ No forge/foundry needed during Vercel build
- ✅ File is included in the deployment automatically
- ✅ Verification works on serverless functions

**Do NOT add this file to `.gitignore`!**

## How Verification Works

1. User deploys token through webapp
2. Token contract is deployed via AssetTokenFactory
3. `/api/verify-contract` endpoint is called automatically
4. Endpoint uses pre-generated standard JSON
5. Etherscan compiles and verifies the contract
6. User sees "✅ Contract Verified" message

## Troubleshooting

### "Contract source not available" error
- Make sure `AssetTokenERC20-standard-json.json` is committed
- Check that the file is included in the Vercel deployment

### "Compilation error" during verification
- Regenerate the standard JSON: `./scripts/generate-verification-json.sh`
- Ensure compiler version matches: check `foundry.toml` and `contractSources.ts`

### "Already verified" response
- This is normal! The contract was previously verified
- The webapp handles this gracefully

## File Size

The standard JSON file is ~83KB, which is acceptable for:
- Git repository (small compared to dependencies)
- Vercel deployment (well within limits)
- API payload (< 100KB is fine)

## Related Documentation

- [CONTRACT_VERIFICATION.md](../../../CONTRACT_VERIFICATION.md) - Complete verification guide
- [IMPLEMENTATION_SUMMARY_VERIFICATION.md](../../../IMPLEMENTATION_SUMMARY_VERIFICATION.md) - Technical details

