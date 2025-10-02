# Generated Test Data

**⚠️ DO NOT EDIT FILES IN THIS DIRECTORY MANUALLY**

This directory contains auto-generated Solidity test data files that are created by TypeScript scripts.

## Files

- `GeneratedCBORTestData.sol` - CBOR-encoded test descriptors
- `GeneratedMerkleData.sol` - Merkle roots and proofs for test data

## How to Regenerate

From the TypeScript package directory:

```bash
cd packages/fixdescriptorkit-typescript

# Generate both CBOR and Merkle data
npm run generate-test-data

# Or generate individually:
npm run generate-cbor    # Generate GeneratedCBORTestData.sol
npm run generate-merkle  # Generate GeneratedMerkleData.sol
```

This will regenerate both files based on the test cases defined in `scripts/generate-solidity-test-data.ts`.

**Script Usage:**
```bash
# The script accepts command-line arguments:
npx tsx scripts/generate-solidity-test-data.ts cbor    # Output CBOR data
npx tsx scripts/generate-solidity-test-data.ts merkle  # Output Merkle data
```

## Source of Truth

The **single source of truth** for all test data is:
- `packages/fixdescriptorkit-typescript/scripts/generate-solidity-test-data.ts`

All test descriptors (Simple, Large, Group, Nested, Bond, RealWorld) are defined there, and both CBOR encodings and Merkle proofs are generated from those definitions.

## Why Generated?

These files are generated rather than written manually to ensure:
1. **Consistency** - CBOR encoding matches exactly between TypeScript and Solidity
2. **Verification** - Merkle proofs are mathematically correct
3. **Maintainability** - Single source of truth for test data
4. **Reproducibility** - Anyone can regenerate identical test data

## Git Status

These files are **gitignored** and should not be committed to version control. Each developer generates them locally by running `npm run generate-test-data`.

To generate fresh test data after cloning the repo:
```bash
cd packages/fixdescriptorkit-typescript
npm install
npm run generate-test-data
```
