// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "../IFixDescriptor.sol";
import "../FixDescriptorLib.sol";
import "../FixMerkleVerifier.sol";
import "../FixValueParser.sol";
import "../SSTORE2.sol";

/// @title BondDescriptorMerkle
/// @notice ERC20 bond token using Merkle proof verification for FIX field access
/// @dev Demonstrates Merkle-based approach: stores SBE via SSTORE2 + Merkle root
///      Clients generate proofs offchain and submit them for verification
contract BondDescriptorMerkle is ERC20, Ownable, ERC165, IFixDescriptor {
    using FixDescriptorLib for FixDescriptorLib.Storage;

    /// @notice FIX descriptor storage
    FixDescriptorLib.Storage private _fixDescriptor;

    /// @notice Merkle proof data structure
    /// @param proof Array of sibling hashes for Merkle verification
    /// @param directions Direction array (true = right child, false = left child)
    struct MerkleProof {
        bytes32[] proof;
        bool[] directions;
    }

    // FIX tags for bond fields
    uint16 constant TAG_SYMBOL = 55;              // Security symbol
    uint16 constant TAG_COUPON_RATE = 223;        // Coupon rate
    uint16 constant TAG_MATURITY_DATE = 541;      // Maturity date
    uint16 constant TAG_SECURITY_ALT_ID_GROUP = 454;  // NoSecurityAltID (group)
    uint16 constant TAG_SECURITY_ALT_ID = 455;    // SecurityAltID
    uint16 constant TAG_SECURITY_ALT_ID_SRC = 456; // SecurityAltIDSource

    /**
     * @notice Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply
     * @param initialOwner Address to receive initial supply and ownership
     * @param sbeDescriptor SBE-encoded FIX descriptor to store via SSTORE2
     * @param merkleRoot Merkle root commitment for the descriptor
     * @param dictHash FIX dictionary/Orchestra hash
     * @param schemaURI Optional SBE schema URI (ipfs:// or https://)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner,
        bytes memory sbeDescriptor,
        bytes32 merkleRoot,
        bytes32 dictHash,
        string memory schemaURI
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);

        // Store SBE descriptor using SSTORE2 (baseline storage cost)
        address sbePtr = SSTORE2.write(sbeDescriptor);

        // Initialize FIX descriptor with Merkle root
        _initializeDescriptor(sbePtr, uint32(sbeDescriptor.length), merkleRoot, dictHash, schemaURI);
    }

    /**
     * @dev Internal function to initialize descriptor
     */
    function _initializeDescriptor(
        address sbePtr,
        uint32 sbeLen,
        bytes32 merkleRoot,
        bytes32 dictHash,
        string memory schemaURI
    ) private {
        _fixDescriptor.descriptor = FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: dictHash,
            fixRoot: merkleRoot,
            fixSBEPtr: sbePtr,
            fixSBELen: sbeLen,
            schemaURI: schemaURI
        });
        _fixDescriptor.initialized = true;

        emit FixDescriptorSet(merkleRoot, dictHash, sbePtr, sbeLen);
    }

    /// @notice Read bond symbol with Merkle proof verification
    /// @param valueBytes The symbol value as bytes
    /// @param merkleProof Merkle proof data (proof hashes and directions)
    /// @return symbol The bond symbol (e.g., "US0378331005")
    function readSymbolWithProof(
        bytes calldata valueBytes,
        MerkleProof calldata merkleProof
    ) public view returns (string memory symbol) {
        // Build pathSBE for tag 55: [55] -> 0x811837
        bytes memory pathSBE = abi.encodePacked(uint8(0x81), uint8(0x18), uint8(TAG_SYMBOL));
        
        // Verify the Merkle proof using internal function
        require(
            _verifyProof(pathSBE, valueBytes, merkleProof.proof, merkleProof.directions),
            "Invalid Merkle proof for Symbol"
        );

        return string(valueBytes);
    }

    /// @notice Read coupon rate with Merkle proof verification
    /// @param valueBytes The coupon rate value as bytes (e.g., "4.250")
    /// @param merkleProof Merkle proof data (proof hashes and directions)
    /// @param decimals Number of decimals for fixed-point conversion
    /// @return bps Coupon rate in basis points
    function readCouponRateWithProof(
        bytes calldata valueBytes,
        MerkleProof calldata merkleProof,
        uint8 decimals
    ) public view returns (uint256 bps) {
        // Build pathSBE for tag 223: [223] -> 0x8118df
        bytes memory pathSBE = abi.encodePacked(uint8(0x81), uint8(0x18), uint8(TAG_COUPON_RATE));
        
        require(
            _verifyProof(pathSBE, valueBytes, merkleProof.proof, merkleProof.directions),
            "Invalid Merkle proof for CouponRate"
        );

        return FixValueParser.parseFixedPoint(valueBytes, decimals);
    }

    /// @notice Read maturity date with Merkle proof verification
    /// @param valueBytes The maturity date value as bytes (e.g., "20250615")
    /// @param merkleProof Merkle proof data (proof hashes and directions)
    /// @return timestamp Maturity date timestamp
    function readMaturityDateWithProof(
        bytes calldata valueBytes,
        MerkleProof calldata merkleProof
    ) public view returns (uint256 timestamp) {
        // Build pathSBE for tag 541: [541] -> 0x81_19_021d
        bytes memory pathSBE = abi.encodePacked(uint8(0x81), uint8(0x19), uint16(TAG_MATURITY_DATE));
        
        require(
            _verifyProof(pathSBE, valueBytes, merkleProof.proof, merkleProof.directions),
            "Invalid Merkle proof for MaturityDate"
        );

        return FixValueParser.parseDate(valueBytes);
    }

    /// @notice Read alternative security ID with Merkle proof verification
    /// @param index Index of the security ID in the group (0-based)
    /// @param altIdValueBytes The SecurityAltID value as bytes
    /// @param altIdProof Merkle proof for SecurityAltID
    /// @param altIdSourceValueBytes The SecurityAltIDSource value as bytes
    /// @param altIdSourceProof Merkle proof for SecurityAltIDSource
    /// @return altId The alternative security ID
    /// @return altIdSource The source of the ID
    function readSecurityAltIdWithProof(
        uint256 index,
        bytes calldata altIdValueBytes,
        MerkleProof calldata altIdProof,
        bytes calldata altIdSourceValueBytes,
        MerkleProof calldata altIdSourceProof
    ) public view returns (string memory altId, string memory altIdSource) {
        // Build pathSBE for SecurityAltID: [454, index, 455]
        bytes memory altIdPath = _buildNestedPath(TAG_SECURITY_ALT_ID_GROUP, uint16(index), TAG_SECURITY_ALT_ID);
        
        require(
            _verifyProof(altIdPath, altIdValueBytes, altIdProof.proof, altIdProof.directions),
            "Invalid Merkle proof for SecurityAltID"
        );

        // Build pathSBE for SecurityAltIDSource: [454, index, 456]
        bytes memory altIdSourcePath = _buildNestedPath(TAG_SECURITY_ALT_ID_GROUP, uint16(index), TAG_SECURITY_ALT_ID_SRC);
        
        require(
            _verifyProof(altIdSourcePath, altIdSourceValueBytes, altIdSourceProof.proof, altIdSourceProof.directions),
            "Invalid Merkle proof for SecurityAltIDSource"
        );

        return (string(altIdValueBytes), string(altIdSourceValueBytes));
    }

    /// @notice Helper to build SBE path for nested group access
    /// @dev Constructs SBE array [groupTag, index, fieldTag]
    function _buildNestedPath(uint16 groupTag, uint16 index, uint16 fieldTag)
        private
        pure
        returns (bytes memory)
    {
        // SBE array with 3 elements: 0x83
        // Each uint16 is encoded as 0x19 followed by 2 bytes (big-endian)
        return abi.encodePacked(
            uint8(0x83),  // Array of 3 elements
            uint8(0x19), uint16(groupTag),
            uint8(index), // If index < 24, use direct encoding
            uint8(0x19), uint16(fieldTag)
        );
    }

    /// @notice Internal helper to verify Merkle proof with memory pathSBE
    /// @dev Converts memory to calldata by using FixMerkleVerifier directly
    function _verifyProof(
        bytes memory pathSBE,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) private view returns (bool) {
        require(_fixDescriptor.isInitialized(), "Descriptor not initialized");
        return FixMerkleVerifier.verify(
            _fixDescriptor.getRoot(),
            pathSBE,
            value,
            proof,
            directions
        );
    }

    /// @notice Get ISIN with Merkle proof verification
    /// @param valueBytes The ISIN value as bytes
    /// @param merkleProof Merkle proof for ISIN
    /// @param sourceValueBytes The SecurityAltIDSource value (should be "1" for ISIN)
    /// @param sourceProof Merkle proof for source
    /// @return isin The ISIN identifier
    function getISINWithProof(
        bytes calldata valueBytes,
        MerkleProof calldata merkleProof,
        bytes calldata sourceValueBytes,
        MerkleProof calldata sourceProof
    ) public view returns (string memory isin) {
        (string memory altId, string memory source) = readSecurityAltIdWithProof(
            0,
            valueBytes,
            merkleProof,
            sourceValueBytes,
            sourceProof
        );

        require(
            keccak256(bytes(source)) == keccak256(bytes("1")),
            "First SecurityAltID is not ISIN"
        );

        return altId;
    }

    /// @notice Check if bond has matured (with Merkle proof)
    /// @param maturityValueBytes The maturity date value as bytes
    /// @param merkleProof Merkle proof data
    /// @return True if maturity date has passed
    function hasMaturedWithProof(
        bytes calldata maturityValueBytes,
        MerkleProof calldata merkleProof
    ) public view returns (bool) {
        uint256 maturityDate = readMaturityDateWithProof(maturityValueBytes, merkleProof);
        return block.timestamp >= maturityDate;
    }

    /// @notice Calculate total interest payment (with Merkle proof)
    /// @param couponValueBytes The coupon rate value as bytes
    /// @param merkleProof Merkle proof data
    /// @param principal Principal amount in wei
    /// @return Total interest in wei
    function calculateTotalInterestWithProof(
        bytes calldata couponValueBytes,
        MerkleProof calldata merkleProof,
        uint256 principal
    ) public view returns (uint256) {
        uint256 couponBps = readCouponRateWithProof(couponValueBytes, merkleProof, 4);
        return (principal * couponBps) / 10000;
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function getFixDescriptor() external view override returns (FixDescriptor memory) {
        return _fixDescriptor.getDescriptor();
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function getFixRoot() external view override returns (bytes32) {
        return _fixDescriptor.getRoot();
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function verifyField(
        bytes calldata pathSBE,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) external view override returns (bool) {
        return _fixDescriptor.verifyFieldProof(pathSBE, value, proof, directions);
    }

    /**
     * @notice Get SBE data chunk using SSTORE2
     * @dev SBE is stored for reference purposes
     * @param start Start offset
     * @param size Number of bytes to read
     * @return chunk The requested SBE data
     */
    function getFixSBEChunk(uint256 start, uint256 size)
        external
        view
        returns (bytes memory chunk)
    {
        require(_fixDescriptor.isInitialized(), "Descriptor not initialized");
        FixDescriptor memory descriptor = _fixDescriptor.getDescriptor();
        return SSTORE2.read(descriptor.fixSBEPtr, start, size);
    }

    /**
     * @inheritdoc ERC165
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165)
        returns (bool)
    {
        return interfaceId == FixDescriptorLib.getInterfaceId() ||
               super.supportsInterface(interfaceId);
    }
}

