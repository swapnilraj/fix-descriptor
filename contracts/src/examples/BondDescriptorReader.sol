// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../FixCBORReader.sol";
import "../FixValueParser.sol";

/// @title BondDescriptorReader
/// @notice Example contract demonstrating how to read FIX bond descriptor fields
/// @dev Shows practical usage of FixCBORReader and FixValueParser
contract BondDescriptorReader {
    using FixCBORReader for bytes;

    // FIX tags for bond fields
    uint16 constant TAG_SYMBOL = 55;              // Security symbol
    uint16 constant TAG_COUPON_RATE = 223;        // Coupon rate
    uint16 constant TAG_MATURITY_DATE = 541;      // Maturity date
    uint16 constant TAG_SECURITY_ALT_ID_GROUP = 454;  // NoSecurityAltID (group)
    uint16 constant TAG_SECURITY_ALT_ID = 455;    // SecurityAltID
    uint16 constant TAG_SECURITY_ALT_ID_SRC = 456; // SecurityAltIDSource

    /// @notice Read bond symbol from CBOR descriptor
    /// @param cbor Canonical CBOR-encoded descriptor
    /// @return symbol The bond symbol (e.g., "US0378331005")
    function readSymbol(bytes memory cbor) public pure returns (string memory symbol) {
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, TAG_SYMBOL);
        require(result.found, "Symbol not found");
        return FixValueParser.extractString(result.value);
    }

    /// @notice Read coupon rate as basis points
    /// @param cbor Canonical CBOR-encoded descriptor
    /// @return bps Coupon rate in basis points (e.g., "4.250" -> 42500 if decimals=4)
    function readCouponRate(bytes memory cbor, uint8 decimals) public pure returns (uint256 bps) {
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, TAG_COUPON_RATE);
        require(result.found, "CouponRate not found");
        return FixValueParser.parseFixedPoint(result.value, decimals);
    }

    /// @notice Read maturity date as Unix timestamp
    /// @param cbor Canonical CBOR-encoded descriptor
    /// @return timestamp Maturity date timestamp
    function readMaturityDate(bytes memory cbor) public pure returns (uint256 timestamp) {
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, TAG_MATURITY_DATE);
        require(result.found, "MaturityDate not found");
        return FixValueParser.parseDate(result.value);
    }

    /// @notice Read alternative security ID from group
    /// @param cbor Canonical CBOR-encoded descriptor
    /// @param index Index of the security ID in the group (0-based)
    /// @return altId The alternative security ID
    /// @return altIdSource The source of the ID (e.g., "1" for ISIN, "2" for CUSIP)
    function readSecurityAltId(bytes memory cbor, uint256 index)
        public
        pure
        returns (string memory altId, string memory altIdSource)
    {
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
    /// @param cbor Canonical CBOR-encoded descriptor
    /// @return symbol Security symbol
    /// @return couponBps Coupon rate in basis points (4 decimals)
    /// @return maturityTimestamp Maturity date as timestamp
    function readBondDetails(bytes memory cbor)
        public
        pure
        returns (string memory symbol, uint256 couponBps, uint256 maturityTimestamp)
    {
        symbol = readSymbol(cbor);
        couponBps = readCouponRate(cbor, 4); // 4 decimals for basis points
        maturityTimestamp = readMaturityDate(cbor);
    }

    /// @notice Get ISIN from security alt IDs (assumes ISIN is source "1" and first in group)
    /// @param cbor Canonical CBOR-encoded descriptor
    /// @return isin The ISIN identifier
    function getISIN(bytes memory cbor) public pure returns (string memory isin) {
        (string memory altId, string memory source) = readSecurityAltId(cbor, 0);

        // Verify it's an ISIN (source = "1")
        require(
            keccak256(bytes(source)) == keccak256(bytes("1")),
            "First SecurityAltID is not ISIN"
        );

        return altId;
    }

    /// @notice Check if bond has matured
    /// @param cbor Canonical CBOR-encoded descriptor
    /// @return True if maturity date has passed
    function hasMatured(bytes memory cbor) public view returns (bool) {
        uint256 maturityDate = readMaturityDate(cbor);
        return block.timestamp >= maturityDate;
    }

    /// @notice Calculate total interest payment over lifetime (simplified)
    /// @param cbor Canonical CBOR-encoded descriptor
    /// @param principal Principal amount in wei
    /// @return Total interest in wei (simplified calculation)
    function calculateTotalInterest(bytes memory cbor, uint256 principal) public pure returns (uint256) {
        uint256 couponBps = readCouponRate(cbor, 4); // 4 decimals

        // Simplified: total = principal * (coupon / 10000)
        // In reality, would need to account for payment frequency, day count, etc.
        return (principal * couponBps) / 10000;
    }
}
