// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {FixCBORReader} from "../src/FixCBORReader.sol";
import {FixValueParser} from "../src/FixValueParser.sol";

/// @title DemoCBORParser
/// @notice Demonstration script for CBOR parser usage
contract DemoCBORParser is Script {
    using FixCBORReader for bytes;

    function run() public view {
        console.log("=== CBOR Parser Demo ===\n");

        // Example 1: Simple field reading
        demo1SimpleFields();

        // Example 2: Group access
        demo2GroupAccess();

        // Example 3: Nested groups
        demo3NestedGroups();

        // Example 4: Value parsing
        demo4ValueParsing();

        console.log("\n=== Demo Complete ===");
    }

    function demo1SimpleFields() internal view {
        console.log("Demo 1: Simple Field Reading");
        console.log("----------------------------");

        // Build CBOR: {55: "AAPL", 223: "4.250"}
        bytes memory cbor = hex"a2"
            hex"1837_6441_41504c"     // 55: "AAPL"
            hex"18df_6534_2e323530";   // 223: "4.250"

        // Read symbol (tag 55)
        FixCBORReader.ReadResult memory result = FixCBORReader.getField(cbor, 55);
        if (result.found) {
            string memory symbol = FixValueParser.extractString(result.value);
            console.log("Symbol (tag 55):", symbol);
        }

        // Read coupon rate (tag 223)
        result = FixCBORReader.getField(cbor, 223);
        if (result.found) {
            string memory coupon = FixValueParser.extractString(result.value);
            console.log("CouponRate (tag 223):", coupon);
        }

        console.log("");
    }

    function demo2GroupAccess() internal view {
        console.log("Demo 2: Group Access");
        console.log("--------------------");

        // Build CBOR with SecurityAltID group
        // {454: [{455: "US0378331005", 456: "1"}, {455: "037833100", 456: "2"}]}
        bytes memory cbor = hex"a1"
            hex"1901c6"  // 454: NoSecurityAltID
            hex"82"      // array with 2 items
            hex"a2"      // first map
            hex"1901c7_6c_5553303337_38333331_303035"  // 455: "US0378331005"
            hex"1901c8_6131"                            // 456: "1"
            hex"a2"      // second map
            hex"1901c7_69_30333738_33333130_30"        // 455: "037833100"
            hex"1901c8_6132";                          // 456: "2"

        // Read first SecurityAltID (ISIN)
        uint16[] memory path = new uint16[](3);
        path[0] = 454;  // group tag
        path[1] = 0;    // first entry
        path[2] = 455;  // SecurityAltID field

        FixCBORReader.ReadResult memory result = FixCBORReader.getFieldByPath(cbor, path);
        if (result.found) {
            string memory isin = FixValueParser.extractString(result.value);
            console.log("First SecurityAltID:", isin);
        }

        // Read second SecurityAltID (CUSIP)
        path[1] = 1;  // second entry
        result = FixCBORReader.getFieldByPath(cbor, path);
        if (result.found) {
            string memory cusip = FixValueParser.extractString(result.value);
            console.log("Second SecurityAltID:", cusip);
        }

        console.log("");
    }

    function demo3NestedGroups() internal view {
        console.log("Demo 3: Nested Group Access");
        console.log("---------------------------");

        // Build CBOR with nested groups
        // {453: [{448: "BROKER001", 802: [{523: "DEPT01"}]}]}
        bytes memory cbor = hex"a1"
            hex"1901c5"                              // 453: NoPartyIDs
            hex"81"                                  // array with 1 item
            hex"a2"                                  // map with 2 items
            hex"1901c0_69_42524f4b_455230_3031"      // 448: "BROKER001"
            hex"190322"                              // 802: NoPartySubIDs
            hex"81"                                  // array with 1 item
            hex"a1"                                  // map with 1 item
            hex"19020b_66_44455054_3031";            // 523: "DEPT01"

        // Read nested field: path = [453, 0, 802, 0, 523]
        uint16[] memory path = new uint16[](5);
        path[0] = 453;  // NoPartyIDs
        path[1] = 0;    // first party
        path[2] = 802;  // NoPartySubIDs (nested)
        path[3] = 0;    // first sub-id
        path[4] = 523;  // PartySubID field

        FixCBORReader.ReadResult memory result = FixCBORReader.getFieldByPath(cbor, path);
        if (result.found) {
            string memory subId = FixValueParser.extractString(result.value);
            console.log("Nested PartySubID:", subId);
        }

        console.log("");
    }

    function demo4ValueParsing() internal view {
        console.log("Demo 4: Value Parsing");
        console.log("---------------------");

        // Decimal parsing
        bytes memory decimalCBOR = hex"6534_2e323530"; // "4.250"
        uint256 fixedPoint = FixValueParser.parseFixedPoint(decimalCBOR, 3);
        console.log("Decimal '4.250' as fixed-point (3 decimals):", fixedPoint);

        // Integer parsing
        bytes memory intCBOR = hex"65_3132333435"; // "12345"
        uint256 intVal = FixValueParser.parseInt(intCBOR);
        console.log("Integer '12345':", intVal);

        // Date parsing
        bytes memory dateCBOR = hex"68_32303235_30363135"; // "20250615"
        uint256 timestamp = FixValueParser.parseDate(dateCBOR);
        console.log("Date '20250615' as timestamp:", timestamp);

        console.log("");
    }
}
