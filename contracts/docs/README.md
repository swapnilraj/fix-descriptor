# FIX Descriptor Contracts Documentation

Comprehensive documentation for the FIX Descriptor EVM contracts.

## Quick Start

**New to the project?** Start here:

1. 📖 [BUILD_AND_TEST.md](BUILD_AND_TEST.md) - Setup, build, and test instructions
2. 📊 [GAS_COMPARISON_ANALYSIS.md](GAS_COMPARISON_ANALYSIS.md) - **Key decision:** CBOR vs Merkle proofs
3. 📚 Choose your approach:
   - [CBOR_PARSER.md](CBOR_PARSER.md) - Direct CBOR field access
   - [MERKLE_VERIFIER.md](MERKLE_VERIFIER.md) - Merkle proof verification ⭐ **Recommended**

## Documentation Index

### Getting Started

| Document | Description | Audience |
|----------|-------------|----------|
| [BUILD_AND_TEST.md](BUILD_AND_TEST.md) | Build, test, and development workflow | Developers |
| [../README.md](../README.md) | Project overview and quick start | Everyone |

### Technical Guides

| Document | Description | Gas Cost |
|----------|-------------|----------|
| [CBOR_PARSER.md](CBOR_PARSER.md) | Binary search CBOR field parsing | 12k-80k gas |
| [MERKLE_VERIFIER.md](MERKLE_VERIFIER.md) | Merkle proof field verification | 6k-8.5k gas ⭐ |
| [GAS_COMPARISON_ANALYSIS.md](GAS_COMPARISON_ANALYSIS.md) | Detailed gas cost analysis | - |

### Implementation Details

| Document | Description |
|----------|-------------|
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Complete implementation overview |

## Architecture Overview

### Two Verification Approaches

The project implements **two complementary approaches** for accessing FIX Descriptor fields onchain:

#### 1. CBOR Parser (Direct Access)

**How it works:**
- Store full CBOR-encoded descriptor onchain
- Use binary search to find fields
- Parse values directly from CBOR

**Pros:**
- ✅ Access any field without additional data
- ✅ Can enumerate all fields
- ✅ Simpler client implementation

**Cons:**
- ❌ Expensive storage (500+ bytes)
- ❌ Gas scales with descriptor size (12k-80k)
- ❌ Nested access is very expensive (72k gas)

**Best for:**
- Small descriptors (2-3 fields)
- Frequent access to ALL fields
- Onchain enumeration requirements

**Documentation:** [CBOR_PARSER.md](CBOR_PARSER.md)

#### 2. Merkle Verifier (Proof-Based) ⭐ **Recommended**

**How it works:**
- Store only 32-byte Merkle root onchain
- Client provides Merkle proof for each field access
- Verify proof cryptographically

**Pros:**
- ✅ **500x cheaper storage** (32 bytes vs 500 bytes)
- ✅ **2-10x cheaper access** (6k-8.5k gas constant)
- ✅ Scales to any descriptor size
- ✅ Supports selective disclosure

**Cons:**
- ❌ Requires offchain proof generation
- ❌ Cannot enumerate fields onchain
- ❌ More complex client implementation

**Best for:**
- Large descriptors (10+ fields) ⭐
- Infrequent field access
- Storage cost optimization
- Production deployments

**Documentation:** [MERKLE_VERIFIER.md](MERKLE_VERIFIER.md)

### Gas Comparison Summary

| Operation | CBOR | Merkle | Winner |
|-----------|------|--------|--------|
| **Storage (500 bytes)** | 10M gas | 20k gas | Merkle (500x) ⭐ |
| **Access (2 fields)** | 12k gas | 6k gas | Merkle (2x) ⭐ |
| **Access (16 fields)** | 80k gas | 8.5k gas | Merkle (9x) ⭐ |
| **Nested group** | 72k gas | 7.7k gas | Merkle (9x) ⭐ |
| **Enumerate fields** | ✅ Possible | ❌ Not possible | CBOR |

**Recommendation:** Use **Merkle Verifier** for production (2-10x gas savings).

See [GAS_COMPARISON_ANALYSIS.md](GAS_COMPARISON_ANALYSIS.md) for complete analysis.

## Contract Reference

### Core Libraries

| Contract | Description | Documentation |
|----------|-------------|---------------|
| `FixCBORReader.sol` | Binary search CBOR field reader | [CBOR_PARSER.md](CBOR_PARSER.md) |
| `FixValueParser.sol` | Type-specific value parsing | [CBOR_PARSER.md](CBOR_PARSER.md) |
| `FixMerkleVerifier.sol` | Merkle proof verification | [MERKLE_VERIFIER.md](MERKLE_VERIFIER.md) |

### Example Implementations

