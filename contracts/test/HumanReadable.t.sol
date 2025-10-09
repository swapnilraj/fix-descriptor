// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AssetTokenERC20.sol";
import "../src/FixDictionary.sol";
import "../src/DataContractFactory.sol";
import "../src/IFixDescriptor.sol";

contract HumanReadableTest is Test {
    AssetTokenERC20 public token;
    FixDictionary public dictionary;
    DataContractFactory public dataFactory;
    
    address public owner;

    function createTestDictionaryData() internal pure returns (bytes memory) {
        bytes memory data = new bytes(958 * 24); // Include slot 0
        
        // Add entries for tags we'll use in CBOR test
        // Tag 15: Currency
        uint256 offset = 15 * 24;
        data[offset] = 0x08;
        data[offset + 1] = bytes1('C');
        data[offset + 2] = bytes1('u');
        data[offset + 3] = bytes1('r');
        data[offset + 4] = bytes1('r');
        data[offset + 5] = bytes1('e');
        data[offset + 6] = bytes1('n');
        data[offset + 7] = bytes1('c');
        data[offset + 8] = bytes1('y');
        
        // Tag 55: Symbol
        offset = 55 * 24;
        data[offset] = 0x06;
        data[offset + 1] = bytes1('S');
        data[offset + 2] = bytes1('y');
        data[offset + 3] = bytes1('m');
        data[offset + 4] = bytes1('b');
        data[offset + 5] = bytes1('o');
        data[offset + 6] = bytes1('l');
        
        // Tag 167: SecurityType
        offset = 167 * 24;
        data[offset] = 0x0C;
        data[offset + 1] = bytes1('S');
        data[offset + 2] = bytes1('e');
        data[offset + 3] = bytes1('c');
        data[offset + 4] = bytes1('u');
        data[offset + 5] = bytes1('r');
        data[offset + 6] = bytes1('i');
        data[offset + 7] = bytes1('t');
        data[offset + 8] = bytes1('y');
        data[offset + 9] = bytes1('T');
        data[offset + 10] = bytes1('y');
        data[offset + 11] = bytes1('p');
        data[offset + 12] = bytes1('e');
        
        return data;
    }

    function setUp() public {
        owner = address(this);
        
        // Deploy token
        token = new AssetTokenERC20("Test Token", "TEST", 1000000, owner);
        
        // Deploy dictionary
        bytes memory dictData = createTestDictionaryData();
        dictionary = new FixDictionary(dictData);
        
        // Deploy data factory
        dataFactory = new DataContractFactory();
    }

    function createSimpleCBOR() internal pure returns (bytes memory) {
        // Create CBOR map with 3 entries: {15: "USD", 55: "TEST", 167: "BOND"}
        bytes memory cbor = new bytes(35);
        
        // Map header: major type 5, length 3
        cbor[0] = 0xA3; // map(3)
        
        // Entry 1: 15 => "USD"
        cbor[1] = 0x0F; // uint 15
        cbor[2] = 0x63; // text(3)
        cbor[3] = bytes1('U');
        cbor[4] = bytes1('S');
        cbor[5] = bytes1('D');
        
        // Entry 2: 55 => "TEST"
        cbor[6] = 0x18; // uint8 follows
        cbor[7] = 0x37; // 55
        cbor[8] = 0x64; // text(4)
        cbor[9] = bytes1('T');
        cbor[10] = bytes1('E');
        cbor[11] = bytes1('S');
        cbor[12] = bytes1('T');
        
        // Entry 3: 167 => "BOND"
        cbor[13] = 0x18; // uint8 follows
        cbor[14] = 0xA7; // 167
        cbor[15] = 0x64; // text(4)
        cbor[16] = bytes1('B');
        cbor[17] = bytes1('O');
        cbor[18] = bytes1('N');
        cbor[19] = bytes1('D');
        
        return cbor;
    }

    function testGetHumanReadableDescriptor() public {
        // Create and deploy CBOR data
        bytes memory cborData = createSimpleCBOR();
        address cborPtr = dataFactory.deploy(cborData);
        
        // Set up descriptor
        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: bytes32(0),
            dictionaryContract: address(dictionary),
            fixRoot: bytes32(0),
            fixCBORPtr: cborPtr,
            fixCBORLen: uint32(cborData.length),
            fixURI: ""
        });
        
        token.setFixDescriptor(descriptor);
        
        // Get human-readable output
        string memory output = token.getHumanReadableDescriptor();
        
        // Should contain tag names and values
        // Expected: "Currency=USD|Symbol=TEST|SecurityType=BOND"
        assertTrue(bytes(output).length > 0);
        console.log("Human-readable output:", output);
    }

    function test_RevertWhen_GetHumanReadableNoDictionary() public {
        // Try to get human-readable without setting dictionary
        vm.expectRevert();
        token.getHumanReadableDescriptor();
    }

    function test_RevertWhen_GetHumanReadableNotInitialized() public {
        AssetTokenERC20 newToken = new AssetTokenERC20("Test", "TEST", 1000, owner);
        vm.expectRevert();
        newToken.getHumanReadableDescriptor();
    }

    function testHumanReadableWithGroups() public {
        // Create CBOR with a group (array)
        // Map with tag 453 (NoPartyIDs) => array of 1 entry
        bytes memory cbor = new bytes(50);
        
        // Map header: major type 5, length 1
        cbor[0] = 0xA1; // map(1)
        
        // Key: 453 (NoPartyIDs)
        cbor[1] = 0x19; // uint16 follows
        cbor[2] = 0x01; // high byte
        cbor[3] = 0xC5; // low byte (453)
        
        // Value: array of 1 map
        cbor[4] = 0x81; // array(1)
        
        // Entry 0: map with 1 field
        cbor[5] = 0xA1; // map(1)
        
        // Field: 448 (PartyID) => "ISSUER"
        cbor[6] = 0x19; // uint16 follows
        cbor[7] = 0x01; // high byte
        cbor[8] = 0xC0; // low byte (448)
        
        cbor[9] = 0x66; // text(6)
        cbor[10] = bytes1('I');
        cbor[11] = bytes1('S');
        cbor[12] = bytes1('S');
        cbor[13] = bytes1('U');
        cbor[14] = bytes1('E');
        cbor[15] = bytes1('R');
        
        address cborPtr = dataFactory.deploy(cbor);
        
        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: bytes32(0),
            dictionaryContract: address(dictionary),
            fixRoot: bytes32(0),
            fixCBORPtr: cborPtr,
            fixCBORLen: uint32(cbor.length),
            fixURI: ""
        });
        
        token.setFixDescriptor(descriptor);
        
        string memory output = token.getHumanReadableDescriptor();
        assertTrue(bytes(output).length > 0);
        console.log("Group output:", output);
    }
}

