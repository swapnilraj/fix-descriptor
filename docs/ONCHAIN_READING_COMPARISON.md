# Reading FIX Parameters Onchain: CBOR Parsing vs Merkle Proof Verification

## Overview

When building smart contracts with embedded FIX descriptors, you need to read and verify field values onchain. This guide compares two approaches:

1. **CBOR Parsing** - Direct field access from CBOR data stored in SSTORE2
2. **Merkle Proof Verification** - Cryptographic verification using Merkle proofs

Both approaches store the CBOR descriptor via SSTORE2 as a baseline. The key difference is whether you also store a Merkle root and use proofs for verification.

**Quick Answer:** Merkle proofs are **2-10x more gas efficient** for field reads, with a one-time cost of 20k gas to store the root.

> **📊 Detailed Analysis:** For in-depth technical analysis with function-by-function breakdowns, real-world scenarios, and detailed calculations, see [Bond Descriptor Gas Analysis](BOND_DESCRIPTOR_GAS_ANALYSIS.md)

---

## Quick Reference

### Gas Costs Summary

| Approach | Symbol Read | MaturityDate Read | SecurityAltID Read | Savings |
|----------|-------------|-------------------|-------------------|---------|
| **CBOR** | 33,602 gas | 63,158 gas | 107,698 gas | — |
| **Merkle** | 9,712 gas | 9,733 gas | ~9,400 gas | **3.5-11.5x** |

### Storage Costs

- **CBOR only:** ~100-200k gas (baseline)
- **CBOR + Merkle root:** +20k gas (~10-20% more)

### Break-Even

After **1-2 field reads**, Merkle approach pays off the 20k upfront cost

### Running Tests

```bash
cd contracts

# Run all gas comparison tests
forge test --match-contract GasComparison --gas-report

# Run bond-specific tests  
forge test --match-contract BondDescriptorReaderTest --gas-report
forge test --match-contract BondGasSimple --gas-report
```

---

## Method 1: CBOR Parsing

### How It Works

```
┌─────────────────────────────────────────┐
│ Contract Storage                        │
│  • CBOR data in SSTORE2 (100-200k gas) │
└─────────────────────────────────────────┘
              ↓
         Read field
              ↓
┌─────────────────────────────────────────┐
│ Onchain Binary Search                   │
│  1. Read CBOR from SSTORE2              │
│  2. Parse CBOR structure                │
│  3. Binary search for tag               │
│  4. Extract and return value            │
└─────────────────────────────────────────┘
```

**Storage:** CBOR data in SSTORE2 contract bytecode (~100-200k gas depending on descriptor size)

**Read Process:** Binary search through CBOR map to find field by tag number

### Developer Experience

Reading fields is straightforward - just call a function with the tag number:

```solidity
// From contracts/src/examples/BondDescriptorReader.sol:98-103
function readSymbol() public view returns (string memory symbol) {
    bytes memory cbor = _readCBOR();
    FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, TAG_SYMBOL);
    require(result.found, "Symbol not found");
    return FixValueParser.extractString(result.value);
}
```

**Simple nested group access:**

```solidity
// From contracts/src/examples/BondDescriptorReader.sol:128-150
function readSecurityAltId(uint256 index)
    public
    view
    returns (string memory altId, string memory altIdSource)
{
    bytes memory cbor = _readCBOR();
    uint16[] memory path = new uint16[](3);

    // Read SecurityAltID
    path[0] = TAG_SECURITY_ALT_ID_GROUP;
    path[1] = uint16(index);
    path[2] = TAG_SECURITY_ALT_ID;

    FixCBORReader.ReadResult memory result = FixCBORReader.getFieldByPath(cbor, path);
    require(result.found, "SecurityAltID not found");
    altId = FixValueParser.extractString(result.value);

    // Read SecurityAltIDSource
    path[2] = TAG_SECURITY_ALT_ID_SRC;
    result = FixCBORReader.getFieldByPath(cbor, path);
    require(result.found, "SecurityAltIDSource not found");
    altIdSource = FixValueParser.extractString(result.value);
}
```

