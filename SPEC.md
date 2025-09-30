# Canonicalization, CBOR, and Merkle Specification for Onchain FIX Asset Descriptors

This document specifies how to convert a FIX-based asset descriptor into a canonical, public **CBOR** payload and a **Merkle commitment** suitable for onchain verification—without requiring any onchain FIX parsing.

---

## 1. Scope and Goals

* **Input:** A FIX message (or subset) that describes a financial instrument (the “asset descriptor”), using standard FIX tags and groups.
* **Output (off-chain):**

  * A **canonical CBOR** byte string representing the descriptor.
  * A **Merkle root** committing to every field in the descriptor.
  * Optional per-field **Merkle proofs**.
* **Output (onchain):**

  * A minimal **descriptor struct** storing: FIX version, dictionary hash, Merkle root, and a pointer to the CBOR bytes stored via SSTORE2-style “code-as-data”.
  * A **verification function** to check `(path, value, proof)` against the committed root.

**Non-goals:** Parsing FIX onchain; prescribing which business tags an issuer must include (that’s policy). This spec defines **how** to encode, not **what** to encode.

---

## 2. Terminology and Notation

* **FIX tag**: An integer field identifier (e.g., `55`, `15`, `541`).
* **Group**: A repeating structure introduced by a “NoXXX” count tag (e.g., `454`, `453`), followed by N entries. Each group defines a **delimiter field** (first field of each entry; e.g., `455` for group `454`, `448` for group `453`).
* **Path**: A sequence of integers identifying a specific field occurrence in the descriptor tree; includes group indices for repeated entries (e.g., `[454, 1, 456]` = *SecurityAltID*, entry index 1, tag 456).
* **CBOR**: Concise Binary Object Representation (RFC 8949), using canonical form (definite lengths, sorted map keys).
* **Keccak**: `keccak256` hash (as per Ethereum).

Normative keywords **MUST**, **SHOULD**, **MAY** are used per RFC 2119.

---

## 3. Descriptor Content (FIX Subset)

### 3.1 Include (examples, not exhaustive)

Business/instrument fields such as:

* Identification: `48 (SecurityID)`, `22 (SecurityIDSource)`, `55 (Symbol)`, `454 (SecurityAltID group)`.
* Classification: `167 (SecurityType)`, `461 (CFICode)`.
* Economics/terms: `15 (Currency)`, `541 (MaturityDate)`, `223 (CouponRate)`, others as applicable.
* Roles: `453 (Parties group)` and nested PartySubIDs if used.

### 3.2 Exclude

Transport/session mechanics (e.g., `8 (BeginString)`, `9 (BodyLength)`, `10 (CheckSum)`, sequence numbers, admin/session fields). These **MUST NOT** be part of the committed descriptor.

### 3.3 Dictionary Binding

Implementations **MUST** record:

* `fixMajor`, `fixMinor` (e.g., 4,4).
* `dictHash` = `keccak256` of the exact FIX dictionary / FIX Orchestra bytes used to interpret tags/groups.

---

## 4. Canonical Tree Model

The descriptor is represented as a hierarchical **tree**:

* **Scalars:** `tag → value` (value is the exact FIX value bytes interpreted as UTF-8 text).
* **Groups:** `groupTag → [ entry0, entry1, … ]` where each `entry` is a map `{ tag → value | nested group }`.

**Rules (Mandatory):**

1. Each **map key** is the integer FIX tag.
2. **Scalar values** are text strings; do not convert numerics—preserve FIX string forms (e.g., `"4.250"`, `"20301115"`).
3. **Group entries**:

   * MUST begin with the **delimiter field** (for human clarity), but **map keys are still sorted** (see CBOR below).
   * Optional fields MAY be omitted; absence means “no leaf”.
   * Array order is preserved as given by the issuer (indices `0..N-1`).

---

## 5. Canonical CBOR Encoding

The canonical tree is serialized to CBOR using **canonical form**:

