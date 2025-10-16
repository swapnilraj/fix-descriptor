// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/examples/BondDescriptorReader.sol";
import "../src/examples/BondDescriptorMerkle.sol";
import "../src/FixCBORReader.sol";
import "../src/FixValueParser.sol";
import "../src/generated/GeneratedCBORTestData.sol";
import "../src/generated/GeneratedMerkleData.sol";

/// @title BondGasSimple
/// @notice Simplified gas comparison avoiding stack-too-deep issues
/// @dev Tests basic field reads without complex parsing
contract BondGasSimple is Test {
    BondDescriptorReader cborReader;
    BondDescriptorMerkle merkleReader;

    function setUp() public {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();
        bytes32 merkleRoot = GeneratedMerkleData.getBondMerkleRoot();

        cborReader = new BondDescriptorReader(
            "Bond CBOR",
            "CBOR",
            1000000 ether,
            address(this),
            cbor,
            merkleRoot,
            bytes32(0)
        );

        merkleReader = new BondDescriptorMerkle(
            "Bond Merkle",
            "MERKLE",
            1000000 ether,
            address(this),
            cbor,
            merkleRoot,
            bytes32(0)
        );
    }

    // ========================================
    // SYMBOL FIELD (Simple String)
    // ========================================

    function testGas_01_Symbol_CBOR() public view {
        string memory result = cborReader.readSymbol();
        assertEq(result, "US0378331005");
    }

    function testGas_02_Symbol_Merkle() public view {
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_Symbol();

        string memory result = merkleReader.readSymbolWithProof(
            valueBytes,
            BondDescriptorMerkle.MerkleProof({proof: proof, directions: directions})
        );
        assertEq(result, "US0378331005");
    }

    // ========================================
    // MATURITY DATE (Date Parsing)
    // ========================================

    function testGas_03_MaturityDate_CBOR() public view {
        uint256 result = cborReader.readMaturityDate();
        assertTrue(result > 1735689600); // After Jan 1, 2025
    }

    function testGas_04_MaturityDate_Merkle() public view {
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_MaturityDate();

        uint256 result = merkleReader.readMaturityDateWithProof(
            valueBytes,
            BondDescriptorMerkle.MerkleProof({proof: proof, directions: directions})
        );
        assertTrue(result > 1735689600);
    }

    // ========================================
    // RAW CBOR READING (Baseline)
    // ========================================

    function testGas_05_RawCBOR_Symbol() public view {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 55); // Symbol tag
        assertTrue(result.found);
        assertEq(result.value.length, 12); // "US0378331005"
    }

    function testGas_06_RawCBOR_MaturityDate() public view {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 541); // MaturityDate tag
        assertTrue(result.found);
        assertEq(result.value.length, 8); // "20250615"
    }

    // ========================================
    // DESCRIPTOR METADATA
    // ========================================

    function testGas_07_GetDescriptor_CBOR() public view {
        IFixDescriptor.FixDescriptor memory desc = cborReader.getFixDescriptor();
        assertTrue(desc.fixCBORPtr != address(0));
    }

    function testGas_08_GetDescriptor_Merkle() public view {
        IFixDescriptor.FixDescriptor memory desc = merkleReader.getFixDescriptor();
        assertTrue(desc.fixCBORPtr != address(0));
    }

    function testGas_09_GetRoot_CBOR() public view {
        bytes32 root = cborReader.getFixRoot();
        assertTrue(root != bytes32(0));
    }

    function testGas_10_GetRoot_Merkle() public view {
        bytes32 root = merkleReader.getFixRoot();
        assertTrue(root != bytes32(0));
    }

    // ========================================
    // DIRECT MERKLE VERIFICATION (Core Operation)
    // ========================================

    function testGas_11_DirectMerkleVerify_Symbol() public view {
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_Symbol();

        bool valid = merkleReader.verifyField(pathCBOR, valueBytes, proof, directions);
        assertTrue(valid);
    }

    function testGas_12_DirectMerkleVerify_MaturityDate() public view {
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_MaturityDate();

        bool valid = merkleReader.verifyField(pathCBOR, valueBytes, proof, directions);
        assertTrue(valid);
    }

    // ========================================
    // NESTED GROUP FIELD
    // ========================================

    function testGas_13_SecurityAltID_CBOR() public view {
        (string memory altId, string memory source) = cborReader.readSecurityAltId(0);
        assertEq(altId, "US0378331005");
        assertEq(source, "1");
    }

    function testGas_14_SecurityAltID_Merkle_Verify() public view {
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_SecurityAltID_0_ID();

        bool valid = merkleReader.verifyField(pathCBOR, valueBytes, proof, directions);
        assertTrue(valid);
    }
}

