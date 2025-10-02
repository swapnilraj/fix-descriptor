// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/FixCBORReader.sol";
import "../src/FixValueParser.sol";
import "../src/generated/GeneratedCBORTestData.sol";

contract FixCBORReaderTest is Test {
    using FixCBORReader for bytes;

    function test_GetField_Simple() public pure {
        bytes memory cbor = GeneratedCBORTestData.getSimpleDescriptor();

        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 55);
        assertTrue(result.found);

        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "AAPL");
    }

    function test_GetField_NotFound() public pure {
        bytes memory cbor = GeneratedCBORTestData.getSimpleDescriptor();

        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 999);
        assertFalse(result.found);
        assertEq(result.value.length, 0);
    }

    function test_GetField_BinarySearchFirst() public pure {
        bytes memory cbor = GeneratedCBORTestData.getLargeDescriptor();

        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 1);
        assertTrue(result.found);

        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "A");
    }

    function test_GetField_BinarySearchMiddle() public pure {
        bytes memory cbor = GeneratedCBORTestData.getLargeDescriptor();

        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 55);
        assertTrue(result.found);

        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "AAPL");
    }

    function test_GetField_BinarySearchLast() public pure {
        bytes memory cbor = GeneratedCBORTestData.getLargeDescriptor();

        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 223);
        assertTrue(result.found);

        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "4.250");
    }

    function test_GetField_AllFieldsInLargeMap() public pure {
        bytes memory cbor = GeneratedCBORTestData.getLargeDescriptor();

        // Test all fields exist and return correct values
        uint16[] memory tags = new uint16[](5);
        tags[0] = 1;
        tags[1] = 11;
        tags[2] = 55;
        tags[3] = 100;
        tags[4] = 223;

        string[] memory expected = new string[](5);
        expected[0] = "A";
        expected[1] = "B";
        expected[2] = "AAPL";
        expected[3] = "C";
        expected[4] = "4.250";

        for (uint256 i = 0; i < tags.length; i++) {
            FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, tags[i]);
            assertTrue(result.found);
            string memory value = FixValueParser.extractString(result.value);
            assertEq(value, expected[i]);
        }
    }

    function test_GetFieldByPath_SimpleGroup() public pure {
        bytes memory cbor = GeneratedCBORTestData.getGroupDescriptor();

        uint16[] memory path = new uint16[](3);
        path[0] = 454;  // group tag
        path[1] = 0;    // first entry
        path[2] = 455;  // field tag

        FixCBORReader.ReadResult memory result = FixCBORReader.getFieldByPath(cbor, path);
        assertTrue(result.found);

        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "US0378331005");
    }

    function test_GetFieldByPath_NestedGroup() public pure {
        bytes memory cbor = GeneratedCBORTestData.getNestedGroupDescriptor();

        uint16[] memory path = new uint16[](5);
        path[0] = 453;  // outer group tag
        path[1] = 0;    // first party
        path[2] = 802;  // inner group tag
        path[3] = 0;    // first sub-id
        path[4] = 523;  // field tag

        FixCBORReader.ReadResult memory result = FixCBORReader.getFieldByPath(cbor, path);
        assertTrue(result.found);

        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "SUB1");
    }

    function test_GetFieldByPath_MultipleIndices() public pure {
        bytes memory cbor = GeneratedCBORTestData.getNestedGroupDescriptor();

        // Test path [453, 0, 448] -> "PARTY1"
        uint16[] memory path1 = new uint16[](3);
        path1[0] = 453;
        path1[1] = 0;
        path1[2] = 448;

        FixCBORReader.ReadResult memory result1 = FixCBORReader.getFieldByPath(cbor, path1);
        assertTrue(result1.found);
        assertEq(FixValueParser.extractString(result1.value), "PARTY1");

        // Test path [453, 1, 448] -> "PARTY2"
        uint16[] memory path2 = new uint16[](3);
        path2[0] = 453;
        path2[1] = 1;
        path2[2] = 448;

        FixCBORReader.ReadResult memory result2 = FixCBORReader.getFieldByPath(cbor, path2);
        assertTrue(result2.found);
        assertEq(FixValueParser.extractString(result2.value), "PARTY2");

        // Test path [453, 0, 802, 0, 523] -> "SUB1"
        uint16[] memory path3 = new uint16[](5);
        path3[0] = 453;
        path3[1] = 0;
        path3[2] = 802;
        path3[3] = 0;
        path3[4] = 523;

        FixCBORReader.ReadResult memory result3 = FixCBORReader.getFieldByPath(cbor, path3);
        assertTrue(result3.found);
        assertEq(FixValueParser.extractString(result3.value), "SUB1");

        // Test path [453, 0, 802, 1, 523] -> "SUB2"
        uint16[] memory path4 = new uint16[](5);
        path4[0] = 453;
        path4[1] = 0;
        path4[2] = 802;
        path4[3] = 1;
        path4[4] = 523;

        FixCBORReader.ReadResult memory result4 = FixCBORReader.getFieldByPath(cbor, path4);
        assertTrue(result4.found);
        assertEq(FixValueParser.extractString(result4.value), "SUB2");
    }

    function test_GetFieldByPath_IndexOutOfBounds() public pure {
        bytes memory cbor = GeneratedCBORTestData.getGroupDescriptor();

        uint16[] memory path = new uint16[](3);
        path[0] = 454;
        path[1] = 5;    // out of bounds
        path[2] = 455;

        FixCBORReader.ReadResult memory result = FixCBORReader.getFieldByPath(cbor, path);
        assertFalse(result.found);
    }

    function test_GetFieldByPath_GroupNotFound() public pure {
        bytes memory cbor = GeneratedCBORTestData.getGroupDescriptor();

        uint16[] memory path = new uint16[](3);
        path[0] = 999;  // non-existent group
        path[1] = 0;
        path[2] = 455;

        FixCBORReader.ReadResult memory result = FixCBORReader.getFieldByPath(cbor, path);
        assertFalse(result.found);
    }

    function test_RevertOnEmptyCBOR() public {
        bytes memory empty = new bytes(0);

        vm.expectRevert(bytes("Empty CBOR"));
        this.externalGetField(empty, 55);
    }

    function test_RevertOnNonMapRoot() public {
        // CBOR array instead of map: 0x80 (empty array)
        bytes memory notMap = hex"80";

        vm.expectRevert(bytes("Root must be map"));
        this.externalGetField(notMap, 55);
    }

    function test_RevertOnNonArrayGroup() public {
        // Map where 454 points to a string instead of array
        bytes memory badGroup = hex"a11901c664_54455354"; // {454: "TEST"}

        uint16[] memory path = new uint16[](3);
        path[0] = 454;
        path[1] = 0;
        path[2] = 455;

        vm.expectRevert(bytes("Expected array for group"));
        this.externalGetFieldByPath(badGroup, path);
    }

    // External wrappers for testing reverts
    function externalGetField(bytes memory cbor, uint16 tag) external pure returns (FixCBORReader.ReadResult memory) {
        return FixCBORReader.getField(cbor, tag);
    }

    function externalGetFieldByPath(bytes memory cbor, uint16[] memory path) external pure returns (FixCBORReader.ReadResult memory) {
        return FixCBORReader.getFieldByPath(cbor, path);
    }

    function test_GetArrayElement() public pure {
        // Simple array: [1, 2, 3] encoded as CBOR
        // 0x83 (array with 3 items) 0x01 0x02 0x03
        bytes memory arr = hex"83010203";

        bytes memory elem0 = FixCBORReader.getArrayElement(arr, 0);
        assertEq(elem0.length, 1);
        assertEq(uint8(elem0[0]), 0x01);

        bytes memory elem2 = FixCBORReader.getArrayElement(arr, 2);
        assertEq(elem2.length, 1);
        assertEq(uint8(elem2[0]), 0x03);
    }

    function test_GetArrayElement_OutOfBounds() public pure {
        bytes memory arr = hex"83010203"; // array with 3 items

        bytes memory elem = FixCBORReader.getArrayElement(arr, 10);
        assertEq(elem.length, 0);
    }

    function test_ValueParser_ExtractString() public pure {
        // CBOR text string: 0x64 "AAPL" -> 0x64 41 41 50 4C
        bytes memory cborText = hex"6441_41504c";

        string memory result = FixValueParser.extractString(cborText);
        assertEq(result, "AAPL");
    }

    function test_ValueParser_ParseFixedPoint() public pure {
        // "4.250" as CBOR text string
        bytes memory cbor = hex"6534_2e323530";

        uint256 result = FixValueParser.parseFixedPoint(cbor, 3);
        assertEq(result, 4250);

        uint256 result2 = FixValueParser.parseFixedPoint(cbor, 4);
        assertEq(result2, 42500);
    }

    function test_ValueParser_ParseInteger() public pure {
        // "12345" as CBOR text string
        bytes memory cbor = hex"653132_333435";

        uint256 result = FixValueParser.parseInt(cbor);
        assertEq(result, 12345);
    }

    function test_ValueParser_ParseDate() public pure {
        // "20250615" as CBOR text string (June 15, 2025)
        bytes memory cbor = hex"6832_30323530_363135";

        uint256 timestamp = FixValueParser.parseDate(cbor);

        // Verify it's a reasonable timestamp (should be > 2025)
        assertTrue(timestamp > 1735689600); // Jan 1, 2025
        assertTrue(timestamp < 1893456000); // Jan 1, 2030
    }

    function test_ValueParser_IsPresent() public pure {
        bytes memory cbor = hex"6441_41504c";
        assertTrue(FixValueParser.isPresent(cbor));

        bytes memory empty = hex"60"; // empty text string
        assertFalse(FixValueParser.isPresent(empty));

        bytes memory nothing = new bytes(0);
        assertFalse(FixValueParser.isPresent(nothing));
    }
}