### Pros

✅ **Simple developer experience** - Direct field access, no proof generation needed  
✅ **No client-side complexity** - All logic is onchain  
✅ **Works out of the box** - No additional infrastructure required  
✅ **Good for small descriptors** - Efficient when descriptor has 2-5 fields  
✅ **Flexible** - Can read any field without preparation

### Cons

❌ **Variable gas costs** - Reads cost 12k-80k gas depending on descriptor size  
❌ **Poor scaling** - Larger descriptors = more expensive reads  
❌ **Nested groups are expensive** - Can cost 70k+ gas for deep paths  
❌ **No selective disclosure** - Full descriptor is stored onchain

---

## Method 2: Merkle Proof Verification

### How It Works

```
┌─────────────────────────────────────────┐
│ Contract Storage                        │
│  • CBOR data in SSTORE2 (100-200k gas) │
│  • Merkle root (20k gas)                │
└─────────────────────────────────────────┘
              ↑                  ↓
    Generate proof          Verify proof
         (offchain)           (onchain)
              ↑                  ↓
┌─────────────┴──────────────────┴─────────┐
│ 1. Client builds Merkle tree offchain    │
│ 2. Client generates proof for field      │
│ 3. Client submits: value + proof         │
│ 4. Contract verifies: proof + root = ✓   │
└──────────────────────────────────────────┘
```

**Storage:** CBOR data in SSTORE2 + Merkle root (32 bytes, 20k gas)

**Read Process:** 
1. Client generates Merkle proof offchain (from CBOR or cached tree)
2. Client calls contract with field value + proof
3. Contract verifies proof against stored Merkle root (constant ~6-8.5k gas)

### Developer Experience

Reading fields requires proof parameters but verification is cryptographically guaranteed:

```solidity
// MerkleProof struct for cleaner interface
// From contracts/src/examples/BondDescriptorMerkle.sol:26-29
struct MerkleProof {
    bytes32[] proof;
    bool[] directions;
}

// From contracts/src/examples/BondDescriptorMerkle.sol:95-109
function readSymbolWithProof(
    bytes calldata valueBytes,
    MerkleProof calldata merkleProof
) public view returns (string memory symbol) {
    // Build pathCBOR for tag 55: [55] -> 0x811837
    bytes memory pathCBOR = abi.encodePacked(uint8(0x81), uint8(0x18), uint8(TAG_SYMBOL));
    
    // Verify the Merkle proof
    require(
        _fixDescriptor.verifyFieldProof(pathCBOR, valueBytes, merkleProof.proof, merkleProof.directions),
        "Invalid Merkle proof for Symbol"
    );

    return string(valueBytes);
}
```

**Nested group access with proofs:**

```solidity
// From contracts/src/examples/BondDescriptorMerkle.sol:159-183
function readSecurityAltIdWithProof(
    uint256 index,
    bytes calldata altIdValueBytes,
    MerkleProof calldata altIdProof,
    bytes calldata altIdSourceValueBytes,
    MerkleProof calldata altIdSourceProof
) public view returns (string memory altId, string memory altIdSource) {
    // Build pathCBOR for SecurityAltID: [454, index, 455]
    bytes memory altIdPath = _buildNestedPath(TAG_SECURITY_ALT_ID_GROUP, uint16(index), TAG_SECURITY_ALT_ID);
    
    require(
        _fixDescriptor.verifyFieldProof(altIdPath, altIdValueBytes, altIdProof.proof, altIdProof.directions),
        "Invalid Merkle proof for SecurityAltID"
    );

    // Build pathCBOR for SecurityAltIDSource: [454, index, 456]
    bytes memory altIdSourcePath = _buildNestedPath(TAG_SECURITY_ALT_ID_GROUP, uint16(index), TAG_SECURITY_ALT_ID_SRC);
    
    require(
        _fixDescriptor.verifyFieldProof(altIdSourcePath, altIdSourceValueBytes, altIdSourceProof.proof, altIdSourceProof.directions),
        "Invalid Merkle proof for SecurityAltIDSource"
    );

    return (string(altIdValueBytes), string(altIdSourceValueBytes));
}
```

