// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "../IFixDescriptor.sol";
import "../FixCBORReader.sol";
import "../FixValueParser.sol";
import "../FixMerkleVerifier.sol";
import "../SSTORE2.sol";

/// @title BondDescriptorReader
/// @notice ERC20 bond token with embedded FIX descriptor using SSTORE2 storage
/// @dev Demonstrates practical usage of FixCBORReader and FixValueParser with IFixDescriptor
contract BondDescriptorReader is ERC20, Ownable, ERC165, IFixDescriptor {
    using FixCBORReader for bytes;

    /// @notice The FIX descriptor for this bond
    FixDescriptor private _descriptor;

    /// @notice Whether the descriptor has been initialized
    bool private _descriptorInitialized;

    /// @dev ERC165 interface ID for IFixDescriptor
    bytes4 private constant IFIX_DESCRIPTOR_INTERFACE_ID =
        type(IFixDescriptor).interfaceId;

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
     * @param cborDescriptor CBOR-encoded FIX descriptor to store via SSTORE2
     * @param merkleRoot Merkle root commitment for the descriptor
     * @param dictHash FIX dictionary/Orchestra hash
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner,
        bytes memory cborDescriptor,
        bytes32 merkleRoot,
        bytes32 dictHash
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);

        // Store CBOR descriptor using SSTORE2
        address cborPtr = SSTORE2.write(cborDescriptor);

        // Initialize FIX descriptor
        _descriptor = FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: dictHash,
            fixRoot: merkleRoot,
            fixCBORPtr: cborPtr,
            fixCBORLen: uint32(cborDescriptor.length),
            fixURI: ""
        });

        _descriptorInitialized = true;

        emit FixDescriptorSet(
            merkleRoot,
            dictHash,
            cborPtr,
            uint32(cborDescriptor.length)
        );
    }

    /**
     * @notice Read complete CBOR descriptor from SSTORE2 storage
     * @return cbor The complete CBOR-encoded descriptor
     */
    function _readCBOR() private view returns (bytes memory cbor) {
        require(_descriptorInitialized, "Descriptor not initialized");
        return SSTORE2.read(_descriptor.fixCBORPtr);
    }

    /// @notice Read bond symbol from CBOR descriptor
    /// @return symbol The bond symbol (e.g., "US0378331005")
    function readSymbol() public view returns (string memory symbol) {
        bytes memory cbor = _readCBOR();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, TAG_SYMBOL);
        require(result.found, "Symbol not found");
        return FixValueParser.extractString(result.value);
    }

    /// @notice Read coupon rate as basis points
    /// @param decimals Number of decimals for fixed-point conversion
    /// @return bps Coupon rate in basis points (e.g., "4.250" -> 42500 if decimals=4)
    function readCouponRate(uint8 decimals) public view returns (uint256 bps) {
        bytes memory cbor = _readCBOR();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, TAG_COUPON_RATE);
        require(result.found, "CouponRate not found");
        return FixValueParser.parseFixedPoint(result.value, decimals);
    }

    /// @notice Read maturity date as Unix timestamp
    /// @return timestamp Maturity date timestamp
    function readMaturityDate() public view returns (uint256 timestamp) {
        bytes memory cbor = _readCBOR();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, TAG_MATURITY_DATE);
        require(result.found, "MaturityDate not found");
        return FixValueParser.parseDate(result.value);
    }

    /// @notice Read alternative security ID from group
    /// @param index Index of the security ID in the group (0-based)
    /// @return altId The alternative security ID
    /// @return altIdSource The source of the ID (e.g., "1" for ISIN, "2" for CUSIP)
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

    /// @notice Read complete bond details
    /// @return symbol Security symbol
    /// @return couponBps Coupon rate in basis points (4 decimals)
    /// @return maturityTimestamp Maturity date as timestamp
    function readBondDetails()
        public
        view
        returns (string memory symbol, uint256 couponBps, uint256 maturityTimestamp)
    {
        symbol = readSymbol();
        couponBps = readCouponRate(4); // 4 decimals for basis points
        maturityTimestamp = readMaturityDate();
    }

    /// @notice Get ISIN from security alt IDs (assumes ISIN is source "1" and first in group)
    /// @return isin The ISIN identifier
    function getISIN() public view returns (string memory isin) {
        (string memory altId, string memory source) = readSecurityAltId(0);

        // Verify it's an ISIN (source = "1")
        require(
            keccak256(bytes(source)) == keccak256(bytes("1")),
            "First SecurityAltID is not ISIN"
        );

        return altId;
    }

    /// @notice Check if bond has matured
    /// @return True if maturity date has passed
    function hasMatured() public view returns (bool) {
        uint256 maturityDate = readMaturityDate();
        return block.timestamp >= maturityDate;
    }

    /// @notice Calculate total interest payment over lifetime (simplified)
    /// @param principal Principal amount in wei
    /// @return Total interest in wei (simplified calculation)
    function calculateTotalInterest(uint256 principal) public view returns (uint256) {
        uint256 couponBps = readCouponRate(4); // 4 decimals

        // Simplified: total = principal * (coupon / 10000)
        // In reality, would need to account for payment frequency, day count, etc.
        return (principal * couponBps) / 10000;
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function getFixDescriptor() external view override returns (FixDescriptor memory) {
        require(_descriptorInitialized, "Descriptor not initialized");
        return _descriptor;
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function getFixRoot() external view override returns (bytes32) {
        require(_descriptorInitialized, "Descriptor not initialized");
        return _descriptor.fixRoot;
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function verifyField(
        bytes calldata pathCBOR,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) external view override returns (bool) {
        require(_descriptorInitialized, "Descriptor not initialized");
        return FixMerkleVerifier.verify(_descriptor.fixRoot, pathCBOR, value, proof, directions);
    }

    /**
     * @notice Get CBOR data chunk
     * @param start Start offset (in the data, not including STOP byte)
     * @param size Number of bytes to read
     * @return chunk The requested CBOR data
     */
    function getFixCBORChunk(uint256 start, uint256 size)
        external
        view
        returns (bytes memory chunk)
    {
        require(_descriptorInitialized, "Descriptor not initialized");
        return SSTORE2.read(_descriptor.fixCBORPtr, start, size);
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
        return interfaceId == IFIX_DESCRIPTOR_INTERFACE_ID ||
               super.supportsInterface(interfaceId);
    }
}
