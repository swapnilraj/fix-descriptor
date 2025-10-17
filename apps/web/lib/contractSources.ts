/**
 * Contract Source Code for Verification
 * Contains standard JSON input for AssetTokenERC20 contract
 * Auto-generated from Foundry build artifacts
 */

import standardJsonInput from './AssetTokenERC20-standard-json.json';

/**
 * Standard JSON input for AssetTokenERC20 verification
 * Used for contract verification on Etherscan with multi-file support
 */
export const ASSET_TOKEN_ERC20_STANDARD_JSON = standardJsonInput;

/**
 * Legacy: Flattened source code for AssetTokenERC20
 * Note: Standard JSON format is preferred for verification
 */
export const ASSET_TOKEN_ERC20_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// lib/openzeppelin-contracts/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// src/FixCBORReader.sol

/// @title FixCBORReader
/// @notice Gas-efficient library for reading FIX tag values from canonical CBOR-encoded descriptors
/// @dev Exploits CBOR canonical properties (sorted keys, definite lengths) for efficient field lookup
library FixCBORReader {
    struct ReadResult {
        bytes value; // Raw CBOR-encoded value bytes (including header)
        bool found; // Whether tag was found
    }

    // CBOR major types
    uint8 constant MAJOR_TYPE_UINT = 0;
    uint8 constant MAJOR_TYPE_NEGINT = 1;
    uint8 constant MAJOR_TYPE_BYTES = 2;
    uint8 constant MAJOR_TYPE_TEXT = 3;
    uint8 constant MAJOR_TYPE_ARRAY = 4;
    uint8 constant MAJOR_TYPE_MAP = 5;

    // Length encoding constants
    uint8 constant ADDL_INFO_UINT8 = 24;
    uint8 constant ADDL_INFO_UINT16 = 25;
    uint8 constant ADDL_INFO_UINT32 = 26;

    /// @notice Read a FIX tag value from canonical CBOR descriptor
    /// @param cbor The complete CBOR-encoded descriptor
    /// @param tag The FIX tag to search for
    /// @return result Raw value bytes and found status
    function getField(bytes memory cbor, uint16 tag) internal pure returns (ReadResult memory result) {
        require(cbor.length > 0, "Empty CBOR");

        // Verify root is map (major type 5)
        uint8 majorType = uint8(cbor[0]) >> 5;
        require(majorType == MAJOR_TYPE_MAP, "Root must be map");

        // Read map size
        (uint256 mapSize, uint256 headerSize) = readLength(cbor, 0);
        uint256 pos = headerSize;

        // Handle empty map
        if (mapSize == 0) {
            return ReadResult(new bytes(0), false);
        }

        // Binary search through sorted map keys
        uint256 left = 0;
        uint256 right = mapSize - 1;

        while (left <= right) {
            uint256 mid = (left + right) / 2;

            // Navigate to mid-th key-value pair
            uint256 pairPos = skipToPair(cbor, pos, mid);

            // Read key (must be unsigned int)
            uint16 currentTag = readUintKey(cbor, pairPos);

            if (currentTag == tag) {
                // Found! Extract value bytes
                uint256 valuePos = advancePastKey(cbor, pairPos);
                bytes memory value = extractValueBytes(cbor, valuePos);
                return ReadResult(value, true);
            } else if (currentTag < tag) {
                left = mid + 1;
            } else {
                // Avoid underflow when mid = 0
                if (mid == 0) break;
                right = mid - 1;
            }
        }

        // Not found
        return ReadResult(new bytes(0), false);
    }

    /// @notice Read a field within a group using path notation
    /// @param cbor The complete CBOR-encoded descriptor
    /// @param path Array of [groupTag, index, fieldTag] or nested paths
    /// @return result Raw value bytes and found status
    /// @dev Example: [453, 0, 448] reads first Party's PartyID
    function getFieldByPath(bytes memory cbor, uint16[] memory path) internal pure returns (ReadResult memory result) {
        require(path.length > 0, "Empty path");

        // Single element path - direct field lookup
        if (path.length == 1) {
            return getField(cbor, path[0]);
        }

        // Navigate through path segments
        bytes memory currentCBOR = cbor;

        // Process pairs of (groupTag, index)
        for (uint256 i = 0; i < path.length - 1; i += 2) {
            require(i + 1 < path.length, "Invalid path: missing index");

            uint16 groupTag = path[i];
            uint256 index = path[i + 1];

            // Find the group
            ReadResult memory groupResult = getField(currentCBOR, groupTag);
            if (!groupResult.found) {
                return ReadResult(new bytes(0), false);
            }

            // Verify it's an array
            uint8 majorType = uint8(groupResult.value[0]) >> 5;
            require(majorType == MAJOR_TYPE_ARRAY, "Expected array for group");

            // Get the array element at index
            currentCBOR = getArrayElement(groupResult.value, index);
            if (currentCBOR.length == 0) {
                return ReadResult(new bytes(0), false);
            }
        }

        // Final segment is the field tag
        uint16 finalTag = path[path.length - 1];
        return getField(currentCBOR, finalTag);
    }

    /// @notice Extract element at index from CBOR array
    /// @param arrayBytes CBOR-encoded array
    /// @param index Zero-based index
    /// @return Element bytes (empty if out of bounds)
    function getArrayElement(bytes memory arrayBytes, uint256 index) internal pure returns (bytes memory) {
        require(arrayBytes.length > 0, "Empty array bytes");

        uint8 majorType = uint8(arrayBytes[0]) >> 5;
        require(majorType == MAJOR_TYPE_ARRAY, "Not an array");

        (uint256 arrayLength, uint256 headerSize) = readLength(arrayBytes, 0);

        if (index >= arrayLength) {
            return new bytes(0);
        }

        uint256 pos = headerSize;

        // Skip to index-th element
        for (uint256 i = 0; i < index; i++) {
            pos = skipElement(arrayBytes, pos);
        }

        // Extract the element
        uint256 elementStart = pos;
        uint256 elementEnd = skipElement(arrayBytes, pos);

        bytes memory element = new bytes(elementEnd - elementStart);
        for (uint256 i = 0; i < element.length; i++) {
            element[i] = arrayBytes[elementStart + i];
        }

        return element;
    }

    /// @notice Skip to the N-th key-value pair in a map
    /// @param cbor CBOR bytes
    /// @param startPos Position after map header
    /// @param pairIndex Zero-based pair index
    /// @return Position of the target pair's key
    function skipToPair(bytes memory cbor, uint256 startPos, uint256 pairIndex) internal pure returns (uint256) {
        uint256 pos = startPos;

        for (uint256 i = 0; i < pairIndex; i++) {
            pos = skipElement(cbor, pos); // skip key
            pos = skipElement(cbor, pos); // skip value
        }

        return pos;
    }

    /// @notice Skip one CBOR element and return position after it
    /// @param cbor CBOR bytes
    /// @param pos Current position
    /// @return Position after the element
    function skipElement(bytes memory cbor, uint256 pos) internal pure returns (uint256) {
        require(pos < cbor.length, "Position out of bounds");

        uint8 initialByte = uint8(cbor[pos]);
        uint8 majorType = initialByte >> 5;
        uint8 additionalInfo = initialByte & 0x1F;

        (uint256 length, uint256 headerSize) = readLengthAtPos(cbor, pos, additionalInfo);

        if (majorType == MAJOR_TYPE_UINT || majorType == MAJOR_TYPE_NEGINT) {
            // Integer types - just header
            return pos + headerSize;
        } else if (majorType == MAJOR_TYPE_BYTES || majorType == MAJOR_TYPE_TEXT) {
            // Byte/text string - header + payload
            return pos + headerSize + length;
        } else if (majorType == MAJOR_TYPE_ARRAY) {
            // Array - skip header, then skip each element
            pos += headerSize;
            for (uint256 i = 0; i < length; i++) {
                pos = skipElement(cbor, pos);
            }
            return pos;
        } else if (majorType == MAJOR_TYPE_MAP) {
            // Map - skip header, then skip key-value pairs
            pos += headerSize;
            for (uint256 i = 0; i < length; i++) {
                pos = skipElement(cbor, pos); // key
                pos = skipElement(cbor, pos); // value
            }
            return pos;
        } else {
            revert("Unsupported major type");
        }
    }

    /// @notice Read uint key from CBOR at position
    /// @param cbor CBOR bytes
    /// @param pos Position of key
    /// @return Key as uint16
    function readUintKey(bytes memory cbor, uint256 pos) internal pure returns (uint16) {
        require(pos < cbor.length, "Position out of bounds");

        uint8 initialByte = uint8(cbor[pos]);
        uint8 majorType = initialByte >> 5;
        require(majorType == MAJOR_TYPE_UINT, "Key must be uint");

        uint8 additionalInfo = initialByte & 0x1F;

        if (additionalInfo < 24) {
            return uint16(additionalInfo);
        } else if (additionalInfo == ADDL_INFO_UINT8) {
            require(pos + 1 < cbor.length, "Truncated uint8");
            return uint16(uint8(cbor[pos + 1]));
        } else if (additionalInfo == ADDL_INFO_UINT16) {
            require(pos + 2 < cbor.length, "Truncated uint16");
            return uint16(uint8(cbor[pos + 1])) << 8 | uint16(uint8(cbor[pos + 2]));
        } else {
            revert("Unsupported key size");
        }
    }

    /// @notice Advance position past the key
    /// @param cbor CBOR bytes
    /// @param pos Position of key
    /// @return Position after key (at value)
    function advancePastKey(bytes memory cbor, uint256 pos) internal pure returns (uint256) {
        return skipElement(cbor, pos);
    }

    /// @notice Extract complete value bytes including CBOR header
    /// @param cbor CBOR bytes
    /// @param pos Position of value
    /// @return Value bytes
    function extractValueBytes(bytes memory cbor, uint256 pos) internal pure returns (bytes memory) {
        uint256 endPos = skipElement(cbor, pos);
        uint256 valueLength = endPos - pos;

        bytes memory value = new bytes(valueLength);
        for (uint256 i = 0; i < valueLength; i++) {
            value[i] = cbor[pos + i];
        }

        return value;
    }

    /// @notice Read length from CBOR header at position
    /// @param cbor CBOR bytes
    /// @param pos Position of CBOR element
    /// @return length The length value
    /// @return headerSize Size of the header in bytes
    function readLength(bytes memory cbor, uint256 pos) internal pure returns (uint256 length, uint256 headerSize) {
        require(pos < cbor.length, "Position out of bounds");

        uint8 additionalInfo = uint8(cbor[pos]) & 0x1F;
        return readLengthAtPos(cbor, pos, additionalInfo);
    }

    /// @notice Read length given additional info
    /// @param cbor CBOR bytes
    /// @param pos Position of CBOR element
    /// @param additionalInfo The 5-bit additional info field
    /// @return length The length value
    /// @return headerSize Size of the header in bytes
    function readLengthAtPos(bytes memory cbor, uint256 pos, uint8 additionalInfo)
        internal
        pure
        returns (uint256 length, uint256 headerSize)
    {
        if (additionalInfo < 24) {
            return (additionalInfo, 1);
        } else if (additionalInfo == ADDL_INFO_UINT8) {
            require(pos + 1 < cbor.length, "Truncated length");
            return (uint8(cbor[pos + 1]), 2);
        } else if (additionalInfo == ADDL_INFO_UINT16) {
            require(pos + 2 < cbor.length, "Truncated length");
            uint256 len = (uint256(uint8(cbor[pos + 1])) << 8) | uint256(uint8(cbor[pos + 2]));
            return (len, 3);
        } else if (additionalInfo == ADDL_INFO_UINT32) {
            require(pos + 4 < cbor.length, "Truncated length");
            uint256 len = (uint256(uint8(cbor[pos + 1])) << 24) | (uint256(uint8(cbor[pos + 2])) << 16)
                | (uint256(uint8(cbor[pos + 3])) << 8) | uint256(uint8(cbor[pos + 4]));
            return (len, 5);
        } else {
            revert("Unsupported length encoding");
        }
    }
}