* **Top level:** CBOR **map** (`{}`), keys = unsigned integers (FIX tags), sorted ascending.
* **Scalar value:** CBOR **text string** with exact FIX value bytes (UTF-8). No reformatting.
* **Group:** CBOR **array** (`[]`) of CBOR **maps**. Each entry is a map with integer keys sorted ascending. (Delimiter-first is a presentational convention; canonical CBOR ordering governs bytes.)
* **Definite lengths** only; no indefinite-length items.
* **No semantic tags** are used.

This ensures a **single, unique** CBOR byte string for a given descriptor tree.

---

## 6. Merkle Commitment

### 6.1 Path Encoding

Each leaf commits to a **(path, valueBytes)** pair. The **path** MUST be encoded as **canonical CBOR array of unsigned integers**:

* Example paths:

  * Scalar at top: `[15]`
  * Group field: `[454, 1, 456]`  (*group 454*, entry **index 1**, tag **456**)
  * Nested group field: `[453, 0, 802, 2, 523]` (PartySubID example)

> The contract does **not** parse the path; it treats `pathBytes` as opaque. Canonical CBOR ensures determinism.

### 6.2 Leaf Hash

```
leaf = keccak256( pathCBOR || valueBytes )
```

* `pathCBOR`: the canonical CBOR bytes of the path array.
* `valueBytes`: the exact FIX value bytes used in the CBOR value (UTF-8 string payload, no CBOR framing).

### 6.3 Leaf Set

Produce one leaf per **present field**:

* Scalars: one leaf for each `(tag, value)`.
* Each group entry: one leaf per present field inside that entry (with its path including the group index).

A separate leaf for the group **count** is **NOT required**; array indices in paths make the set unambiguous.

### 6.4 Root Construction

* Sort all leaves by **pathCBOR** lexicographically (byte order).
* Build a standard **binary Merkle tree**:

  * Pair adjacent leaves; each parent = `keccak256(left || right)`.
  * If odd node remains at a level, **promote** it (no duplicate hashing).
* The final parent is the **Merkle root** (`fixRoot`).

### 6.5 Proofs

A Merkle proof is the usual vector of sibling hashes from the leaf to the root. The verifier needs:

* `pathCBOR` (bytes)
* `valueBytes` (bytes)
* `proof[]: bytes32[]`
* `fixRoot: bytes32`

No deserialization of CBOR is required onchain.

---

## 7. Onchain Representation

### 7.1 Integration with Asset Contracts

The `FixDescriptor` **MUST** be embedded directly in the asset contract (ERC20, ERC721, ERC1155, etc.) rather than stored in a separate registry. This approach:

* Eliminates permissioning issues (no central gatekeeper)
* Creates implicit mapping (asset address → descriptor)
* Ensures asset issuer maintains full control
* Works seamlessly with existing token standards

### 7.2 Descriptor Struct

```solidity
struct FixDescriptor {
  uint16  fixMajor;     // e.g., 4
  uint16  fixMinor;     // e.g., 4
  bytes32 dictHash;     // FIX dictionary / Orchestra hash
  bytes32 fixRoot;      // Merkle root over (pathCBOR || valueBytes)
  address fixCBORPtr;   // SSTORE2-style data contract address (runtime code = 0x00 || CBOR)
  uint32  fixCBORLen;   // length of CBOR bytes
  string  fixURI;       // optional mirror (ipfs:// or https://)
}
```

Each asset contract **MUST** implement an interface to expose its descriptor.

### 7.3 Standard Interface

Asset contracts **MUST** implement the following interface:

```solidity
interface IFixDescriptor {
  /// @notice Get the FIX descriptor for this asset
  /// @return descriptor The complete FixDescriptor struct
  function getFixDescriptor() external view returns (FixDescriptor memory descriptor);
  
  /// @notice Get the Merkle root commitment
  /// @return root The fixRoot for verification
  function getFixRoot() external view returns (bytes32 root);
  
  /// @notice Verify a specific field against the committed descriptor
  /// @param pathCBOR Canonical CBOR bytes of the field path
  /// @param value Raw FIX value bytes
  /// @param proof Merkle proof
  /// @param directions Direction array for proof verification
  /// @return valid True if the proof is valid
  function verifyField(
    bytes calldata pathCBOR,
    bytes calldata value,
    bytes32[] calldata proof,
    bool[] calldata directions
  ) external view returns (bool valid);
}
```

