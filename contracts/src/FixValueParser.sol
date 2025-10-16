// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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
