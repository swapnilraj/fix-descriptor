# Gas Comparison Analysis: CBOR vs Merkle Proofs

## Executive Summary

**Question:** Should we store the Merkle root onchain or access fields directly from CBOR?

**Answer:** **Store the Merkle root onchain and use Merkle proofs for field verification.**

Merkle proof verification is **1.5x - 10x more gas efficient** than CBOR field access, with the largest savings on:
- Complex nested group access (10x cheaper: 71,598 gas → 7,705 gas)
- Large descriptors with many fields (9-10x cheaper: 80,260 gas → 8,561 gas)
- Deep field lookups in sorted maps

## Detailed Results

### Test 1: Simple Descriptor (2 fields)

| Field | CBOR Gas | Merkle Gas | Savings | Improvement |
|-------|----------|------------|---------|-------------|
| Symbol (tag 55) | 12,933 | 6,085 | 6,848 | **2.1x faster** |
| CouponRate (223) | 17,235 | 6,121 | 11,114 | **2.8x faster** |

**Analysis:** Even with just 2 fields, Merkle proofs are 2-3x cheaper. The CBOR binary search has overhead from parsing CBOR structure.

---

### Test 2: Large Descriptor (5 fields)

| Field | CBOR Gas | Merkle Gas | Savings | Improvement |
|-------|----------|------------|---------|-------------|
| Account (tag 1) | 14,349 | 7,779 | 6,570 | **1.8x faster** |
| Symbol (tag 55) | 15,979 | 7,790 | 8,189 | **2.1x faster** |
| CouponRate (223) | 31,946 | 6,142 | 25,804 | **5.2x faster** |

**Analysis:** As descriptor size grows, Merkle proofs maintain constant-ish gas cost (~6k-8k), while CBOR grows significantly.

---

### Test 3: Group Descriptor (nested access)

| Field | CBOR Gas | Merkle Gas | Savings | Improvement |
|-------|----------|------------|---------|-------------|
| Symbol (tag 55) | 12,900 | 7,758 | 5,142 | **1.7x faster** |
| SecurityAltID[0].ID | 71,598 | 7,705 | 63,893 | **🔥 9.3x faster** |

**Analysis:** Nested group access via path `[454, 0, 455]` is extremely expensive in CBOR (71k gas!) due to:
- Binary search for group tag
- Array parsing and indexing
- Binary search within group entry

Merkle proofs treat all paths uniformly → massive savings.

---

### Test 4: Bond Descriptor (real-world)

| Field | CBOR Gas | Merkle Gas | Savings | Improvement |
|-------|----------|------------|---------|-------------|
| Symbol (tag 55) | 22,424 | 7,714 | 14,710 | **2.9x faster** |
| MaturityDate (541) | 37,661 | 7,747 | 29,914 | **4.9x faster** |

**Analysis:** Real-world bond with groups shows consistent 3-5x improvement with Merkle proofs.

---

### Test 5: Real-World Descriptor (16 fields)

| Field | CBOR Gas | Merkle Gas | Savings | Improvement |
|-------|----------|------------|---------|-------------|
| Symbol (tag 55) | 80,260 | 8,561 | 71,699 | **🔥 9.4x faster** |
| Price (tag 44) | 53,578 | 8,528 | 45,050 | **6.3x faster** |
| ExDestination (100) | 46,762 | 8,604 | 38,158 | **5.4x faster** |

**Analysis:** With 16 fields, binary search in CBOR requires multiple iterations (log₂ 16 = 4), causing 80k gas cost. Merkle proofs remain ~8k gas regardless of descriptor size.

---

## Key Insights

### 1. **Merkle Proofs Scale Better**

- **CBOR:** Gas cost = O(log n) × CBOR_PARSE_OVERHEAD
  - Binary search is log n, but parsing CBOR at each step is expensive
  - Nested group access requires multiple binary searches

- **Merkle:** Gas cost = O(proof_length) × HASH_COST
  - Each proof step is just a keccak256 hash (~30 gas)
  - Proof length = log₂(num_leaves), independent of descriptor complexity

### 2. **CBOR Overhead Sources**

1. **Structure parsing**: Reading CBOR type bytes, length prefixes
2. **Binary search logic**: Comparison, pointer arithmetic
3. **Memory copies**: Extracting sub-slices for nested groups
4. **Multiple passes**: Groups require finding delimiter + iteration

### 3. **Merkle Proof Characteristics**