// src/FixDictionary.sol

/// @title FixDictionary
/// @notice Immutable on-chain dictionary mapping FIX tag numbers to tag names
/// @dev Uses SSTORE2 pattern with fixed 24-byte slots for O(1) lookups
contract FixDictionary {
    /// @notice SSTORE2 pointer to dictionary data
    address public immutable dataContract;

    /// @notice Maximum tag number supported (FIX 4.4 has tags 1-957)
    uint16 public constant MAX_TAG = 957;

    /// @notice Size of each dictionary slot in bytes
    uint8 public constant SLOT_SIZE = 24;

    error TagOutOfRange(uint16 tag);
    error InvalidDataContract();

    /// @notice Constructor deploys dictionary data as SSTORE2 contract
    /// @param data Fixed-length dictionary data ((MAX_TAG + 1) * SLOT_SIZE bytes, includes slot 0)
    constructor(bytes memory data) {
        require(data.length == (MAX_TAG + 1) * SLOT_SIZE, "Invalid data length");
        
        // Deploy as SSTORE2 contract
        // Create init code: PUSH data.length PUSH 0 PUSH 0 CODECOPY PUSH data.length PUSH 0 RETURN
        // Then append the data
        bytes memory initCode = abi.encodePacked(
            // Copy data to memory starting at 0
            hex"63", // PUSH4
            uint32(data.length + 1), // data length + STOP byte
            hex"80600E6000396000F300", // DUP1 PUSH1 0x0E PUSH1 0 CODECOPY PUSH1 0 RETURN STOP
            data
        );
        
        address pointer;
        assembly {
            pointer := create(0, add(initCode, 0x20), mload(initCode))
        }
        
        require(pointer != address(0), "Deployment failed");
        dataContract = pointer;
    }

    /// @notice Get tag name for a single tag
    /// @param tag FIX tag number (1-957)
    /// @return name Tag name string (empty if tag not defined)
    function getTagName(uint16 tag) public view returns (string memory name) {
        if (tag == 0 || tag > MAX_TAG) {
            revert TagOutOfRange(tag);
        }

        // Calculate offset: tag * SLOT_SIZE
        // Add 1 to skip STOP byte in SSTORE2 contract
        uint256 offset = tag * SLOT_SIZE + 1;
        
        // Read 24-byte slot
        bytes memory slot = new bytes(SLOT_SIZE);
        address ptr = dataContract;
        assembly {
            extcodecopy(
                ptr,
                add(slot, 0x20),
                offset,
                mload(slot)
            )
        }

        // First byte is length
        uint8 length = uint8(slot[0]);
        
        // If length is 0, tag is not defined
        if (length == 0) {
            return "";
        }

        // Extract name bytes (skip first byte which is length)
        bytes memory nameBytes = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            nameBytes[i] = slot[i + 1];
        }

        return string(nameBytes);
    }

    /// @notice Get tag names for multiple tags (batch operation)
    /// @param tags Array of FIX tag numbers
    /// @return names Array of tag name strings
    function getTagNames(uint16[] calldata tags) external view returns (string[] memory names) {
        names = new string[](tags.length);
        for (uint256 i = 0; i < tags.length; i++) {
            names[i] = getTagName(tags[i]);
        }
    }

    /// @notice Check if a tag is defined in the dictionary
    /// @param tag FIX tag number
    /// @return True if tag has a name defined
    function hasTag(uint16 tag) external view returns (bool) {
        if (tag == 0 || tag > MAX_TAG) {
            return false;
        }

        uint256 offset = tag * SLOT_SIZE + 1;
        
        // Read just the length byte
        bytes1 lengthByte;
        address ptr = dataContract;
        assembly {
            let tmpPtr := mload(0x40)
            extcodecopy(
                ptr,
                tmpPtr,
                offset,
                1
            )
            lengthByte := mload(tmpPtr)
        }

        return lengthByte != 0x00;
    }

    /// @notice Get raw 24-byte slot data for a tag
    /// @param tag FIX tag number
    /// @return Slot data (for debugging/inspection)
    function getSlot(uint16 tag) external view returns (bytes memory) {
        if (tag == 0 || tag > MAX_TAG) {
            revert TagOutOfRange(tag);
        }

        uint256 offset = tag * SLOT_SIZE + 1;
        bytes memory slot = new bytes(SLOT_SIZE);
        address ptr = dataContract;
        
        assembly {
            extcodecopy(
                ptr,
                add(slot, 0x20),
                offset,
                mload(slot)
            )
        }

        return slot;
    }
}

