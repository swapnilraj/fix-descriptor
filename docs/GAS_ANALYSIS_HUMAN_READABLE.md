# Gas Analysis: Human-Readable Descriptor Feature

## Overview

The human-readable descriptor feature enables on-chain generation of FIX descriptors with tag names instead of numeric values. This document analyzes the gas costs associated with deploying and using this feature.

## TL;DR

- **Dictionary Deployment**: ~8.7M gas (one-time cost, ~$10-50 depending on network)
- **Off-chain Usage**: 0 gas (view function, unlimited calls)
- **On-chain Usage**: ~200k-800k gas per call (varies by descriptor size)
- **Per-tag Lookup**: ~4,000-6,000 gas (when called from another contract)

## 1. Deployment Costs

### 1.1 FixDictionary Contract Deployment

The FixDictionary contract stores all 957 FIX 4.4 tag names in a single SSTORE2 contract.

**One-time deployment cost:**

| Component | Gas Cost | Description |
|-----------|----------|-------------|
| FixDictionary contract creation | ~620,000 | Main contract deployment |
| SSTORE2 data contract (23KB) | ~8,100,000 | Dictionary data storage |
| **Total** | **~8,720,000** | One-time cost |

**Cost Breakdown by Network** (assuming gas price and ETH price):

| Network | Gas Price | ETH Price | Deployment Cost |
|---------|-----------|-----------|-----------------|
| Ethereum Mainnet | 30 gwei | $2,500 | ~$650 |
| Optimism | 0.001 gwei | $2,500 | ~$0.02 |
| Arbitrum | 0.1 gwei | $2,500 | ~$2.18 |
| Base | 0.05 gwei | $2,500 | ~$1.09 |
| Hoodi Testnet | 3 gwei | N/A | Testnet ETH |

**Key Points:**
- This is a **one-time cost per network**
- The dictionary can be shared by all tokens on that network
- Same dictionary works for all FIX 4.4 descriptors
- No ongoing maintenance costs

### 1.2 FixDictionaryFactory Deployment

Much smaller, just manages dictionary instances:

| Component | Gas Cost |
|-----------|----------|
| Factory contract | ~620,000 |

### 1.3 Why So Expensive?

The dictionary deployment is expensive because:

1. **Data Storage**: 22,992 bytes (23KB) of tag name data
   - Each byte costs ~200 gas to store as bytecode
   - Total: 22,992 × 200 ≈ 4.6M gas minimum
   
2. **SSTORE2 Overhead**: Contract creation and initialization
   - CREATE opcode: ~32,000 gas
   - Contract initialization code: ~100,000 gas
   
3. **Factory Logic**: Deployment through factory adds ~100,000 gas

## 2. Usage Costs

### 2.1 Off-chain Usage (View Calls)

When calling `getHumanReadableDescriptor()` from a wallet or off-chain application:

**Cost: 0 gas** ✅

**Why?**
- `view` functions don't modify state
- Executed locally by the node
- No transaction required
- Unlimited free calls

**Use Cases:**
- Web applications displaying descriptors
- Analytics dashboards
- Data explorers
- Any read-only application

### 2.2 On-chain Usage (Contract Calls)

When another smart contract calls `getHumanReadableDescriptor()`:

**Cost: ~200,000 - 800,000 gas** (varies by descriptor size)

#### 2.2.1 Cost Breakdown

For a typical corporate bond descriptor with:
- 12 scalar fields
- 2 repeating groups (NoSecurityAltID, NoPartyIDs)
- ~150 bytes of CBOR data

| Operation | Gas Cost | Frequency | Subtotal |
|-----------|----------|-----------|----------|
| Function entry | ~21,000 | 1× | 21,000 |
| Read descriptor struct | ~2,100 | 1× | 2,100 |
| EXTCODECOPY (150 bytes) | ~450 | 1× | 450 |
| CBOR parsing | ~50,000 | 1× | 50,000 |
| Dictionary lookups (12 tags) | ~5,000 | 12× | 60,000 |
| String concatenation | ~3,000 | 20× | 60,000 |
| Memory allocation | ~10,000 | 1× | 10,000 |
| **Total** | | | **~203,550** |

#### 2.2.2 Scaling with Descriptor Size

| Descriptor Complexity | Fields | CBOR Size | Est. Gas Cost |
|-----------------------|--------|-----------|---------------|
| Simple (equity) | 5 | 60 bytes | ~180,000 |
| Medium (bond) | 12 | 150 bytes | ~250,000 |
| Complex (structured product) | 25 | 400 bytes | ~500,000 |
| Very complex (with large groups) | 50+ | 1000 bytes | ~800,000+ |