| Contract | Description | Tests |
|----------|-------------|-------|
| `BondDescriptorReader.sol` | Example: Bond descriptor parser | 10 tests |
| `AssetToken.sol` | ERC-721 with FIX descriptors | 9 tests |
| `AssetTokenFactory.sol` | Token factory | 12 tests |

### Test Data (Auto-Generated)

| File | Description | Gitignored |
|------|-------------|------------|
| `generated/GeneratedCBORTestData.sol` | 6 CBOR test descriptors | ✅ Yes |
| `generated/GeneratedMerkleData.sol` | Merkle roots + 21 proofs | ✅ Yes |

**To regenerate:**
```bash
cd packages/fixdescriptorkit-typescript
npm run generate-test-data
```

## Test Coverage

### Test Suites (77 tests total)

| Suite | Tests | Coverage |
|-------|-------|----------|
| `FixCBORReaderTest` | 21 | CBOR parsing, binary search, groups |
| `GasComparisonTest` | 25 | CBOR vs Merkle gas benchmarks |
| `BondDescriptorReaderTest` | 10 | Example usage patterns |
| `AssetTokenTest` | 9 | ERC-721 integration |
| `AssetTokenFactoryTest` | 12 | Factory patterns |

**Run all tests:**
```bash
forge test --root contracts
```

**Run with gas report:**
```bash
forge test --root contracts --match-contract GasComparisonTest --gas-report
```

See [BUILD_AND_TEST.md](BUILD_AND_TEST.md) for detailed testing guide.

## Key Findings

### ✅ **Use Merkle Verifier for Production**

Based on comprehensive gas analysis, **Merkle proof verification is the recommended approach** for production deployments:

1. **500x cheaper storage** - Critical for onchain data
2. **2-10x cheaper access** - Significant savings on every read
3. **Constant gas cost** - Predictable regardless of descriptor size
4. **Scales to large descriptors** - Handles 50+ fields efficiently

### When to Use Each Approach

**Use CBOR Parser when:**
- Very small descriptors (2-3 fields)
- Need to enumerate all fields onchain
- Simplicity is more important than gas costs

**Use Merkle Verifier when:**
- Any descriptor with 5+ fields ⭐
- Storage cost is a concern
- Access patterns are selective
- Production deployment

## Development Workflow

### 1. Initial Setup

```bash
# Clone and install
git clone <repo>
cd fixdescriptorkit-evm
forge install
cd packages/fixdescriptorkit-typescript && npm install

# Generate test data
npm run generate-test-data
```

### 2. Build and Test

```bash
# Build contracts
forge build --root contracts

# Run tests
forge test --root contracts

# Gas report
forge test --root contracts --gas-report
```

### 3. Make Changes

```bash
# Edit contracts
vim contracts/src/MyContract.sol

# Run specific tests
forge test --root contracts --match-contract MyContractTest
```

See [BUILD_AND_TEST.md](BUILD_AND_TEST.md) for complete guide.

## TypeScript Integration

The TypeScript package provides:
- CBOR encoding/decoding
- Merkle tree generation
- Proof generation and verification
- Test data generation

**Location:** `packages/fixdescriptorkit-typescript/`

**Key functions:**
```typescript
import {
  encodeCanonicalCBOR,
  enumerateLeaves,
  computeRoot,
  generateProof
} from 'fixdescriptorkit-typescript';

// Encode descriptor
const cbor = encodeCanonicalCBOR({ 55: "AAPL", 223: "4.250" });

// Generate Merkle tree
const leaves = enumerateLeaves(descriptor);
const root = computeRoot(leaves);

// Generate proof
const proof = generateProof(leaves, [55]); // Symbol field
```

## Further Reading

### Specifications

- [SPEC.md](../../SPEC.md) - FIX Descriptor specification
- [ERC-FIX-DESCRIPTOR.md](../../ERC-FIX-DESCRIPTOR.md) - Token standard proposal

### External Resources

- [RFC 8949 - CBOR](https://www.rfc-editor.org/rfc/rfc8949.html)
- [Merkle Trees](https://en.wikipedia.org/wiki/Merkle_tree)
- [Foundry Book](https://book.getfoundry.sh/)
- [FIX Protocol](https://www.fixtrading.org/)

## Contributing

When adding new features:

1. Update relevant documentation in `contracts/docs/`
2. Add tests in `contracts/test/`
3. Update gas comparison if applicable
4. Regenerate test data if test cases changed

## Questions?

- 📖 Read [BUILD_AND_TEST.md](BUILD_AND_TEST.md) for setup issues
- 📊 Read [GAS_COMPARISON_ANALYSIS.md](GAS_COMPARISON_ANALYSIS.md) for gas questions
- 🔍 Check [CBOR_PARSER.md](CBOR_PARSER.md) or [MERKLE_VERIFIER.md](MERKLE_VERIFIER.md) for implementation details