### Pros

✅ **Constant gas costs** - Always 6k-8.5k gas regardless of descriptor size  
✅ **Excellent scaling** - 16-field descriptor costs same as 2-field  
✅ **Massive savings on nested groups** - 10x cheaper than CBOR parsing  
✅ **Cryptographically secure** - Proof guarantees field authenticity  
✅ **Selective disclosure** - Can verify specific fields without revealing others

### Cons

❌ **More complex DX** - Requires proof generation infrastructure  
❌ **Client dependency** - Need TypeScript/SDK for proof generation  
❌ **Upfront storage cost** - Extra 20k gas to store Merkle root  
❌ **Requires preparation** - Must generate proof for each field access

---

## Side-by-Side UX Comparison

### Reading a Simple Field: Symbol

#### CBOR Approach
```solidity
// contracts/src/examples/BondDescriptorReader.sol:98-103
function readSymbol() public view returns (string memory) {
    bytes memory cbor = _readCBOR();
    FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, TAG_SYMBOL);
    require(result.found, "Symbol not found");
    return FixValueParser.extractString(result.value);
}

// Usage (onchain)
string memory symbol = bond.readSymbol();
```

**Developer Flow:**
1. Call contract function
2. Done ✓

**Gas Cost:** 12k-80k gas (varies with descriptor size)

---

#### Merkle Approach
```solidity
// contracts/src/examples/BondDescriptorMerkle.sol:95-109
function readSymbolWithProof(
    bytes calldata valueBytes,
    MerkleProof calldata merkleProof
) public view returns (string memory) {
    bytes memory pathCBOR = abi.encodePacked(uint8(0x81), uint8(0x18), uint8(TAG_SYMBOL));
    require(
        _fixDescriptor.verifyFieldProof(pathCBOR, valueBytes, merkleProof.proof, merkleProof.directions),
        "Invalid Merkle proof for Symbol"
    );
    return string(valueBytes);
}

// Usage (client-side)
const proof = generateProof(leaves, [55]); // Offchain
const symbol = await bond.readSymbolWithProof(
    proof.valueBytes,
    { proof: proof.proof, directions: proof.directions }
);
```

**Developer Flow:**
1. Generate Merkle proof offchain (TypeScript SDK)
2. Call contract with proof
3. Done ✓

**Gas Cost:** 6k-8.5k gas (constant, regardless of descriptor size)

---

### Reading Nested Group Fields: Security Alt ID

#### CBOR Approach
```solidity
// contracts/src/examples/BondDescriptorReader.sol:128-150
function readSecurityAltId(uint256 index)
    public
    view
    returns (string memory altId, string memory altIdSource)
{
    bytes memory cbor = _readCBOR();
    uint16[] memory path = new uint16[](3);
    
    path[0] = TAG_SECURITY_ALT_ID_GROUP;
    path[1] = uint16(index);
    path[2] = TAG_SECURITY_ALT_ID;
    
    FixCBORReader.ReadResult memory result = FixCBORReader.getFieldByPath(cbor, path);
    require(result.found, "SecurityAltID not found");
    altId = FixValueParser.extractString(result.value);
    
    path[2] = TAG_SECURITY_ALT_ID_SRC;
    result = FixCBORReader.getFieldByPath(cbor, path);
    require(result.found, "SecurityAltIDSource not found");
    altIdSource = FixValueParser.extractString(result.value);
}

// Usage
(string memory isin, string memory source) = bond.readSecurityAltId(0);
```

**Gas Cost:** ~72k gas (nested group parsing is expensive!)

---

