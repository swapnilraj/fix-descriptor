// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/FixDictionary.sol";
import "../src/FixDictionaryFactory.sol";

contract FixDictionaryTest is Test {
    FixDictionary public dictionary;
    FixDictionaryFactory public factory;

    // Create a small test dictionary for testing  
    function createTestDictionaryData() internal pure returns (bytes memory) {
        bytes memory data = new bytes(958 * 24); // Include slot 0
        
        // Add some test entries
        // Tag 15: Currency (8 chars)
        uint256 offset = 15 * 24;
        data[offset] = 0x08; // length
        data[offset + 1] = bytes1('C');
        data[offset + 2] = bytes1('u');
        data[offset + 3] = bytes1('r');
        data[offset + 4] = bytes1('r');
        data[offset + 5] = bytes1('e');
        data[offset + 6] = bytes1('n');
        data[offset + 7] = bytes1('c');
        data[offset + 8] = bytes1('y');
        
        // Tag 55: Symbol (6 chars)
        offset = 55 * 24;
        data[offset] = 0x06; // length
        data[offset + 1] = bytes1('S');
        data[offset + 2] = bytes1('y');
        data[offset + 3] = bytes1('m');
        data[offset + 4] = bytes1('b');
        data[offset + 5] = bytes1('o');
        data[offset + 6] = bytes1('l');
        
        // Tag 167: SecurityType (12 chars)
        offset = 167 * 24;
        data[offset] = 0x0C; // length
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
        
        // Tag 448: PartyID (7 chars)
        offset = 448 * 24;
        data[offset] = 0x07; // length
        data[offset + 1] = bytes1('P');
        data[offset + 2] = bytes1('a');
        data[offset + 3] = bytes1('r');
        data[offset + 4] = bytes1('t');
        data[offset + 5] = bytes1('y');
        data[offset + 6] = bytes1('I');
        data[offset + 7] = bytes1('D');
        
        return data;
    }

    function setUp() public {
        factory = new FixDictionaryFactory();
        bytes memory testData = createTestDictionaryData();
        dictionary = new FixDictionary(testData);
    }

    function testGetTagName() public view {
        assertEq(dictionary.getTagName(15), "Currency");
        assertEq(dictionary.getTagName(55), "Symbol");
        assertEq(dictionary.getTagName(167), "SecurityType");
        assertEq(dictionary.getTagName(448), "PartyID");
    }

    function testGetUndefinedTag() public view {
        // Tag 1 is not defined in test data
        assertEq(dictionary.getTagName(1), "");
    }

    function testGetTagNames() public view {
        uint16[] memory tags = new uint16[](3);
        tags[0] = 15;
        tags[1] = 55;
        tags[2] = 167;
        
        string[] memory names = dictionary.getTagNames(tags);
        
        assertEq(names.length, 3);
        assertEq(names[0], "Currency");
        assertEq(names[1], "Symbol");
        assertEq(names[2], "SecurityType");
    }

    function testHasTag() public view {
        assertTrue(dictionary.hasTag(15));
        assertTrue(dictionary.hasTag(55));
        assertFalse(dictionary.hasTag(1));
        assertFalse(dictionary.hasTag(100));
    }

    function testGetSlot() public view {
        bytes memory slot = dictionary.getSlot(15);
        assertEq(slot.length, 24);
        assertEq(uint8(slot[0]), 8); // length
        assertEq(slot[1], bytes1('C')); // first char
    }

    function test_RevertWhen_GetTagZero() public {
        vm.expectRevert();
        dictionary.getTagName(0);
    }

    function test_RevertWhen_GetTagOutOfRange() public {
        vm.expectRevert();
        dictionary.getTagName(958);
    }

    function testDataContract() public view {
        address dataPtr = dictionary.dataContract();
        assertTrue(dataPtr != address(0));
        
        // Verify we can read from it
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(dataPtr)
        }
        assertTrue(codeSize > 0);
    }

    function testConstants() public view {
        assertEq(dictionary.MAX_TAG(), 957);
        assertEq(dictionary.SLOT_SIZE(), 24);
    }

    function testFactoryDeploy() public {
        bytes memory testData = createTestDictionaryData();
        
        address dictAddr = factory.deployDictionary(testData, 4, 4);
        
        assertTrue(dictAddr != address(0));
        
        FixDictionary deployed = FixDictionary(dictAddr);
        assertEq(deployed.getTagName(15), "Currency");
    }

    function testFactoryGetDictionary() public {
        bytes memory testData = createTestDictionaryData();
        
        address dictAddr = factory.deployDictionary(testData, 4, 4);
        address retrieved = factory.getDictionary(4, 4);
        
        assertEq(dictAddr, retrieved);
    }

    function testFactoryMultipleVersions() public {
        bytes memory testData1 = createTestDictionaryData();
        bytes memory testData2 = createTestDictionaryData();
        
        address dict44 = factory.deployDictionary(testData1, 4, 4);
        address dict50 = factory.deployDictionary(testData2, 5, 0);
        
        assertTrue(dict44 != dict50);
        assertEq(factory.getDictionary(4, 4), dict44);
        assertEq(factory.getDictionary(5, 0), dict50);
    }

    function test_RevertWhen_InvalidDataLength() public {
        bytes memory invalidData = new bytes(100);
        vm.expectRevert();
        new FixDictionary(invalidData);
    }
}