// src/FixMerkleVerifier.sol

library FixMerkleVerifier {
    /// @notice Verify a FIX field against a FixDescriptor's Merkle root.
    /// @param root      The fixRoot stored onchain.
    /// @param pathCBOR  Canonical CBOR bytes of the path array (e.g., [454,1,456]).
    /// @param value     Raw FIX value bytes (UTF-8), exactly as used in CBOR.
    /// @param proof     Sibling hashes bottom-up.
    /// @param directions Direction bits: false=current is left child; true=current is right child.
    /// @return ok       True if proof is valid and binds (path,value) to root.
    function verify(
        bytes32 root,
        bytes memory pathCBOR,
        bytes memory value,
        bytes32[] memory proof,
        bool[] memory directions
    ) internal pure returns (bool ok) {
        bytes32 node = keccak256(abi.encodePacked(pathCBOR, value));
        uint256 len = proof.length;
        for (uint256 i = 0; i < len; i++) {
            bytes32 sib = proof[i];
            if (directions[i]) {
                // current is right child: parent = keccak(sib || node)
                node = keccak256(abi.encodePacked(sib, node));
            } else {
                // current is left child: parent = keccak(node || sib)
                node = keccak256(abi.encodePacked(node, sib));
            }
        }
        return node == root;
    }
}

contract FixMerkleVerifierHarness {
    function verifyField(
        bytes32 root,
        bytes calldata pathCBOR,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) external pure returns (bool) {
        return FixMerkleVerifier.verify(root, pathCBOR, value, proof, directions);
    }
}

// src/FixValueParser.sol

