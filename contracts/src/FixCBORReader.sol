// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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
