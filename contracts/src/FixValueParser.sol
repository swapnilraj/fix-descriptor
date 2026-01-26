// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title FixValueParser
/// @notice Library for parsing FIX field values from raw UTF-8 bytes
/// @dev Works with raw UTF-8 value bytes as stored in SBE format
library FixValueParser {
    /// @notice Parse FIX decimal string to fixed-point integer
    /// @param valueBytes Raw UTF-8 bytes (e.g., "4.250")
    /// @param decimals Number of decimal places to preserve
    /// @return Fixed-point integer (e.g., "4.250" with decimals=3 returns 4250)
    function parseFixedPoint(bytes memory valueBytes, uint8 decimals) internal pure returns (uint256) {
        require(valueBytes.length > 0, "Empty value");

        // Parse integer and fractional parts
        (uint256 integerPart, uint256 fractionalPart, uint256 fractionalDigits) = 
            _parseDecimalString(valueBytes);

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
    /// @param valueBytes Raw UTF-8 bytes (e.g., "20250615")
    /// @return Unix timestamp (seconds since epoch)
    function parseDate(bytes memory valueBytes) internal pure returns (uint256) {
        require(valueBytes.length == 8, "Invalid date format");

        // Extract YYYYMMDD
        uint256 year = parseDigits(valueBytes, 0, 4);
        uint256 month = parseDigits(valueBytes, 4, 2);
        uint256 day = parseDigits(valueBytes, 6, 2);

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
    /// @param valueBytes Raw UTF-8 bytes
    /// @return Integer value
    function parseInt(bytes memory valueBytes) internal pure returns (uint256) {
        require(valueBytes.length > 0, "Empty value");

        uint256 result = 0;
        for (uint256 i = 0; i < valueBytes.length; i++) {
            require(valueBytes[i] >= "0" && valueBytes[i] <= "9", "Invalid digit");
            result = result * 10 + uint8(valueBytes[i]) - uint8(bytes1("0"));
        }

        return result;
    }

    /// @notice Check if value exists and is non-empty
    /// @param valueBytes Raw UTF-8 bytes
    /// @return True if value is non-empty
    function isPresent(bytes memory valueBytes) internal pure returns (bool) {
        return valueBytes.length > 0;
    }

    /// @notice Convert raw bytes to UTF-8 string
    /// @param valueBytes Raw UTF-8 bytes
    /// @return UTF-8 string
    function bytesToString(bytes memory valueBytes) internal pure returns (string memory) {
        return string(valueBytes);
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
