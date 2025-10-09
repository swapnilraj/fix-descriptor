// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FixCBORReader.sol";
import "./FixValueParser.sol";
import "./FixDictionary.sol";

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

