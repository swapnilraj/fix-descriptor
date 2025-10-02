// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/examples/BondDescriptorReader.sol";
import "../src/generated/GeneratedCBORTestData.sol";
import "../src/generated/GeneratedMerkleData.sol";

contract BondDescriptorReaderTest is Test {
    BondDescriptorReader reader;

    function setUp() public {
        // Get CBOR descriptor and Merkle root
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();
        bytes32 merkleRoot = GeneratedMerkleData.getBondMerkleRoot();
        bytes32 dictHash = bytes32(0); // Using zero hash for test

        // Deploy BondDescriptorReader as ERC20 token with embedded descriptor
        reader = new BondDescriptorReader(
            "Apple Bond Token",      // name
            "AAPL-BOND",            // symbol
            1_000_000 * 10**18,     // initialSupply: 1M tokens
            address(this),          // initialOwner
            cbor,                   // cborDescriptor
            merkleRoot,             // merkleRoot
            dictHash                // dictHash
        );
    }

    function test_ReadSymbol() public view {
        string memory symbol = reader.readSymbol();
        assertEq(symbol, "US0378331005");
    }

    function test_ReadCouponRate() public view {
        // Read with 3 decimals: "4.250" -> 4250
        uint256 coupon3 = reader.readCouponRate(3);
        assertEq(coupon3, 4250);

        // Read with 4 decimals: "4.250" -> 42500
        uint256 coupon4 = reader.readCouponRate(4);
        assertEq(coupon4, 42500);
    }

    function test_ReadMaturityDate() public view {
        uint256 maturity = reader.readMaturityDate();

        // Verify it's a reasonable timestamp for June 15, 2025
        assertTrue(maturity > 1735689600); // Jan 1, 2025
        assertTrue(maturity < 1893456000); // Jan 1, 2030
    }

    function test_ReadSecurityAltId() public view {
        (string memory altId, string memory source) = reader.readSecurityAltId(0);

        assertEq(altId, "US0378331005");
        assertEq(source, "1"); // ISIN
    }

    function test_ReadBondDetails() public view {
        (string memory symbol, uint256 coupon, uint256 maturity) = reader.readBondDetails();

        assertEq(symbol, "US0378331005");
        assertEq(coupon, 42500); // 4.250 with 4 decimals
        assertTrue(maturity > 1735689600);
    }

    function test_GetISIN() public view {
        string memory isin = reader.getISIN();
        assertEq(isin, "US0378331005");
    }

    function test_HasMatured() public {
        // Set timestamp before maturity (June 1, 2025)
        vm.warp(1748736000); // June 1, 2025
        assertFalse(reader.hasMatured());

        // Set timestamp after maturity (June 20, 2025)
        vm.warp(1750032000); // June 20, 2025
        assertTrue(reader.hasMatured());
    }

    function test_CalculateTotalInterest() public view {
        // For a $1,000,000 bond with 4.25% coupon
        uint256 principal = 1_000_000 * 10**18; // 1M in wei
        uint256 interest = reader.calculateTotalInterest(principal);

        // Coupon is parsed with 4 decimals: "4.250" -> 42500
        // Calculation: (1,000,000 * 10^18 * 42500) / 10000 = 4,250,000 * 10^18
        // That's 4.25M wei = 4.25% of principal
        uint256 expected = (principal * 42500) / 10000;
        assertEq(interest, expected);
    }

    function test_ERC20Functionality() public view {
        // Test basic ERC20 functionality
        assertEq(reader.name(), "Apple Bond Token");
        assertEq(reader.symbol(), "AAPL-BOND");
        assertEq(reader.totalSupply(), 1_000_000 * 10**18);
        assertEq(reader.balanceOf(address(this)), 1_000_000 * 10**18);
    }

    function test_GetFixDescriptor() public view {
        IFixDescriptor.FixDescriptor memory descriptor = reader.getFixDescriptor();
        assertEq(descriptor.fixMajor, 4);
        assertEq(descriptor.fixMinor, 4);
        assertTrue(descriptor.fixCBORPtr != address(0));
        assertTrue(descriptor.fixCBORLen > 0);
    }

    function test_GetFixRoot() public view {
        bytes32 root = reader.getFixRoot();
        bytes32 expectedRoot = GeneratedMerkleData.getBondMerkleRoot();
        assertEq(root, expectedRoot);
    }

    function test_GetFixCBORChunk() public view {
        // Get full CBOR data
        IFixDescriptor.FixDescriptor memory descriptor = reader.getFixDescriptor();
        bytes memory chunk = reader.getFixCBORChunk(0, descriptor.fixCBORLen);

        // Verify it matches the original CBOR
        bytes memory expectedCBOR = GeneratedCBORTestData.getBondDescriptor();
        assertEq(chunk.length, expectedCBOR.length);
        assertEq(keccak256(chunk), keccak256(expectedCBOR));
    }
}