### 7.4 CBOR Storage (SSTORE2 pattern)

* The CBOR is deployed as the **runtime bytecode** of a minimal data contract (prefixed with a `STOP` byte).
* Anyone can retrieve bytes via `eth_getCode(fixCBORPtr)`.
* Optionally, expose:

```solidity
function getFixCBORChunk(uint256 start, uint256 size)
  external view returns (bytes memory);
```

which copies via `EXTCODECOPY(fixCBORPtr, ...)`, skipping the first byte.

### 7.5 Events and Versioning

* On first publication: `event FixDescriptorSet(bytes32 fixRoot, bytes32 dictHash, address fixCBORPtr, uint32 fixCBORLen)`.
* On update (new version): deploy a new data contract, compute new root, update descriptor, and emit:
  `event FixDescriptorUpdated(bytes32 oldRoot, bytes32 newRoot, address newPtr)`.
* Historical descriptors SHOULD remain queryable via historical state or dedicated storage.

---

## 8. Onchain Verification (Library Interface)

```solidity
library FixMerkleVerifier {
  /// @notice Verify a FIX field against a FixDescriptor's Merkle root.
  /// @param root        The fixRoot stored onchain.
  /// @param pathCBOR    Canonical CBOR bytes of the path array (e.g., [454,1,456]).
  /// @param value       Raw FIX value bytes (UTF-8), exactly as used in CBOR.
  /// @param proof       Sibling hashes bottom-up from leaf to root.
  /// @param directions  Boolean array indicating current node position (true=right child, false=left child).
  /// @return ok         True if proof is valid and binds (path,value) to root.
  function verify(
      bytes32 root,
      bytes calldata pathCBOR,
      bytes calldata value,
      bytes32[] calldata proof,
      bool[] calldata directions
  ) internal pure returns (bool);
}
```

**Verification algorithm (informative):**

1. `bytes32 leaf = keccak256(abi.encodePacked(pathCBOR, value));`
2. For each sibling in `proof` with corresponding direction in `directions`:
   - If `directions[i] = true`: `parent = keccak256(sibling || current_node)`
   - If `directions[i] = false`: `parent = keccak256(current_node || sibling)`
3. Compare final parent to `root`.

**Left/right convention:** The implementation **MUST** define and document how to determine concatenation order (e.g., a bitset index or a boolean per proof step returned by the proof generator). 

**FixDescriptorKit Convention:** This implementation uses a `bool[] directions` array where each boolean indicates the position of the current node relative to its sibling:

* `true` = current node is the **right child** (sibling is on the left)
* `false` = current node is the **left child** (sibling is on the right)

**Concatenation Order:**
- When `directions[i] = true`: `parent = keccak256(sibling || current_node)`
- When `directions[i] = false`: `parent = keccak256(current_node || sibling)`

This convention ensures deterministic proof generation and verification across all implementations.

---

## 9. Reference Off-Chain Flow (Implementation Requirements)

Given a FIX descriptor message:

1. **Parse FIX** (e.g., with `fixparser`) and extract only **business fields** (exclude session tags).
2. **Build canonical tree**:

   * Map scalars directly.
   * For each group, create an array of entry maps; each entry includes only present fields (groups may nest).
3. **Serialize to CBOR** in **canonical form** (integer keys, sorted; definite lengths).
4. **Enumerate leaves**:

   * For each present field, compute `pathCBOR` as the canonical CBOR array of path integers (including group indices).
   * Collect `(pathCBOR, valueBytes)` pairs.
5. **Sort leaves** by `pathCBOR` (bytewise), compute the **Merkle root** using `keccak256`.
6. **Deploy CBOR** as SSTORE2-style data contract; return `fixCBORPtr` and `fixCBORLen`.
7. **Set descriptor** in the asset contract, storing `fixMajor`, `fixMinor`, `dictHash`, `fixRoot`, `fixCBORPtr`, `fixCBORLen`, `fixURI` in the contract's storage.
8. **Produce utilities**:

   * Proof generator: for a given path, emit `valueBytes`, `proof[]`, and `directions[]` array.
   * Reader tools: fetch CBOR via RPC, decode, enumerate fields, produce proofs.