#### 2.2.3 Per-tag Lookup Cost

When calling `FixDictionary.getTagName(uint16 tag)` from a contract:

| Operation | Gas Cost |
|-----------|----------|
| Function call overhead | ~2,100 |
| Offset calculation (tag × 24) | ~20 |
| EXTCODECOPY (24 bytes) | ~200 |
| Memory allocation | ~100 |
| String construction | ~2,000 |
| **Total per tag** | **~4,420** |

**Important**: The lookup cost is constant O(1) regardless of tag number!

## 3. Comparison: On-chain vs Off-chain Decoding

### 3.1 Feature Comparison

| Feature | Off-chain Decoding | On-chain Human-Readable |
|---------|-------------------|------------------------|
| **Gas Cost** | 0 (view call) | 0 (view call) / ~200k-800k (if called by contract) |
| **Output Format** | Both can show `Symbol=AAPL\|SecurityID=US0378331005` |
| **Composability** | ❌ Not available to contracts | ✅ Fully composable with contracts |
| **Dependencies** | Requires off-chain libraries (fixparser) | Fully self-contained on-chain |
| **Trust Model** | Trust off-chain parser/dictionary | Trustless, verifiable on-chain |
| **Use Case** | Web UIs, off-chain analytics | Smart contract integration, trustless apps |

### 3.2 When to Use Each

**Use Off-chain Decoding When:**
- Building traditional web applications
- Off-chain analytics and reporting
- Want to use familiar JavaScript/TypeScript libraries
- Don't need on-chain composability
- Already have off-chain infrastructure

**Use On-chain Human-Readable When:**
- Other contracts need to call and read descriptors
- Building trustless on-chain protocols
- Need verifiable, censorship-resistant data access
- Building composable DeFi primitives
- Want everything on-chain without off-chain dependencies

**Note**: Both approaches can show human-readable tag names. The key difference is WHERE the decoding happens (off-chain libraries vs on-chain Solidity) and WHETHER other contracts can call it.

## 4. Cost Optimization Strategies

### 4.1 For Dictionary Deployment

✅ **Deploy once per network** - Share across all tokens
✅ **Use L2 networks** - 100-1000× cheaper deployment
✅ **Deploy during low gas** - Save 50-90% on L1
❌ Don't deploy multiple dictionaries for same FIX version

### 4.2 For On-chain Usage

✅ **Cache results** - If descriptor doesn't change, cache the output
✅ **Batch reads** - Read multiple tags in one call when possible
✅ **Use off-chain for UIs** - Only use on-chain when necessary
✅ **Partial reads** - Only format needed fields, not entire descriptor
❌ Don't call repeatedly in loops

## 5. Cost-Benefit Analysis

### 5.1 Break-even Analysis

**Question**: When does the dictionary deployment cost pay off?

**Assumptions:**
- Dictionary deployment: 8.7M gas
- Per-token human-readable call: 250k gas (average)
- Alternative: Off-chain decoding (0 gas but requires infrastructure)

**On-chain Usage Break-even:**
```
Break-even = Dictionary Cost / Per-call Cost
          = 8.7M / 250k
          = 34.8 calls

If 35+ contracts on-chain need human-readable output, 
the shared dictionary is cost-effective.
```

**Off-chain Usage:**
- Dictionary deployment enables unlimited free view calls
- No per-call cost for web applications
- Pays off immediately if you value trustless, verifiable output

### 5.2 Value Proposition

The dictionary provides:

1. **Trustless Composability** ($$$)
   - Enables on-chain protocols to read descriptors
   - No reliance on off-chain oracles or APIs
   - Verifiable on-chain

2. **Shared Infrastructure** ($$)
   - One deployment serves entire ecosystem
   - Amortized cost across all users
   - Network effect benefits

3. **Free Off-chain Reads** ($$$)
   - Unlimited view calls for web apps
   - No API rate limits
   - No centralized services

## Conclusion

The human-readable descriptor feature provides significant value through trustless, composable on-chain data access. The key insights:

- **Deployment**: Expensive one-time cost (~8.7M gas), best on L2
- **Off-chain Usage**: Free forever (view calls)
- **On-chain Usage**: Moderate cost (~250k gas), use judiciously
- **Cost Efficiency**: Shared dictionary amortizes costs across ecosystem