| Scenario | Proof Length | Gas Cost | Notes |
|----------|--------------|----------|-------|
| 2 fields | 1 hash | ~6k | Minimal overhead |
| 5 fields | 3 hashes | ~6-8k | Still cheap |
| 16 fields | 4 hashes | ~8.5k | Logarithmic scaling |
| Nested group | 2-3 hashes | ~7.7k | No group parsing needed |

---

## Storage Cost Comparison

### Option A: Store Full CBOR Onchain

**Pros:**
- Single storage slot for descriptor
- No additional proof data in transactions

**Cons:**
- High gas cost for field access (12k - 80k gas)
- CBOR size can be 100s-1000s of bytes → expensive storage
- Every read operation pays full parsing cost

**Example:** 500-byte CBOR descriptor
- Storage cost: 20,000 gas/byte × 500 = **10,000,000 gas** (one-time)
- Read cost: 12k - 80k gas per field access

---

### Option B: Store Merkle Root Onchain (RECOMMENDED)

**Pros:**
- ✅ **Low storage cost:** 32 bytes (1 slot) = **20,000 gas** (one-time)
- ✅ **Low read cost:** 6k - 8.5k gas per field verification
- ✅ **Constant gas cost** regardless of descriptor size
- ✅ **Flexible:** Can prove any field without storing full descriptor

**Cons:**
- Requires Merkle proof in transaction (adds calldata cost)
- More complex client-side logic to generate proofs

**Example:** Same 500-byte descriptor
- Storage cost: 32 bytes = **20,000 gas** (one-time)
- Read cost: 6k - 8.5k gas per field verification
- Proof calldata: ~100-200 bytes per access = 1,600 - 3,200 gas

**Total per access:** ~10k gas (vs 12k - 80k for CBOR)

---

## Recommendation

### ✅ **Use Merkle Root Storage**

**Reasons:**
1. **498x cheaper storage:** 20k gas vs 10M gas
2. **2-10x cheaper reads:** 6k-8.5k gas vs 12k-80k gas
3. **Scales to large descriptors:** Gas cost remains constant
4. **Supports selective disclosure:** Only prove fields you need

### Calldata Cost Analysis

Merkle proof calldata per access:
- `pathCBOR`: ~10 bytes (simple) to ~20 bytes (nested)
- `valueBytes`: varies (5-50 bytes typical)
- `proof`: 32 bytes × proof_length (typically 2-4 hashes)
- `directions`: proof_length bits (minimal)

**Total:** ~100-200 bytes = **1,600 - 3,200 gas** (at 16 gas/byte)

**Combined cost:** Proof verification (6k-8.5k) + calldata (1.6k-3.2k) = **~10k gas total**

Still **1.5x - 8x cheaper** than CBOR access!

---

## Gas Savings Summary Table

| Descriptor Size | CBOR Range | Merkle Cost | Min Savings | Max Savings |
|-----------------|------------|-------------|-------------|-------------|
| 2 fields | 12k - 17k | 6k | 6k (2x) | 11k (2.8x) |
| 5 fields | 14k - 32k | 6k - 8k | 6k (1.8x) | 26k (5.2x) |
| 16 fields | 46k - 80k | 8.5k | 38k (5.4x) | 72k (9.4x) |
| Nested groups | 72k | 7.7k | 64k (9.3x) | - |

---

## Conclusion

**The data strongly supports storing Merkle roots onchain:**

1. **500x cheaper storage** (20k vs 10M gas)
2. **2-10x cheaper field access** (6k-8.5k vs 12k-80k gas)
3. **Predictable gas costs** independent of descriptor size
4. **Better for large descriptors** where CBOR parsing becomes prohibitive

The only scenario where CBOR might be competitive is:
- Very small descriptors (2-3 fields)
- High frequency of access to ALL fields at once
- No storage concerns

For production use with real-world FIX descriptors (10-50+ fields), **Merkle roots are the clear winner.**

---

## Test Files

- Implementation: [contracts/src/FixMerkleVerifier.sol](../src/FixMerkleVerifier.sol)
- Test data generation: [packages/fixdescriptorkit-typescript/scripts/generate-solidity-test-data.ts](../../packages/fixdescriptorkit-typescript/scripts/generate-solidity-test-data.ts)
- Gas comparison tests: [contracts/test/GasComparison.t.sol](../test/GasComparison.t.sol)
- Generated test data: [contracts/src/generated/](../src/generated/) (CBOR & Merkle)

**Run comparison:**
```bash
forge test --match-contract GasComparisonTest --gas-report
```

**Regenerate test data:**
```bash
cd packages/fixdescriptorkit-typescript
npm run generate-test-data
```