#### Merkle Approach
```solidity
// contracts/src/examples/BondDescriptorMerkle.sol:159-183
function readSecurityAltIdWithProof(
    uint256 index,
    bytes calldata altIdValueBytes,
    MerkleProof calldata altIdProof,
    bytes calldata altIdSourceValueBytes,
    MerkleProof calldata altIdSourceProof
) public view returns (string memory altId, string memory altIdSource) {
    bytes memory altIdPath = _buildNestedPath(TAG_SECURITY_ALT_ID_GROUP, uint16(index), TAG_SECURITY_ALT_ID);
    require(
        _fixDescriptor.verifyFieldProof(altIdPath, altIdValueBytes, altIdProof.proof, altIdProof.directions),
        "Invalid Merkle proof for SecurityAltID"
    );
    
    bytes memory altIdSourcePath = _buildNestedPath(TAG_SECURITY_ALT_ID_GROUP, uint16(index), TAG_SECURITY_ALT_ID_SRC);
    require(
        _fixDescriptor.verifyFieldProof(altIdSourcePath, altIdSourceValueBytes, altIdSourceProof.proof, altIdSourceProof.directions),
        "Invalid Merkle proof for SecurityAltIDSource"
    );
    
    return (string(altIdValueBytes), string(altIdSourceValueBytes));
}

// Usage (client-side)
const altIdProof = generateProof(leaves, [454, 0, 455]);
const sourceProof = generateProof(leaves, [454, 0, 456]);

const [isin, source] = await bond.readSecurityAltIdWithProof(
    0,
    altIdProof.valueBytes,
    { proof: altIdProof.proof, directions: altIdProof.directions },
    sourceProof.valueBytes,
    { proof: sourceProof.proof, directions: sourceProof.directions }
);
```

**Gas Cost:** ~7.7k gas (9.3x cheaper than CBOR!)

---

### Business Logic: Check if Bond Has Matured

Both approaches support the same business logic, just with different data access patterns:

#### CBOR Approach
```solidity
// contracts/src/examples/BondDescriptorReader.sol:182-185
function hasMatured() public view returns (bool) {
    uint256 maturityDate = readMaturityDate();
    return block.timestamp >= maturityDate;
}

// Simple to use
bool matured = bond.hasMatured();
```

#### Merkle Approach  
```solidity
// contracts/src/examples/BondDescriptorMerkle.sol:234-240
function hasMaturedWithProof(
    bytes calldata maturityValueBytes,
    MerkleProof calldata merkleProof
) public view returns (bool) {
    uint256 maturityDate = readMaturityDateWithProof(maturityValueBytes, merkleProof);
    return block.timestamp >= maturityDate;
}

// Requires proof generation
const maturityProof = generateProof(leaves, [541]);
const matured = await bond.hasMaturedWithProof(
    maturityProof.valueBytes,
    { proof: maturityProof.proof, directions: maturityProof.directions }
);
```

**Trade-off:** Slightly more complex call signature, but 3-5x cheaper gas cost

---

## Gas Performance Comparison

> **📊 Detailed Analysis:** For an in-depth gas analysis with actual measurements, breakdowns, and real-world scenarios, see [Bond Descriptor Gas Analysis](BOND_DESCRIPTOR_GAS_ANALYSIS.md)

### Storage Costs

Both approaches store CBOR via SSTORE2 as baseline. The difference is storing the Merkle root:

| Approach | CBOR Storage (SSTORE2) | Merkle Root | Total Storage |
|----------|------------------------|-------------|---------------|
| **CBOR-only** | 100-200k gas | — | 100-200k gas |
| **CBOR + Merkle** | 100-200k gas | 20k gas | 120-220k gas |

**Cost Difference:** +20k gas upfront for Merkle approach (~10-20% more)

### Read Costs

This is where Merkle proofs shine. All measurements from actual test runs:

#### Simple Descriptor (2 fields)

