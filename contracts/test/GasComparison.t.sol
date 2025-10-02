// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/FixCBORReader.sol";
import "../src/FixValueParser.sol";
import "../src/FixMerkleVerifier.sol";
import "../src/generated/GeneratedCBORTestData.sol";
import "../src/generated/GeneratedMerkleData.sol";

/// @title GasComparisonTest
/// @notice Compare gas costs: CBOR field access vs Merkle proof verification
/// @dev Answers the question: Should we store Merkle root onchain or access fields from CBOR?
contract GasComparisonTest is Test {

    // ============================================================
    // TEST 1: Simple Descriptor (2 fields)
    // ============================================================

    function test_Gas_Simple_CBOR_Symbol() public pure {
        bytes memory cbor = GeneratedCBORTestData.getSimpleDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 55);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "AAPL");
    }

    function test_Gas_Simple_Merkle_Symbol() public pure {
        bytes32 root = GeneratedMerkleData.getSimpleMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getSimpleProof_Symbol();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "AAPL");
    }

    function test_Gas_Simple_CBOR_CouponRate() public pure {
        bytes memory cbor = GeneratedCBORTestData.getSimpleDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 223);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "4.250");
    }

    function test_Gas_Simple_Merkle_CouponRate() public pure {
        bytes32 root = GeneratedMerkleData.getSimpleMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getSimpleProof_CouponRate();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "4.250");
    }

    // ============================================================
    // TEST 2: Large Descriptor (5 fields)
    // ============================================================

    function test_Gas_Large_CBOR_Account() public pure {
        bytes memory cbor = GeneratedCBORTestData.getLargeDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 1);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "A");
    }

    function test_Gas_Large_Merkle_Account() public pure {
        bytes32 root = GeneratedMerkleData.getLargeMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getLargeProof_Account();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "A");
    }

    function test_Gas_Large_CBOR_Symbol() public pure {
        bytes memory cbor = GeneratedCBORTestData.getLargeDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 55);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "AAPL");
    }

    function test_Gas_Large_Merkle_Symbol() public pure {
        bytes32 root = GeneratedMerkleData.getLargeMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getLargeProof_Symbol();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "AAPL");
    }

    function test_Gas_Large_CBOR_CouponRate() public pure {
        bytes memory cbor = GeneratedCBORTestData.getLargeDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 223);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "4.250");
    }

    function test_Gas_Large_Merkle_CouponRate() public pure {
        bytes32 root = GeneratedMerkleData.getLargeMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getLargeProof_CouponRate();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "4.250");
    }

    // ============================================================
    // TEST 3: Group Descriptor (nested group access)
    // ============================================================

    function test_Gas_Group_CBOR_Symbol() public pure {
        bytes memory cbor = GeneratedCBORTestData.getGroupDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 55);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "AAPL");
    }

    function test_Gas_Group_Merkle_Symbol() public pure {
        bytes32 root = GeneratedMerkleData.getGroupMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getGroupProof_Symbol();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "AAPL");
    }

    function test_Gas_Group_CBOR_SecurityAltID_0() public pure {
        bytes memory cbor = GeneratedCBORTestData.getGroupDescriptor();
        uint16[] memory path = new uint16[](3);
        path[0] = 454;
        path[1] = 0;
        path[2] = 455;
        FixCBORReader.ReadResult memory result = FixCBORReader.getFieldByPath(cbor, path);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "US0378331005");
    }

    function test_Gas_Group_Merkle_SecurityAltID_0() public pure {
        bytes32 root = GeneratedMerkleData.getGroupMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getGroupProof_SecurityAltID_0_ID();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "US0378331005");
    }

    // ============================================================
    // TEST 4: Bond Descriptor (real-world example)
    // ============================================================

    function test_Gas_Bond_CBOR_Symbol() public pure {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 55);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "US0378331005");
    }

    function test_Gas_Bond_Merkle_Symbol() public pure {
        bytes32 root = GeneratedMerkleData.getBondMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_Symbol();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "US0378331005");
    }

    function test_Gas_Bond_CBOR_MaturityDate() public pure {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 541);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "20250615");
    }

    function test_Gas_Bond_Merkle_MaturityDate() public pure {
        bytes32 root = GeneratedMerkleData.getBondMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_MaturityDate();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "20250615");
    }

    // ============================================================
    // TEST 5: Real-world Descriptor (16 fields)
    // ============================================================

    function test_Gas_RealWorld_CBOR_Symbol() public pure {
        bytes memory cbor = GeneratedCBORTestData.getRealWorldDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 55);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "AAPL");
    }

    function test_Gas_RealWorld_Merkle_Symbol() public pure {
        bytes32 root = GeneratedMerkleData.getRealWorldMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getRealWorldProof_Symbol();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "AAPL");
    }

    function test_Gas_RealWorld_CBOR_Price() public pure {
        bytes memory cbor = GeneratedCBORTestData.getRealWorldDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 44);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "150.50");
    }

    function test_Gas_RealWorld_Merkle_Price() public pure {
        bytes32 root = GeneratedMerkleData.getRealWorldMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getRealWorldProof_Price();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "150.50");
    }

    function test_Gas_RealWorld_CBOR_ExDestination() public pure {
        bytes memory cbor = GeneratedCBORTestData.getRealWorldDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 100);
        string memory value = FixValueParser.extractString(result.value);
        assertEq(value, "XNAS");
    }

    function test_Gas_RealWorld_Merkle_ExDestination() public pure {
        bytes32 root = GeneratedMerkleData.getRealWorldMerkleRoot();
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getRealWorldProof_ExDestination();

        bool valid = FixMerkleVerifier.verify(root, pathCBOR, valueBytes, proof, directions);
        require(valid, "Invalid proof");
        string memory value = string(valueBytes);
        assertEq(value, "XNAS");
    }

    // ============================================================
    // ANALYSIS HELPER: Run all tests and print gas report
    // ============================================================

    /// @notice Call this test to see gas comparison summary
    /// @dev Run: forge test --match-test test_GasReport --gas-report
    function test_GasReport() public pure {
        // This test doesn't do anything, but when run with --gas-report
        // it will show gas usage for all tests above
        assertTrue(true);
    }
}
