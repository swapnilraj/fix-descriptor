// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/examples/BondDescriptorReader.sol";
import "../src/examples/BondDescriptorMerkle.sol";
import "../src/generated/GeneratedCBORTestData.sol";
import "../src/generated/GeneratedMerkleData.sol";

/// @title BondDescriptorComparison
/// @notice Comprehensive gas comparison between CBOR parsing and Merkle proof verification
/// @dev This test suite provides detailed gas measurements for both approaches
contract BondDescriptorComparison is Test {
    BondDescriptorReader cborReader;
    BondDescriptorMerkle merkleReader;

    bytes cbor;
    bytes32 merkleRoot;
    bytes32 dictHash;

    function setUp() public {
        // Get test data
        cbor = GeneratedCBORTestData.getBondDescriptor();
        merkleRoot = GeneratedMerkleData.getBondMerkleRoot();
        dictHash = bytes32(0);

        // Deploy CBOR-based reader
        cborReader = new BondDescriptorReader(
            "Apple Bond CBOR",
            "AAPL-CBOR",
            1_000_000 * 10**18,
            address(this),
            cbor,
            merkleRoot,
            dictHash
        );

        // Deploy Merkle-based reader
        merkleReader = new BondDescriptorMerkle(
            "Apple Bond Merkle",
            "AAPL-MERKLE",
            1_000_000 * 10**18,
            address(this),
            cbor,
            merkleRoot,
            dictHash
        );
    }

    // ============================================================
    // SYMBOL FIELD COMPARISON
    // ============================================================

    function testGas_Symbol_CBOR() public view {
        string memory symbol = cborReader.readSymbol();
        assertEq(symbol, "US0378331005");
    }

    function testGas_Symbol_Merkle() public view {
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_Symbol();

        BondDescriptorMerkle.MerkleProof memory merkleProof = BondDescriptorMerkle.MerkleProof({
            proof: proof,
            directions: directions
        });

        string memory symbol = merkleReader.readSymbolWithProof(valueBytes, merkleProof);
        assertEq(symbol, "US0378331005");
    }

    // ============================================================
    // COUPON RATE FIELD COMPARISON
    // ============================================================

    function testGas_CouponRate_CBOR() public view {
        uint256 coupon = cborReader.readCouponRate(4);
        assertEq(coupon, 42500); // 4.250 with 4 decimals
    }

    function testGas_CouponRate_Merkle() public view {
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_CouponRate();

        BondDescriptorMerkle.MerkleProof memory merkleProof = BondDescriptorMerkle.MerkleProof({
            proof: proof,
            directions: directions
        });

        uint256 coupon = merkleReader.readCouponRateWithProof(valueBytes, merkleProof, 4);
        assertEq(coupon, 42500);
    }

    // ============================================================
    // MATURITY DATE FIELD COMPARISON
    // ============================================================

    function testGas_MaturityDate_CBOR() public view {
        uint256 maturity = cborReader.readMaturityDate();
        assertTrue(maturity > 1735689600); // Jan 1, 2025
    }

    function testGas_MaturityDate_Merkle() public view {
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_MaturityDate();

        BondDescriptorMerkle.MerkleProof memory merkleProof = BondDescriptorMerkle.MerkleProof({
            proof: proof,
            directions: directions
        });

        uint256 maturity = merkleReader.readMaturityDateWithProof(valueBytes, merkleProof);
        assertTrue(maturity > 1735689600);
    }

    // ============================================================
    // NESTED GROUP FIELD COMPARISON (SecurityAltID)
    // ============================================================

    function testGas_SecurityAltID_CBOR() public view {
        (string memory altId, string memory source) = cborReader.readSecurityAltId(0);
        assertEq(altId, "US0378331005");
        assertEq(source, "1");
    }

    function testGas_SecurityAltID_Merkle() public view {
        // Note: We need both SecurityAltID and SecurityAltIDSource proofs
        // For this test, we'll use the available SecurityAltID proof
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_SecurityAltID_0_ID();

        BondDescriptorMerkle.MerkleProof memory merkleProof = BondDescriptorMerkle.MerkleProof({
            proof: proof,
            directions: directions
        });

        // For a fair comparison, we're only verifying one field
        // In practice, you'd need both proofs for the full readSecurityAltIdWithProof function
        string memory altId = string(valueBytes);
        assertEq(altId, "US0378331005");
        
        // Verify the proof is valid
        bool valid = merkleReader.verifyField(pathCBOR, valueBytes, proof, directions);
        assertTrue(valid);
    }

    // ============================================================
    // BUSINESS LOGIC COMPARISON - hasMatured()
    // ============================================================

    function testGas_HasMatured_CBOR() public {
        // Set timestamp after maturity
        vm.warp(1750032000); // June 20, 2025
        bool matured = cborReader.hasMatured();
        assertTrue(matured);
    }

    function testGas_HasMatured_Merkle() public {
        vm.warp(1750032000); // June 20, 2025
        
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_MaturityDate();

        BondDescriptorMerkle.MerkleProof memory merkleProof = BondDescriptorMerkle.MerkleProof({
            proof: proof,
            directions: directions
        });

        bool matured = merkleReader.hasMaturedWithProof(valueBytes, merkleProof);
        assertTrue(matured);
    }

    // ============================================================
    // BUSINESS LOGIC COMPARISON - calculateTotalInterest()
    // ============================================================

    function testGas_CalculateInterest_CBOR() public view {
        uint256 principal = 1_000_000 * 10**18;
        uint256 interest = cborReader.calculateTotalInterest(principal);
        
        uint256 expected = (principal * 42500) / 10000;
        assertEq(interest, expected);
    }

    function testGas_CalculateInterest_Merkle() public view {
        (
            bytes memory pathCBOR,
            bytes memory valueBytes,
            bytes32[] memory proof,
            bool[] memory directions
        ) = GeneratedMerkleData.getBondProof_CouponRate();

        BondDescriptorMerkle.MerkleProof memory merkleProof = BondDescriptorMerkle.MerkleProof({
            proof: proof,
            directions: directions
        });

        uint256 principal = 1_000_000 * 10**18;
        uint256 interest = merkleReader.calculateTotalInterestWithProof(
            valueBytes,
            merkleProof,
            principal
        );
        
        uint256 expected = (principal * 42500) / 10000;
        assertEq(interest, expected);
    }

    // ============================================================
    // MULTIPLE FIELD ACCESS COMPARISON
    // ============================================================

    function testGas_ReadBondDetails_CBOR() public view {
        (string memory symbol, uint256 coupon, uint256 maturity) = cborReader.readBondDetails();
        assertEq(symbol, "US0378331005");
        assertEq(coupon, 42500);
        assertTrue(maturity > 1735689600);
    }

    function testGas_ReadBondDetails_Merkle() public view {
        // For Merkle approach, we need individual proofs for each field
        // This demonstrates the overhead of multiple proof verifications
        
        // Get Symbol
        (
            bytes memory symbolPathCBOR,
            bytes memory symbolValueBytes,
            bytes32[] memory symbolProof,
            bool[] memory symbolDirections
        ) = GeneratedMerkleData.getBondProof_Symbol();

        BondDescriptorMerkle.MerkleProof memory symbolMerkleProof = BondDescriptorMerkle.MerkleProof({
            proof: symbolProof,
            directions: symbolDirections
        });

        string memory symbol = merkleReader.readSymbolWithProof(symbolValueBytes, symbolMerkleProof);

        // Get Coupon Rate
        (
            bytes memory couponPathCBOR,
            bytes memory couponValueBytes,
            bytes32[] memory couponProof,
            bool[] memory couponDirections
        ) = GeneratedMerkleData.getBondProof_CouponRate();

        BondDescriptorMerkle.MerkleProof memory couponMerkleProof = BondDescriptorMerkle.MerkleProof({
            proof: couponProof,
            directions: couponDirections
        });

        uint256 coupon = merkleReader.readCouponRateWithProof(couponValueBytes, couponMerkleProof, 4);

        // Get Maturity Date
        (
            bytes memory maturityPathCBOR,
            bytes memory maturityValueBytes,
            bytes32[] memory maturityProof,
            bool[] memory maturityDirections
        ) = GeneratedMerkleData.getBondProof_MaturityDate();

        BondDescriptorMerkle.MerkleProof memory maturityMerkleProof = BondDescriptorMerkle.MerkleProof({
            proof: maturityProof,
            directions: maturityDirections
        });

        uint256 maturity = merkleReader.readMaturityDateWithProof(maturityValueBytes, maturityMerkleProof);

        // Verify results
        assertEq(symbol, "US0378331005");
        assertEq(coupon, 42500);
        assertTrue(maturity > 1735689600);
    }

    // ============================================================
    // DESCRIPTOR INFO COMPARISON
    // ============================================================

    function testGas_GetFixDescriptor_CBOR() public view {
        IFixDescriptor.FixDescriptor memory descriptor = cborReader.getFixDescriptor();
        assertEq(descriptor.fixMajor, 4);
        assertEq(descriptor.fixMinor, 4);
    }

    function testGas_GetFixDescriptor_Merkle() public view {
        IFixDescriptor.FixDescriptor memory descriptor = merkleReader.getFixDescriptor();
        assertEq(descriptor.fixMajor, 4);
        assertEq(descriptor.fixMinor, 4);
    }

    function testGas_GetFixRoot_CBOR() public view {
        bytes32 root = cborReader.getFixRoot();
        assertEq(root, merkleRoot);
    }

    function testGas_GetFixRoot_Merkle() public view {
        bytes32 root = merkleReader.getFixRoot();
        assertEq(root, merkleRoot);
    }
}