| Field | CBOR Gas | Merkle Gas | Savings | Improvement |
|-------|----------|------------|---------|-------------|
| Symbol (tag 55) | 12,933 | 6,085 | 6,848 | **2.1x faster** |
| CouponRate (223) | 17,235 | 6,121 | 11,114 | **2.8x faster** |

**Analysis:** Even with just 2 fields, Merkle is 2-3x cheaper. CBOR binary search has parsing overhead.

---

#### Large Descriptor (5 fields)

| Field | CBOR Gas | Merkle Gas | Savings | Improvement |
|-------|----------|------------|---------|-------------|
| Account (tag 1) | 14,349 | 7,779 | 6,570 | **1.8x faster** |
| Symbol (tag 55) | 15,979 | 7,790 | 8,189 | **2.1x faster** |
| CouponRate (223) | 31,946 | 6,142 | 25,804 | **5.2x faster** |

**Analysis:** As descriptors grow, Merkle stays constant (~6-8k gas) while CBOR grows significantly.

---

#### Group Descriptor (nested access)

| Field | CBOR Gas | Merkle Gas | Savings | Improvement |
|-------|----------|------------|---------|-------------|
| Symbol (tag 55) | 12,900 | 7,758 | 5,142 | **1.7x faster** |
| SecurityAltID[0].ID | 71,598 | 7,705 | 63,893 | **🔥 9.3x faster** |

**Analysis:** Nested group access is **extremely expensive** in CBOR (71k gas!) due to:
- Binary search for group tag
- Array parsing and indexing  
- Binary search within group entry

Merkle proofs treat all paths uniformly → massive savings.

---

#### Real-World Descriptor (16 fields)

| Field | CBOR Gas | Merkle Gas | Savings | Improvement |
|-------|----------|------------|---------|-------------|
| Symbol (tag 55) | 80,260 | 8,561 | 71,699 | **🔥 9.4x faster** |
| Price (tag 44) | 53,578 | 8,528 | 45,050 | **6.3x faster** |
| ExDestination (100) | 46,762 | 8,604 | 38,158 | **5.4x faster** |

**Analysis:** With 16 fields, binary search requires multiple iterations (log₂ 16 = 4), causing 80k gas. Merkle proofs remain ~8.5k gas regardless of descriptor size.

---

### Gas Cost Scaling

How costs change with descriptor size:

| Descriptor Size | CBOR Read (range) | Merkle Read | Merkle Advantage |
|-----------------|-------------------|-------------|------------------|
| 2 fields | 12k - 17k | 6k | 2-2.8x cheaper |
| 5 fields | 14k - 32k | 6k - 8k | 1.8-5.2x cheaper |
| 16 fields | 46k - 80k | 8.5k | 5.4-9.4x cheaper |
| Nested groups | 72k | 7.7k | 9.3x cheaper |

**Key Insight:** Merkle gas costs scale logarithmically with descriptor size, while CBOR costs scale with both descriptor size AND binary search depth.

### Break-Even Analysis

When does the 20k gas upfront cost pay off?

**Scenario:** 5-field descriptor with typical read costs
- CBOR read: ~20k gas average
- Merkle read: ~7k gas average
- Savings per read: ~13k gas

**Break-even:** After just **2 field reads**, Merkle approach saves money
- Cost: 20k upfront
- Savings: 13k × 2 = 26k
- Net savings: 6k gas ✓

**For larger descriptors (16 fields):**
- CBOR read: ~60k gas average
- Merkle read: ~8.5k gas average  
- Savings per read: ~51.5k gas

**Break-even:** After just **1 field read**, Merkle approach saves money
- Cost: 20k upfront
- Savings: 51.5k × 1 = 51.5k
- Net savings: 31.5k gas ✓

---

## Client-Side Integration

### CBOR Approach (Simple)

```typescript
// No client-side logic needed
const symbol = await bondContract.readSymbol();
const couponRate = await bondContract.readCouponRate(4);
```

### Merkle Approach (Proof Generation Required)