/// @title FixValueParser
/// @notice Library for extracting and parsing FIX field values from CBOR-encoded bytes
/// @dev Works with raw CBOR value bytes returned by FixCBORReader
library FixValueParser {
    // CBOR major types
    uint8 constant MAJOR_TYPE_TEXT = 3;

    /// @notice Extract UTF-8 string from CBOR text string value
    /// @param cborValue Raw CBOR-encoded value (including header)
    /// @return Decoded UTF-8 string
    function extractString(bytes memory cborValue) internal pure returns (string memory) {
        require(cborValue.length > 0, "Empty CBOR value");

        uint8 majorType = uint8(cborValue[0]) >> 5;
        require(majorType == MAJOR_TYPE_TEXT, "Expected text string");

        (uint256 length, uint256 headerSize) = readTextLength(cborValue, 0);

        require(cborValue.length >= headerSize + length, "Truncated text string");

        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = cborValue[headerSize + i];
        }

        return string(result);
    }

    /// @notice Parse FIX decimal string to fixed-point integer
    /// @param cborValue Raw CBOR-encoded value
    /// @param decimals Number of decimal places to preserve
    /// @return Fixed-point integer (e.g., "4.250" with decimals=3 returns 4250)
    function parseFixedPoint(bytes memory cborValue, uint8 decimals) internal pure returns (uint256) {
        string memory str = extractString(cborValue);
        bytes memory strBytes = bytes(str);
        require(strBytes.length > 0, "Empty value");

        // Parse integer and fractional parts
        (uint256 integerPart, uint256 fractionalPart, uint256 fractionalDigits) = 
            _parseDecimalString(strBytes);

        // Convert to fixed-point
        return _convertToFixedPoint(integerPart, fractionalPart, fractionalDigits, decimals);
    }

    /// @notice Internal helper to parse decimal string into parts
    /// @param strBytes Byte array of decimal string
    /// @return integerPart Integer portion
    /// @return fractionalPart Fractional portion
    /// @return fractionalDigits Number of fractional digits
    function _parseDecimalString(bytes memory strBytes) 
        private 
        pure 
        returns (uint256 integerPart, uint256 fractionalPart, uint256 fractionalDigits) 
    {
        uint256 i = 0;
        
        // Parse integer part
        while (i < strBytes.length && strBytes[i] != bytes1(".")) {
            require(strBytes[i] >= "0" && strBytes[i] <= "9", "Invalid digit");
            integerPart = integerPart * 10 + uint8(strBytes[i]) - uint8(bytes1("0"));
            i++;
        }

        // Parse fractional part if exists
        if (i < strBytes.length && strBytes[i] == bytes1(".")) {
            i++; // skip '.'
            while (i < strBytes.length) {
                require(strBytes[i] >= "0" && strBytes[i] <= "9", "Invalid digit");
                fractionalPart = fractionalPart * 10 + uint8(strBytes[i]) - uint8(bytes1("0"));
                fractionalDigits++;
                i++;
            }
        }
    }

    /// @notice Internal helper to convert parsed decimal to fixed-point
    /// @param integerPart Integer portion
    /// @param fractionalPart Fractional portion
    /// @param fractionalDigits Number of fractional digits
    /// @param decimals Target decimal places
    /// @return Fixed-point result
    function _convertToFixedPoint(
        uint256 integerPart,
        uint256 fractionalPart,
        uint256 fractionalDigits,
        uint8 decimals
    ) private pure returns (uint256) {
        uint256 result = integerPart * (10 ** decimals);

        if (fractionalDigits > 0) {
            if (fractionalDigits <= decimals) {
                // Pad with zeros if needed
                result += fractionalPart * (10 ** (decimals - fractionalDigits));
            } else {
                // Truncate if too many digits
                result += fractionalPart / (10 ** (fractionalDigits - decimals));
            }
        }

        return result;
    }

    /// @notice Parse FIX date string (YYYYMMDD format) to Unix timestamp
    /// @param cborValue Raw CBOR-encoded value
    /// @return Unix timestamp (seconds since epoch)
    function parseDate(bytes memory cborValue) internal pure returns (uint256) {
        string memory str = extractString(cborValue);
        bytes memory strBytes = bytes(str);

        require(strBytes.length == 8, "Invalid date format");

        // Extract YYYYMMDD
        uint256 year = parseDigits(strBytes, 0, 4);
        uint256 month = parseDigits(strBytes, 4, 2);
        uint256 day = parseDigits(strBytes, 6, 2);

        require(year >= 1970, "Year before epoch");
        require(month >= 1 && month <= 12, "Invalid month");
        require(day >= 1 && day <= 31, "Invalid day");

        // Simple timestamp calculation (not accounting for all leap years, timezones, etc.)
        // This is a basic implementation - use a proper date library for production
        uint256 timestamp = 0;

        // Days from epoch (1970-01-01) - simplified calculation
        for (uint256 y = 1970; y < year; y++) {
            if (isLeapYear(y)) {
                timestamp += 366 days;
            } else {
                timestamp += 365 days;
            }
        }

        // Add days for months
        uint256[12] memory daysInMonth = [
            uint256(31),
            28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31
        ];

        if (isLeapYear(year)) {
            daysInMonth[1] = 29;
        }

        for (uint256 m = 1; m < month; m++) {
            timestamp += daysInMonth[m - 1] * 1 days;
        }

        // Add remaining days
        timestamp += (day - 1) * 1 days;

        return timestamp;
    }

    /// @notice Parse FIX integer value
    /// @param cborValue Raw CBOR-encoded value
    /// @return Integer value
    function parseInt(bytes memory cborValue) internal pure returns (uint256) {
        string memory str = extractString(cborValue);
        bytes memory strBytes = bytes(str);

        require(strBytes.length > 0, "Empty value");

        uint256 result = 0;
        for (uint256 i = 0; i < strBytes.length; i++) {
            require(strBytes[i] >= "0" && strBytes[i] <= "9", "Invalid digit");
            result = result * 10 + uint8(strBytes[i]) - uint8(bytes1("0"));
        }

        return result;
    }

    /// @notice Check if value exists and is non-empty
    /// @param cborValue Raw CBOR-encoded value
    /// @return True if value is non-empty
    function isPresent(bytes memory cborValue) internal pure returns (bool) {
        if (cborValue.length == 0) return false;

        uint8 majorType = uint8(cborValue[0]) >> 5;
        if (majorType != MAJOR_TYPE_TEXT) return false;

        (uint256 length,) = readTextLength(cborValue, 0);
        return length > 0;
    }

    /// @notice Read text string length from CBOR header
    /// @param cbor CBOR bytes
    /// @param pos Position of text string
    /// @return length String length
    /// @return headerSize Header size in bytes
    function readTextLength(bytes memory cbor, uint256 pos)
        internal
        pure
        returns (uint256 length, uint256 headerSize)
    {
        require(pos < cbor.length, "Position out of bounds");

        uint8 additionalInfo = uint8(cbor[pos]) & 0x1F;

        if (additionalInfo < 24) {
            return (additionalInfo, 1);
        } else if (additionalInfo == 24) {
            require(pos + 1 < cbor.length, "Truncated length");
            return (uint8(cbor[pos + 1]), 2);
        } else if (additionalInfo == 25) {
            require(pos + 2 < cbor.length, "Truncated length");
            uint256 len = (uint256(uint8(cbor[pos + 1])) << 8) | uint256(uint8(cbor[pos + 2]));
            return (len, 3);
        } else if (additionalInfo == 26) {
            require(pos + 4 < cbor.length, "Truncated length");
            uint256 len = (uint256(uint8(cbor[pos + 1])) << 24) | (uint256(uint8(cbor[pos + 2])) << 16)
                | (uint256(uint8(cbor[pos + 3])) << 8) | uint256(uint8(cbor[pos + 4]));
            return (len, 5);
        } else {
            revert("Unsupported length encoding");
        }
    }

    /// @notice Parse specified number of digits from byte array
    /// @param data Byte array containing digits
    /// @param start Start position
    /// @param length Number of digits to parse
    /// @return Parsed number
    function parseDigits(bytes memory data, uint256 start, uint256 length) internal pure returns (uint256) {
        require(start + length <= data.length, "Out of bounds");

        uint256 result = 0;
        for (uint256 i = 0; i < length; i++) {
            bytes1 b = data[start + i];
            require(b >= "0" && b <= "9", "Invalid digit");
            result = result * 10 + uint8(b) - uint8(bytes1("0"));
        }

        return result;
    }

    /// @notice Check if year is leap year
    /// @param year Year to check
    /// @return True if leap year
    function isLeapYear(uint256 year) internal pure returns (bool) {
        if (year % 4 != 0) return false;
        if (year % 100 != 0) return true;
        if (year % 400 != 0) return false;
        return true;
    }
}

