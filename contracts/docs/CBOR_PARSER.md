# FIX CBOR Parser Implementation

This implementation provides gas-efficient onchain libraries for reading FIX tag values from canonical CBOR-encoded descriptors, following the [web specification](https://fixdescriptor.vercel.app/spec).

## Components

### 1. FixCBORReader Library ([src/FixCBORReader.sol](src/FixCBORReader.sol))

Core library for reading FIX fields from canonical CBOR data.

**Key Features:**
- Binary search through sorted CBOR map keys (O(log n) complexity)
- Efficient structure skipping using CBOR length prefixes
- Support for nested groups via path-based access
- Returns raw CBOR value bytes without interpretation

**Main Functions:**

```solidity
// Read top-level field by tag
function getField(bytes memory cbor, uint16 tag)
    internal pure returns (ReadResult memory);

// Read field within groups using path notation
function getFieldByPath(bytes memory cbor, uint16[] memory path)
    internal pure returns (ReadResult memory);

// Extract array element by index
function getArrayElement(bytes memory arrayBytes, uint256 index)
    internal pure returns (bytes memory);
```

**Path Format:**
- Scalar field: `[tag]`
- Group field: `[groupTag, index, fieldTag]`
- Nested group: `[groupTag, index, nestedGroupTag, nestedIndex, fieldTag]`

### 2. FixValueParser Library ([src/FixValueParser.sol](src/FixValueParser.sol))

Library for extracting and parsing FIX values from raw CBOR bytes.

**Functions:**

```solidity
// Extract UTF-8 string from CBOR text string
function extractString(bytes memory cborValue)
    internal pure returns (string memory);

// Parse decimal string to fixed-point integer
function parseFixedPoint(bytes memory cborValue, uint8 decimals)
    internal pure returns (uint256);

// Parse FIX date (YYYYMMDD) to Unix timestamp
function parseDate(bytes memory cborValue)
    internal pure returns (uint256);

// Parse integer value
function parseInt(bytes memory cborValue)
    internal pure returns (uint256);

// Check if value is non-empty
function isPresent(bytes memory cborValue)
    internal pure returns (bool);
```

## Usage Example

```solidity
import {FixCBORReader} from "./FixCBORReader.sol";
import {FixValueParser} from "./FixValueParser.sol";

// Read top-level field
bytes memory cbor = /* canonical CBOR descriptor */;
FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 223); // CouponRate

if (result.found) {
    string memory couponStr = FixValueParser.extractString(result.value);
    uint256 couponBps = FixValueParser.parseFixedPoint(result.value, 3);
    // "4.250" -> 4250 (3 decimals)
}

// Read field in group
uint16[] memory path = new uint16[](3);
path[0] = 453;  // NoPartyIDs (group)
path[1] = 0;    // First party
path[2] = 448;  // PartyID field

result = FixCBORReader.getFieldByPath(cbor, path);
if (result.found) {
    string memory partyId = FixValueParser.extractString(result.value);
}

// Read nested group
uint16[] memory nestedPath = new uint16[](5);
nestedPath[0] = 453;  // NoPartyIDs
nestedPath[1] = 0;    // First party
nestedPath[2] = 802;  // NoPartySubIDs (nested group)
nestedPath[3] = 0;    // First sub-id
nestedPath[4] = 523;  // PartySubID field

result = FixCBORReader.getFieldByPath(cbor, nestedPath);
```

## Gas Benchmarks

From [test/FixCBORReaderGas.t.sol](test/FixCBORReaderGas.t.sol):

| Operation | Fields | Gas Used | Notes |
|-----------|--------|----------|-------|
| Binary search (middle) | 5 | ~7,500 | 2-3 comparisons |
| Binary search (middle) | 10 | ~31,000 | 3-4 comparisons |
| Binary search (middle) | 20 | ~75,000 | 4-5 comparisons |
| Binary search (first) | 20 | ~29,000 | Best case |
| Binary search (last) | 20 | ~126,000 | Worst case |
| Simple group access | - | ~19,000 | One level |
| Nested group access | - | ~32,000 | Two levels |
| Extract string | - | ~2,300 | Small string |
| Parse decimal | - | ~10,000 | 5 char decimal |
| Parse date | - | ~50,000 | YYYYMMDD format |
| Full workflow (read+parse) | - | ~35,000 | Tag 223 from 5-field map |

**Key Insights:**
- Binary search scales logarithmically: 5→10→20 fields shows ~2.4x, ~2.4x gas increase
- First element access is fastest (~29k gas)
- Last element/not found are worst case (~125k gas)
- Group access adds ~10-30k gas per nesting level
- Value parsing is lightweight (2-10k gas for most types)

## Test Coverage

### Functional Tests ([test/FixCBORReader.t.sol](test/FixCBORReader.t.sol))

**Reader Tests (21 tests):**
- ✅ Simple field lookup
- ✅ Binary search (first, middle, last elements)
- ✅ Field not found cases
- ✅ Group access (simple & nested)
- ✅ Path-based access with multiple indices
- ✅ Index out of bounds handling
- ✅ Array element extraction
- ✅ Error handling (empty CBOR, wrong types)

**Parser Tests:**
- ✅ String extraction
- ✅ Fixed-point decimal parsing
- ✅ Integer parsing
- ✅ Date parsing (YYYYMMDD)
- ✅ Value presence checking

### Gas Benchmarks

See [test/GasComparison.t.sol](../test/GasComparison.t.sol) for comprehensive CBOR vs Merkle gas comparisons.

**Key findings:**
- Simple descriptors (2 fields): 12-17k gas
- Large descriptors (16 fields): 46-80k gas
- Nested group access: 72k gas

For detailed analysis, see [GAS_COMPARISON_ANALYSIS.md](GAS_COMPARISON_ANALYSIS.md).

## Design Principles

### Separation of Concerns
The reader returns raw CBOR bytes; parsing is delegated to type-specific parsers. This:
- Keeps the reader lean and reusable
- Allows different parsing strategies per FIX tag type
- Prevents coupling between reading and interpretation

### Gas Optimization
1. **Binary search** for O(log n) lookup vs O(n) linear scan
2. **Structure skipping** using CBOR length prefixes (no full deserialization)
3. **Minimal memory allocation** - return slices where possible
4. **Early termination** - stop once tag is found or proven absent

### Canonical CBOR Assumptions
**MUST** assume input is canonical per the [web specification Section 7](https://fixdescriptor.vercel.app/spec#cbor-encoding):
- Map keys are unsigned integers, sorted ascending
- Definite lengths only (no indefinite encoding)
- No semantic tags
- Scalar values are CBOR text strings

Non-canonical input results in undefined behavior.

## Security Considerations

1. **DoS via malformed CBOR**: Malicious data can cause excessive gas consumption. Callers should validate input or set gas limits.

2. **Integer overflow**: Length calculations check for overflow in size computations.

3. **Out-of-bounds reads**: All array/slice access is bounds-checked.

4. **Canonical assumption**: Non-canonical CBOR may cause binary search to fail silently. Consider adding optional validation.

## Future Extensions

1. **Streaming reads**: Support chunked CBOR from SSTORE2 without loading full bytes into memory
2. **Caching hints**: Return position/offset info for subsequent reads
3. **Bulk reads**: Optimize reading multiple fields in one call
4. **Index structures**: Build onchain indices for frequently-accessed descriptors

## Running Tests

```bash
# Run all CBOR tests
forge test --match-path "test/FixCBOR*"

# Run gas benchmarks
forge test --match-contract FixCBORReaderGasTest -vv

# Run with gas reporting
forge test --match-path "test/FixCBOR*" --gas-report
```

## Integration with FIX Descriptors

This CBOR parser integrates with the FIX Descriptor system:

1. **Encoding**: Use [fixdescriptorkit-typescript](../../packages/fixdescriptorkit-typescript) to encode FIX descriptors to canonical CBOR
2. **Storage**: Store CBOR on-chain (directly or via SSTORE2)
3. **Reading**: Use FixCBORReader to extract fields
4. **Parsing**: Use FixValueParser to interpret values based on FIX tag semantics

## References

- [CBOR Specification (RFC 8949)](https://www.rfc-editor.org/rfc/rfc8949.html)
- [Canonical CBOR (RFC 8949 Section 4.2)](https://www.rfc-editor.org/rfc/rfc8949.html#section-4.2)
- [FIX Protocol Dictionary](https://www.fixtrading.org/standards/)
- [Web Specification](https://fixdescriptor.vercel.app/spec)