```typescript
import { enumerateLeaves, generateProof } from 'fixdescriptorkit-typescript';

// One-time: Build Merkle tree from descriptor
const descriptor = {
  55: "AAPL",
  223: "4.250",
  541: "20250615"
};

const leaves = enumerateLeaves(descriptor);

// For each read: Generate proof
const symbolProof = generateProof(leaves, [55]);

// Call contract with proof
const symbol = await bondContract.readSymbolWithProof(
  symbolProof.valueBytes,
  symbolProof.proof,
  symbolProof.directions
);

// Cache proofs for frequently accessed fields
const proofCache = {
  symbol: generateProof(leaves, [55]),
  couponRate: generateProof(leaves, [223]),
  maturityDate: generateProof(leaves, [541])
};
```

**TypeScript SDK:** See [packages/fixdescriptorkit-typescript](../packages/fixdescriptorkit-typescript) for proof generation helpers.

---

## Summary

### Quick Comparison Table

| Aspect | CBOR Parsing | Merkle Proofs |
|--------|--------------|---------------|
| **Storage Cost** | 100-200k gas | 120-220k gas (+20k) |
| **Read Cost (2 fields)** | 12k-17k gas | 6k gas |
| **Read Cost (16 fields)** | 46k-80k gas | 8.5k gas |
| **Nested Groups** | 72k gas | 7.7k gas |
| **Scaling** | Poor (grows with size) | Excellent (constant) |
| **Client Complexity** | None (simple calls) | Proof generation needed |
| **Flexibility** | High (read any field) | Medium (need proofs) |
| **Best For** | Small descriptors, dev | Production, large descriptors |

### Key Takeaways

1. **Merkle proofs are 2-10x more gas efficient** for field reads
2. **20k gas upfront cost** pays off after 1-2 reads for typical descriptors
3. **Nested groups see massive savings** (9.3x cheaper with Merkle)
4. **Hybrid approach recommended** for production (store both CBOR + root)
5. **Use CBOR for development**, switch to Merkle for production optimization

### Example Contracts

#### BondDescriptorReader.sol (CBOR Approach)
[View Source](../contracts/src/examples/BondDescriptorReader.sol)

ERC20 bond token with embedded FIX descriptor using CBOR parsing:
- Direct field access via `readSymbol()`, `readMaturityDate()`, etc.
- No proof generation required
- Simple developer experience
- Gas costs: 33k-108k per read

#### BondDescriptorMerkle.sol (Merkle Approach)  
[View Source](../contracts/src/examples/BondDescriptorMerkle.sol)

ERC20 bond token with Merkle proof verification:
- Field access via `readSymbolWithProof()`, `readMaturityDateWithProof()`, etc.
- Requires proof generation offchain
- Clean `MerkleProof` struct interface
- Gas costs: 9.4k-9.7k per read (constant)

#### Test Suites

- [BondDescriptorComparison.t.sol](../contracts/test/BondDescriptorComparison.t.sol) - Side-by-side gas comparison
- [BondGasSimple.t.sol](../contracts/test/BondGasSimple.t.sol) - Simplified gas measurements
- [GasComparison.t.sol](../contracts/test/GasComparison.t.sol) - General comparison suite

---

## Further Reading

### Detailed Documentation

- **[Bond Descriptor Gas Analysis](BOND_DESCRIPTOR_GAS_ANALYSIS.md)** ⭐ - In-depth technical analysis with detailed breakdowns, real-world scenarios, and calculations
- [CBOR Parser Documentation](../contracts/docs/CBOR_PARSER.md) - CBOR implementation details
- [Merkle Verifier Documentation](../contracts/docs/MERKLE_VERIFIER.md) - Merkle proof generation and verification
- [General Gas Comparison Analysis](../contracts/docs/GAS_COMPARISON_ANALYSIS.md) - Comprehensive test results

### Tools & SDKs

- [TypeScript SDK](../packages/fixdescriptorkit-typescript) - Merkle proof generation and CBOR encoding