**Edge Handling:**

* **Missing optional fields**: no leaf emitted.
* **Empty groups**: array length 0; no leaves for entries.
* **Duplicates at same level**: not allowed by spec; if encountered, **fail** canonicalization (or keep the first; MUST be consistent and documented).
* **Numeric/date formatting**: preserve FIX string forms verbatim as values.

---

## 10. Integration Patterns

### 10.1 ERC20 Integration

```solidity
contract AssetToken is ERC20, IFixDescriptor {
    FixDescriptor private _descriptor;
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Descriptor will be set after deployment via setFixDescriptor
    }
    
    function getFixDescriptor() external view override returns (FixDescriptor memory) {
        return _descriptor;
    }
    
    function getFixRoot() external view override returns (bytes32) {
        return _descriptor.fixRoot;
    }
    
    function verifyField(
        bytes calldata pathCBOR,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) external view override returns (bool) {
        return FixMerkleVerifier.verify(_descriptor.fixRoot, pathCBOR, value, proof, directions);
    }
    
    function setFixDescriptor(FixDescriptor calldata descriptor) external onlyOwner {
        bytes32 oldRoot = _descriptor.fixRoot;
        _descriptor = descriptor;
        emit FixDescriptorUpdated(oldRoot, descriptor.fixRoot, descriptor.fixCBORPtr);
    }
}
```

### 10.2 ERC721 Integration

For NFTs, the descriptor can be per-collection (single descriptor) or per-token (descriptor per tokenId):

```solidity
contract AssetNFT is ERC721, IFixDescriptor {
    FixDescriptor private _collectionDescriptor;
    
    // Or for per-token descriptors:
    // mapping(uint256 => FixDescriptor) private _tokenDescriptors;
    
    function getFixDescriptor() external view override returns (FixDescriptor memory) {
        return _collectionDescriptor;
    }
    
    // For per-token descriptors, add tokenId parameter:
    // function getFixDescriptorForToken(uint256 tokenId) external view returns (FixDescriptor memory)
}
```

### 10.3 Discovery and Introspection

Asset contracts SHOULD implement ERC165 to advertise support:

```solidity
bytes4 constant IFixDescriptor_ID = 0x12345678; // Calculate actual interface ID

function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == IFixDescriptor_ID || super.supportsInterface(interfaceId);
}
```

---

## 11. Example (Abridged)

Treasury-style descriptor fields:

```
55=USTB-2030-11-15
48=US91282CEZ76  22=4
167=TBOND  461=DBFTFR
541=20301115  223=4.250  15=USD
454=[ {455=91282CEZ7, 456=1}, {455=US91282CEZ76, 456=4} ]
453=[ {448=US_TREASURY,447=D,452=1}, {448=CUSTODIAN_BANK_ABC,447=D,452=24} ]
```

* **CBOR**: canonical map with integer keys; arrays for `454` and `453`. (Representative size in testing: ~**243 bytes**.)
* **Leaves (examples)**:

  * path `[15]`, value `"USD"` → `keccak(pathCBOR || "USD")`
  * path `[454,1,456]`, value `"4"` (ISIN source) → `keccak(...)`
  * path `[453,0,448]`, value `"US_TREASURY"` → `keccak(...)`
* **Root**: `fixRoot` from the sorted leaves.

---

## 12. Security, Interop, and Testing

* **Determinism:** Provide test vectors (FIX → CBOR bytes, root) so multiple implementations converge.
* **Dictionary lock:** Verifiers should check `dictHash` matches expected Orchestra/dictionary to avoid semantic drift.
* **Gas bounds:** Verification cost is O(log N) hashes; CBOR is never parsed onchain.
* **Upgrades:** New descriptor versions use a new data contract + new root; emit events; leave history intact.
* **Compliance:** Descriptors should avoid PII; Parties should be institutional roles/IDs.
* **Access Control:** Asset contract owners control descriptor updates; no centralized registry permission model.
* **Decentralization:** Each asset is self-describing; no single point of failure or censorship.
* **Interface Standardization:** Use ERC165 for feature detection to enable ecosystem interoperability.