// lib/openzeppelin-contracts/contracts/utils/introspection/IERC165.sol

// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * \`interfaceId\`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

// lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol

// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when \`value\` tokens are moved from one account (\`from\`) to
     * another (\`to\`).
     *
     * Note that \`value\` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a \`spender\` for an \`owner\` is set by
     * a call to {approve}. \`value\` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by \`account\`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a \`value\` amount of tokens from the caller's account to \`to\`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that \`spender\` will be
     * allowed to spend on behalf of \`owner\` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a \`value\` amount of tokens as the allowance of \`spender\` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a \`value\` amount of tokens from \`from\` to \`to\` using the
     * allowance mechanism. \`value\` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// src/IFixDescriptor.sol

/**
 * @title IFixDescriptor
 * @notice Standard interface for assets with embedded FIX descriptors
 * @dev Asset contracts (ERC20, ERC721, etc.) implement this to expose their FIX descriptor
 */
interface IFixDescriptor {
    /// @notice FIX descriptor structure
    struct FixDescriptor {
        uint16 fixMajor;           // FIX version major (e.g., 4)
        uint16 fixMinor;           // FIX version minor (e.g., 4)
        bytes32 dictHash;          // FIX dictionary/Orchestra hash
        address dictionaryContract; // FixDictionary contract address for tag name lookups
        bytes32 fixRoot;           // Merkle root commitment
        address fixCBORPtr;        // SSTORE2 data contract address
        uint32 fixCBORLen;         // CBOR data length
        string fixURI;             // Optional mirror URI (ipfs:// or https://)
    }

    /// @notice Emitted when descriptor is first set
    event FixDescriptorSet(
        bytes32 indexed fixRoot,
        bytes32 indexed dictHash,
        address fixCBORPtr,
        uint32 fixCBORLen
    );

    /// @notice Emitted when descriptor is updated
    event FixDescriptorUpdated(
        bytes32 indexed oldRoot,
        bytes32 indexed newRoot,
        address newPtr
    );

    /**
     * @notice Get the complete FIX descriptor for this asset
     * @return descriptor The FixDescriptor struct
     */
    function getFixDescriptor() external view returns (FixDescriptor memory descriptor);

    /**
     * @notice Get the Merkle root commitment
     * @return root The fixRoot for verification
     */
    function getFixRoot() external view returns (bytes32 root);

    /**
     * @notice Verify a specific field against the committed descriptor
     * @param pathCBOR Canonical CBOR bytes of the field path
     * @param value Raw FIX value bytes
     * @param proof Merkle proof (sibling hashes)
     * @param directions Direction array (true=right child, false=left child)
     * @return valid True if the proof is valid
     */
    function verifyField(
        bytes calldata pathCBOR,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) external view returns (bool valid);

    /**
     * @notice Get human-readable FIX descriptor output
     * @dev Uses dictionaryContract to map tag numbers to names
     * @return Human-readable FIX string (pipe-delimited format)
     */
    function getHumanReadableDescriptor() external view returns (string memory);
}

// lib/openzeppelin-contracts/contracts/interfaces/draft-IERC6093.sol

// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/draft-IERC6093.sol)

/**
 * @dev Standard ERC-20 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current \`balance\` of a \`sender\`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    /**
     * @dev Indicates a failure with the token \`sender\`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token \`receiver\`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the \`spender\`’s \`allowance\`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a \`spender\` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /**
     * @dev Indicates a failure with the \`approver\` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the \`spender\` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC-721 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, \`address(0)\` is a forbidden owner in ERC-20.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a \`tokenId\` whose \`owner\` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token \`sender\`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token \`receiver\`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the \`operator\`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the \`approver\` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the \`operator\` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC-1155 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current \`balance\` of a \`sender\`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     * @param tokenId Identifier number of a token.
     */
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);

    /**
     * @dev Indicates a failure with the token \`sender\`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token \`receiver\`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the \`operator\`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the \`approver\` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the \`operator\` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}

// lib/openzeppelin-contracts/contracts/utils/introspection/ERC165.sol

// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/ERC165.sol)

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * \`\`\`solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * \`\`\`
 */
abstract contract ERC165 is IERC165 {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

// lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol

// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/IERC20Metadata.sol)

/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}

// lib/openzeppelin-contracts/contracts/access/Ownable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * \`onlyOwner\`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. \`address(0)\`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * \`onlyOwner\` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (\`newOwner\`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (\`newOwner\`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// src/FixHumanReadable.sol

/// @title FixHumanReadable
/// @notice Library for generating human-readable FIX descriptor output
/// @dev Reads CBOR data and formats with tag names from dictionary
library FixHumanReadable {
    using FixCBORReader for bytes;

    // CBOR major types
    uint8 constant MAJOR_TYPE_UINT = 0;
    uint8 constant MAJOR_TYPE_TEXT = 3;
    uint8 constant MAJOR_TYPE_ARRAY = 4;
    uint8 constant MAJOR_TYPE_MAP = 5;

    error DictionaryNotSet();
    error InvalidCBORData();

    /// @notice Generate human-readable FIX output from CBOR descriptor
    /// @param cborData Complete CBOR-encoded descriptor
    /// @param dictionary FixDictionary contract for tag name lookups
    /// @return Human-readable FIX string in pipe-delimited format
    function toHumanReadable(bytes memory cborData, FixDictionary dictionary) 
        internal 
        view 
        returns (string memory) 
    {
        if (address(dictionary) == address(0)) {
            revert DictionaryNotSet();
        }

        // Start building output string
        string memory result = "";
        
        // Verify root is map
        require(cborData.length > 0, "Empty CBOR");
        uint8 majorType = uint8(cborData[0]) >> 5;
        require(majorType == MAJOR_TYPE_MAP, "Root must be map");

        // Read map size
        (uint256 mapSize, uint256 headerSize) = readLength(cborData, 0);
        uint256 pos = headerSize;

        // Iterate through all key-value pairs
        for (uint256 i = 0; i < mapSize; i++) {
            if (i > 0) {
                result = string(abi.encodePacked(result, "|"));
            }

            // Read tag (key) and advance
            uint16 tag = readUintKey(cborData, pos);
            pos = skipElement(cborData, pos);

            // Format this field
            string memory fieldStr;
            (fieldStr, pos) = formatField(cborData, pos, tag, dictionary);
            result = string(abi.encodePacked(result, fieldStr));
        }

        return result;
    }

    /// @notice Format a single field (scalar or group)
    /// @param cbor CBOR data
    /// @param pos Position of value
    /// @param tag Field tag
    /// @param dictionary Dictionary for lookups
    /// @return fieldStr Formatted field string
    /// @return newPos New position after field
    function formatField(
        bytes memory cbor,
        uint256 pos,
        uint16 tag,
        FixDictionary dictionary
    ) internal view returns (string memory fieldStr, uint256 newPos) {
        // Get tag name from dictionary
        string memory tagName = dictionary.getTagName(tag);
        if (bytes(tagName).length == 0) {
            tagName = uintToString(tag);
        }

        uint8 valueMajorType = uint8(cbor[pos]) >> 5;

        if (valueMajorType == MAJOR_TYPE_TEXT) {
            // Scalar value
            string memory value = extractTextValue(cbor, pos);
            fieldStr = string(abi.encodePacked(tagName, "=", value));
            newPos = skipElement(cbor, pos);
        } else if (valueMajorType == MAJOR_TYPE_ARRAY) {
            // Group
            fieldStr = formatGroup(cbor, pos, tag, dictionary);
            newPos = skipElement(cbor, pos);
        } else {
            // Other types - skip
            fieldStr = "";
            newPos = skipElement(cbor, pos);
        }
    }

    /// @notice Format a group (array) with its entries
    /// @param cbor CBOR data
    /// @param arrayPos Position of array in CBOR
    /// @param groupTag Tag number of the group
    /// @param dictionary Dictionary for lookups
    /// @return Formatted group string
    function formatGroup(
        bytes memory cbor,
        uint256 arrayPos,
        uint16 groupTag,
        FixDictionary dictionary
    ) internal view returns (string memory) {
        (uint256 arrayLength, uint256 headerSize) = readLength(cbor, arrayPos);
        
        string memory groupName = dictionary.getTagName(groupTag);
        if (bytes(groupName).length == 0) {
            groupName = uintToString(groupTag);
        }

        string memory result = string(abi.encodePacked(groupName, "=", uintToString(arrayLength)));
        
        uint256 entryPos = arrayPos + headerSize;

        // Format each entry
        for (uint256 i = 0; i < arrayLength; i++) {
            // Each entry should be a map
            uint8 entryMajorType = uint8(cbor[entryPos]) >> 5;
            require(entryMajorType == MAJOR_TYPE_MAP, "Group entry must be map");

            (uint256 entryMapSize, uint256 entryHeaderSize) = readLength(cbor, entryPos);
            uint256 fieldPos = entryPos + entryHeaderSize;

            result = string(abi.encodePacked(result, "|[", uintToString(i), "]"));

            // Format each field in the entry
            for (uint256 j = 0; j < entryMapSize; j++) {
                if (j > 0) {
                    result = string(abi.encodePacked(result, ","));
                }

                // Read field tag
                uint16 fieldTag = readUintKey(cbor, fieldPos);
                fieldPos = skipElement(cbor, fieldPos);

                // Get field name
                string memory fieldName = dictionary.getTagName(fieldTag);
                if (bytes(fieldName).length == 0) {
                    fieldName = uintToString(fieldTag);
                }

                // Read field value
                uint8 fieldValueType = uint8(cbor[fieldPos]) >> 5;
                
                if (fieldValueType == MAJOR_TYPE_TEXT) {
                    string memory fieldValue = extractTextValue(cbor, fieldPos);
                    result = string(abi.encodePacked(result, fieldName, "=", fieldValue));
                    fieldPos = skipElement(cbor, fieldPos);
                } else {
                    // Skip non-text values for now
                    fieldPos = skipElement(cbor, fieldPos);
                }
            }

            entryPos = skipElement(cbor, entryPos);
        }

        return result;
    }

    /// @notice Extract text string value from CBOR
    /// @param cbor CBOR data
    /// @param pos Position of text value
    /// @return Extracted string
    function extractTextValue(bytes memory cbor, uint256 pos) internal pure returns (string memory) {
        (uint256 length, uint256 headerSize) = readLength(cbor, pos);
        
        bytes memory value = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            value[i] = cbor[pos + headerSize + i];
        }
        
        return string(value);
    }

    /// @notice Read uint key from CBOR at position
    function readUintKey(bytes memory cbor, uint256 pos) internal pure returns (uint16) {
        require(pos < cbor.length, "Position out of bounds");
        
        uint8 initialByte = uint8(cbor[pos]);
        uint8 majorType = initialByte >> 5;
        require(majorType == MAJOR_TYPE_UINT, "Key must be uint");
        
        uint8 additionalInfo = initialByte & 0x1F;
        
        if (additionalInfo < 24) {
            return uint16(additionalInfo);
        } else if (additionalInfo == 24) {
            require(pos + 1 < cbor.length, "Truncated uint8");
            return uint16(uint8(cbor[pos + 1]));
        } else if (additionalInfo == 25) {
            require(pos + 2 < cbor.length, "Truncated uint16");
            return uint16(uint8(cbor[pos + 1])) << 8 | uint16(uint8(cbor[pos + 2]));
        } else {
            revert("Unsupported key size");
        }
    }

    /// @notice Skip one CBOR element and return position after it
    function skipElement(bytes memory cbor, uint256 pos) internal pure returns (uint256) {
        require(pos < cbor.length, "Position out of bounds");
        
        uint8 initialByte = uint8(cbor[pos]);
        uint8 majorType = initialByte >> 5;
        uint8 additionalInfo = initialByte & 0x1F;
        
        (uint256 length, uint256 headerSize) = readLengthAtPos(cbor, pos, additionalInfo);
        
        if (majorType == MAJOR_TYPE_UINT || majorType == 1) {
            return pos + headerSize;
        } else if (majorType == 2 || majorType == MAJOR_TYPE_TEXT) {
            return pos + headerSize + length;
        } else if (majorType == MAJOR_TYPE_ARRAY) {
            pos += headerSize;
            for (uint256 i = 0; i < length; i++) {
                pos = skipElement(cbor, pos);
            }
            return pos;
        } else if (majorType == MAJOR_TYPE_MAP) {
            pos += headerSize;
            for (uint256 i = 0; i < length; i++) {
                pos = skipElement(cbor, pos);
                pos = skipElement(cbor, pos);
            }
            return pos;
        } else {
            revert("Unsupported major type");
        }
    }

    /// @notice Read length from CBOR header at position
    function readLength(bytes memory cbor, uint256 pos) 
        internal 
        pure 
        returns (uint256 length, uint256 headerSize) 
    {
        require(pos < cbor.length, "Position out of bounds");
        uint8 additionalInfo = uint8(cbor[pos]) & 0x1F;
        return readLengthAtPos(cbor, pos, additionalInfo);
    }

    /// @notice Read length given additional info
    function readLengthAtPos(bytes memory cbor, uint256 pos, uint8 additionalInfo)
        internal
        pure
        returns (uint256 length, uint256 headerSize)
    {
        if (additionalInfo < 24) {
            return (additionalInfo, 1);
        } else if (additionalInfo == 24) {
            require(pos + 1 < cbor.length, "Truncated length");
            return (uint8(cbor[pos + 1]), 2);
        } else if (additionalInfo == 25) {
            require(pos + 2 < cbor.length, "Truncated length");
            uint256 len = (uint256(uint8(cbor[pos + 1])) << 8) | uint256(uint8(cbor[pos + 2]));
            return (len, 3);
        } else if (additionalInfo == 26) {
            require(pos + 4 < cbor.length, "Truncated length");
            uint256 len = (uint256(uint8(cbor[pos + 1])) << 24) 
                | (uint256(uint8(cbor[pos + 2])) << 16)
                | (uint256(uint8(cbor[pos + 3])) << 8) 
                | uint256(uint8(cbor[pos + 4]));
            return (len, 5);
        } else {
            revert("Unsupported length encoding");
        }
    }

    /// @notice Convert uint to string
    /// @param value Number to convert
    /// @return String representation
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}

// lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol

// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/ERC20.sol)

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning \`false\` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * Both values are immutable: they can only be set once during construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if \`decimals\` equals \`2\`, a balance of \`505\` tokens should
     * be displayed to a user as \`5.05\` (\`505 / 10 ** 2\`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /// @inheritdoc IERC20
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /// @inheritdoc IERC20
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - \`to\` cannot be the zero address.
     * - the caller must have a balance of at least \`value\`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /// @inheritdoc IERC20
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If \`value\` is the maximum \`uint256\`, the allowance is not updated on
     * \`transferFrom\`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - \`spender\` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Skips emitting an {Approval} event indicating an allowance update. This is not
     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum \`uint256\`.
     *
     * Requirements:
     *
     * - \`from\` and \`to\` cannot be the zero address.
     * - \`from\` must have a balance of at least \`value\`.
     * - the caller must have allowance for \`\`from\`\`'s tokens of at least
     * \`value\`.
     */
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a \`value\` amount of tokens from \`from\` to \`to\`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a \`value\` amount of tokens from \`from\` to \`to\`, or alternatively mints (or burns) if \`from\`
     * (or \`to\`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a \`value\` amount of tokens and assigns them to \`account\`, by transferring it from address(0).
     * Relies on the \`_update\` mechanism
     *
     * Emits a {Transfer} event with \`from\` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a \`value\` amount of tokens from \`account\`, lowering the total supply.
     * Relies on the \`_update\` mechanism.
     *
     * Emits a {Transfer} event with \`to\` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets \`value\` as the allowance of \`spender\` over the \`owner\`'s tokens.
     *
     * This internal function is equivalent to \`approve\`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - \`owner\` cannot be the zero address.
     * - \`spender\` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional \`bool emitEvent\` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * \`_spendAllowance\` during the \`transferFrom\` operation set the flag to false. This saves gas by not emitting any
     * \`Approval\` event during \`transferFrom\` operations.
     *
     * Anyone who wishes to continue emitting \`Approval\` events on the\`transferFrom\` operation can force the flag to
     * true using the following override:
     *
     * \`\`\`solidity
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * \`\`\`
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates \`owner\`'s allowance for \`spender\` based on spent \`value\`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}

// src/FixDescriptorLib.sol

/**
 * @title FixDescriptorLib
 * @notice Library for managing FIX descriptors in token contracts
 * @dev Use this library to add FIX descriptor functionality to any token (ERC20, ERC721, etc.)
 *      with minimal boilerplate. Compatible with upgradeable and non-upgradeable patterns.
 * 
 * Usage:
 *   using FixDescriptorLib for FixDescriptorLib.Storage;
 *   FixDescriptorLib.Storage private _fixDescriptor;
 * 
 * Then forward IFixDescriptor interface calls to the storage instance:
 *   function getFixDescriptor() external view returns (FixDescriptor memory) {
 *       return _fixDescriptor.getDescriptor();
 *   }
 */
library FixDescriptorLib {
    
    /**
     * @notice Storage struct for FIX descriptor state
     * @dev Use this as a state variable in your token contract
     */
    struct Storage {
        IFixDescriptor.FixDescriptor descriptor;
        bool initialized;
    }

    /**
     * @notice Set or update the FIX descriptor
     * @dev Emits appropriate event based on whether this is first initialization or update
     *      This function does NOT enforce access control - wrap it in your contract with 
     *      onlyOwner or other modifiers as needed
     * @param self Storage reference
     * @param descriptor The complete FixDescriptor struct
     */
    function setDescriptor(
        Storage storage self,
        IFixDescriptor.FixDescriptor calldata descriptor
    ) internal {
        bytes32 oldRoot = self.descriptor.fixRoot;
        self.descriptor = descriptor;

        if (self.initialized) {
            emit IFixDescriptor.FixDescriptorUpdated(
                oldRoot,
                descriptor.fixRoot,
                descriptor.fixCBORPtr
            );
        } else {
            emit IFixDescriptor.FixDescriptorSet(
                descriptor.fixRoot,
                descriptor.dictHash,
                descriptor.fixCBORPtr,
                descriptor.fixCBORLen
            );
            self.initialized = true;
        }
    }

    /**
     * @notice Get the complete FIX descriptor
     * @param self Storage reference
     * @return descriptor The FixDescriptor struct
     */
    function getDescriptor(Storage storage self)
        internal
        view
        returns (IFixDescriptor.FixDescriptor memory descriptor)
    {
        require(self.initialized, "Descriptor not initialized");
        return self.descriptor;
    }

    /**
     * @notice Get the Merkle root commitment
     * @param self Storage reference
     * @return root The fixRoot for verification
     */
    function getRoot(Storage storage self)
        internal
        view
        returns (bytes32 root)
    {
        require(self.initialized, "Descriptor not initialized");
        return self.descriptor.fixRoot;
    }

    /**
     * @notice Verify a specific field against the committed descriptor
     * @param self Storage reference
     * @param pathCBOR Canonical CBOR bytes of the field path
     * @param value Raw FIX value bytes
     * @param proof Merkle proof (sibling hashes)
     * @param directions Direction array (true=right child, false=left child)
     * @return valid True if the proof is valid
     */
    function verifyFieldProof(
        Storage storage self,
        bytes calldata pathCBOR,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) internal view returns (bool valid) {
        require(self.initialized, "Descriptor not initialized");
        return FixMerkleVerifier.verify(
            self.descriptor.fixRoot,
            pathCBOR,
            value,
            proof,
            directions
        );
    }

    /**
     * @notice Get CBOR data chunk from SSTORE2 storage
     * @dev Handles all the complexity of reading from SSTORE2 contract bytecode
     *      including the STOP byte offset and range validation
     * @param self Storage reference
     * @param start Start offset (in the data, not including STOP byte)
     * @param size Number of bytes to read
     * @return chunk The requested CBOR data
     */
    function getFixCBORChunk(
        Storage storage self,
        uint256 start,
        uint256 size
    ) internal view returns (bytes memory chunk) {
        require(self.initialized, "Descriptor not initialized");
        require(self.descriptor.fixCBORPtr != address(0), "CBOR not deployed");

        address ptr = self.descriptor.fixCBORPtr;

        // Get code size using extcodesize
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(ptr)
        }

        require(codeSize > 0, "No CBOR data");

        // Data starts at byte 1 (after STOP byte at position 0)
        // Data length is codeSize - 1
        uint256 dataLength = codeSize - 1;

        // Validate and adjust range
        if (start >= dataLength) {
            return new bytes(0);
        }

        uint256 end = start + size;
        if (end > dataLength) {
            end = dataLength;
        }

        uint256 actualSize = end - start;

        // Use extcodecopy to read directly from contract bytecode
        // Add 1 to start to skip the STOP byte (data begins at position 1)
        chunk = new bytes(actualSize);
        assembly {
            extcodecopy(ptr, add(chunk, 0x20), add(start, 1), actualSize)
        }
    }

    /**
     * @notice Get complete CBOR data from SSTORE2 storage
     * @dev Convenience function to read all CBOR data at once
     * @param self Storage reference
     * @return cborData The complete CBOR-encoded descriptor
     */
    function getFullCBORData(Storage storage self)
        internal
        view
        returns (bytes memory cborData)
    {
        require(self.initialized, "Descriptor not initialized");
        require(self.descriptor.fixCBORPtr != address(0), "CBOR not deployed");

        address ptr = self.descriptor.fixCBORPtr;
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(ptr)
        }

        require(codeSize > 1, "No CBOR data");

        // Data starts at byte 1 (after STOP byte)
        uint256 dataLength = codeSize - 1;
        cborData = new bytes(dataLength);

        assembly {
            extcodecopy(ptr, add(cborData, 0x20), 1, dataLength)
        }
    }

    /**
     * @notice Get human-readable FIX descriptor output
     * @dev Uses dictionaryContract to map tag numbers to names
     *      Reads full CBOR data and formats as pipe-delimited FIX string
     * @param self Storage reference
     * @return Human-readable FIX string (pipe-delimited format)
     */
    function getHumanReadable(Storage storage self)
        internal
        view
        returns (string memory)
    {
        require(self.initialized, "Descriptor not initialized");
        require(
            self.descriptor.dictionaryContract != address(0),
            "Dictionary not set"
        );
        require(self.descriptor.fixCBORPtr != address(0), "CBOR not deployed");

        // Read full CBOR data
        bytes memory cborData = getFullCBORData(self);

        // Use library to format human-readable output
        FixDictionary dictionary = FixDictionary(
            self.descriptor.dictionaryContract
        );
        return FixHumanReadable.toHumanReadable(cborData, dictionary);
    }

    /**
     * @notice Check if descriptor has been initialized
     * @param self Storage reference
     * @return True if descriptor is initialized
     */
    function isInitialized(Storage storage self)
        internal
        view
        returns (bool)
    {
        return self.initialized;
    }

    /**
     * @notice Get the ERC165 interface ID for IFixDescriptor
     * @return interfaceId The interface ID
     */
    function getInterfaceId() internal pure returns (bytes4 interfaceId) {
        return type(IFixDescriptor).interfaceId;
    }
}

// src/AssetTokenERC20.sol

/**
 * @title AssetTokenERC20
 * @notice Example ERC20 token with embedded FIX descriptor
 * @dev Demonstrates how to integrate FixDescriptor into an ERC20 token using FixDescriptorLib
 */
contract AssetTokenERC20 is ERC20, Ownable, ERC165, IFixDescriptor {
    using FixDescriptorLib for FixDescriptorLib.Storage;

    /// @notice FIX descriptor storage
    FixDescriptorLib.Storage private _fixDescriptor;

    /**
     * @notice Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply
     * @param initialOwner Address to receive initial supply and ownership
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);
    }

    /**
     * @notice Set the FIX descriptor for this asset
     * @dev Can only be called by owner. Emits appropriate event.
     * @param descriptor The complete FixDescriptor struct
     */
    function setFixDescriptor(FixDescriptor calldata descriptor) external onlyOwner {
        _fixDescriptor.setDescriptor(descriptor);
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
        bytes calldata pathCBOR,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) external view override returns (bool) {
        return _fixDescriptor.verifyFieldProof(pathCBOR, value, proof, directions);
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
        return _fixDescriptor.getFixCBORChunk(start, size);
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function getHumanReadableDescriptor() external view override returns (string memory) {
        return _fixDescriptor.getHumanReadable();
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

`;

/**
 * Contract name as it appears in the source
 */
export const ASSET_TOKEN_CONTRACT_NAME = 'src/AssetTokenERC20.sol:AssetTokenERC20';

/**
 * Compiler version used to compile the contract
 * Must match exactly with the version used in Foundry
 */
export const COMPILER_VERSION = 'v0.8.20+commit.a1b79de6';

/**
 * Optimization settings
 */
export const OPTIMIZATION_ENABLED = true;
export const OPTIMIZATION_RUNS = 200;

/**
 * Get the contract source (for compatibility)
 */
export function getAssetTokenERC20Source(): string {
  return ASSET_TOKEN_ERC20_SOURCE;
}
