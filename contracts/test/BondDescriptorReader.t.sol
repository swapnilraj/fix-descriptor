// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/examples/BondDescriptorReader.sol";
import "../src/generated/GeneratedCBORTestData.sol";

contract BondDescriptorReaderTest is Test {
    BondDescriptorReader reader;

    function setUp() public {
        reader = new BondDescriptorReader();
    }

    function test_ReadSymbol() public view {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();
        string memory symbol = reader.readSymbol(cbor);
        assertEq(symbol, "US0378331005");
    }

    function test_ReadCouponRate() public view {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();

        // Read with 3 decimals: "4.250" -> 4250
        uint256 coupon3 = reader.readCouponRate(cbor, 3);
        assertEq(coupon3, 4250);

        // Read with 4 decimals: "4.250" -> 42500
        uint256 coupon4 = reader.readCouponRate(cbor, 4);
        assertEq(coupon4, 42500);
    }

    function test_ReadMaturityDate() public view {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();
        uint256 maturity = reader.readMaturityDate(cbor);

        // Verify it's a reasonable timestamp for June 15, 2025
        assertTrue(maturity > 1735689600); // Jan 1, 2025
        assertTrue(maturity < 1893456000); // Jan 1, 2030
    }

    function test_ReadSecurityAltId() public view {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();

        (string memory altId, string memory source) = reader.readSecurityAltId(cbor, 0);

        assertEq(altId, "US0378331005");
        assertEq(source, "1"); // ISIN
    }

    function test_ReadBondDetails() public view {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();

        (string memory symbol, uint256 coupon, uint256 maturity) = reader.readBondDetails(cbor);

        assertEq(symbol, "US0378331005");
        assertEq(coupon, 42500); // 4.250 with 4 decimals
        assertTrue(maturity > 1735689600);
    }

    function test_GetISIN() public view {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();
        string memory isin = reader.getISIN(cbor);
        assertEq(isin, "US0378331005");
    }

    function test_HasMatured() public {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();

        // Set timestamp before maturity (June 1, 2025)
        vm.warp(1748736000); // June 1, 2025
        assertFalse(reader.hasMatured(cbor));

        // Set timestamp after maturity (June 20, 2025)
        vm.warp(1750032000); // June 20, 2025
        assertTrue(reader.hasMatured(cbor));
    }

    function test_CalculateTotalInterest() public view {
        bytes memory cbor = GeneratedCBORTestData.getBondDescriptor();

        // For a $1,000,000 bond with 4.25% coupon
        uint256 principal = 1_000_000 * 10**18; // 1M in wei
        uint256 interest = reader.calculateTotalInterest(cbor, principal);

        // Coupon is parsed with 4 decimals: "4.250" -> 42500
        // Calculation: (1,000,000 * 10^18 * 42500) / 10000 = 4,250,000 * 10^18
        // That's 4.25M wei = 4.25% of principal
        uint256 expected = (principal * 42500) / 10000;
        assertEq(interest, expected);
    }

    function test_RevertOnMissingField() public {
        // CBOR without Symbol field (only has tag 223)
        bytes memory cbor = hex"a1_18df_6534_2e323530"; // {223: "4.250"}

        vm.expectRevert(bytes("Symbol not found"));
        this.externalReadSymbol(cbor);
    }

    // External wrapper for testing reverts
    function externalReadSymbol(bytes memory cbor) external view returns (string memory) {
        return reader.readSymbol(cbor);
    }

    function test_RevertOnWrongISINSource() public {
        // Build CBOR with SecurityAltIDSource = "2" (CUSIP, not ISIN)
        // Keys must be sorted: 55 < 223 < 454 < 541
        bytes memory cbor = hex"a4"
            hex"1837_6c_55533033373833_33313030_35"  // 55: Symbol
            hex"18df_6534_2e323530"                  // 223: CouponRate
            hex"1901c6"                              // 454: NoSecurityAltID
            hex"81_a2"                               // array with 1 map (keys 455 < 456)
            hex"1901c7_6c_55533033373833_33313030_35"  // 455: SecurityAltID
            hex"1901c8_6132"                         // 456: SecurityAltIDSource = "2" (CUSIP)
            hex"19021d_6832_30323530_363135";        // 541: MaturityDate

        vm.expectRevert(bytes("First SecurityAltID is not ISIN"));
        reader.getISIN(cbor);
    }
}
