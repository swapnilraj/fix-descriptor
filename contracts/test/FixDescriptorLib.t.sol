// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FixDescriptorLib.sol";
import "../src/IFixDescriptor.sol";
import "../src/SSTORE2.sol";
import "../src/FixDictionary.sol";

/// @title FixDescriptorLibTest
/// @notice Test suite for FixDescriptorLib library
contract FixDescriptorLibTest is Test {
    using FixDescriptorLib for FixDescriptorLib.Storage;

    // Test contract that uses the library
    TestToken testToken;

    // Sample data
    bytes sampleCBOR = hex"a2011901f70266555344"; // CBOR map with two fields
    bytes32 sampleRoot = bytes32(uint256(0x123456));
    bytes32 sampleDictHash = keccak256("test-dictionary");

    event FixDescriptorSet(
        bytes32 indexed fixRoot,
        bytes32 indexed dictHash,
        address fixCBORPtr,
        uint32 fixCBORLen
    );

    event FixDescriptorUpdated(
        bytes32 indexed oldRoot,
        bytes32 indexed newRoot,
        address newPtr
    );

    function setUp() public {
        testToken = new TestToken();
    }

    function testSetDescriptor() public {
        address cborPtr = SSTORE2.write(sampleCBOR);

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            dictionaryContract: address(0),
            fixRoot: sampleRoot,
            fixCBORPtr: cborPtr,
            fixCBORLen: uint32(sampleCBOR.length),
            fixURI: ""
        });

        // Expect FixDescriptorSet event
        vm.expectEmit(true, true, false, true);
        emit FixDescriptorSet(
            sampleRoot,
            sampleDictHash,
            cborPtr,
            uint32(sampleCBOR.length)
        );

        testToken.setDescriptor(descriptor);

        // Verify descriptor was set
        IFixDescriptor.FixDescriptor memory stored = testToken.getDescriptor();
        assertEq(stored.fixMajor, 4);
        assertEq(stored.fixMinor, 4);
        assertEq(stored.dictHash, sampleDictHash);
        assertEq(stored.fixRoot, sampleRoot);
        assertEq(stored.fixCBORPtr, cborPtr);
        assertEq(stored.fixCBORLen, uint32(sampleCBOR.length));
    }

    function testUpdateDescriptor() public {
        // Set initial descriptor
        address cborPtr1 = SSTORE2.write(sampleCBOR);
        IFixDescriptor.FixDescriptor memory descriptor1 = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            dictionaryContract: address(0),
            fixRoot: sampleRoot,
            fixCBORPtr: cborPtr1,
            fixCBORLen: uint32(sampleCBOR.length),
            fixURI: ""
        });

        testToken.setDescriptor(descriptor1);

        // Update with new descriptor
        bytes32 newRoot = bytes32(uint256(0x654321));
        bytes memory newCBOR = hex"a1011902"; 
        address cborPtr2 = SSTORE2.write(newCBOR);

        IFixDescriptor.FixDescriptor memory descriptor2 = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            dictionaryContract: address(0),
            fixRoot: newRoot,
            fixCBORPtr: cborPtr2,
            fixCBORLen: uint32(newCBOR.length),
            fixURI: ""
        });

        // Expect FixDescriptorUpdated event
        vm.expectEmit(true, true, false, true);
        emit FixDescriptorUpdated(sampleRoot, newRoot, cborPtr2);

        testToken.setDescriptor(descriptor2);

        // Verify descriptor was updated
        IFixDescriptor.FixDescriptor memory stored = testToken.getDescriptor();
        assertEq(stored.fixRoot, newRoot);
        assertEq(stored.fixCBORPtr, cborPtr2);
    }

    function testGetDescriptorNotInitialized() public {
        TestToken uninitializedToken = new TestToken();

        vm.expectRevert("Descriptor not initialized");
        uninitializedToken.getDescriptor();
    }

    function testGetRoot() public {
        address cborPtr = SSTORE2.write(sampleCBOR);

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            dictionaryContract: address(0),
            fixRoot: sampleRoot,
            fixCBORPtr: cborPtr,
            fixCBORLen: uint32(sampleCBOR.length),
            fixURI: ""
        });

        testToken.setDescriptor(descriptor);

        bytes32 root = testToken.getRoot();
        assertEq(root, sampleRoot);
    }

    function testGetRootNotInitialized() public {
        TestToken uninitializedToken = new TestToken();

        vm.expectRevert("Descriptor not initialized");
        uninitializedToken.getRoot();
    }

    function testGetFixCBORChunk() public {
        bytes memory testData = hex"0102030405060708090a0b0c0d0e0f"; // 15 bytes
        address cborPtr = SSTORE2.write(testData);

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            dictionaryContract: address(0),
            fixRoot: sampleRoot,
            fixCBORPtr: cborPtr,
            fixCBORLen: uint32(testData.length),
            fixURI: ""
        });

        testToken.setDescriptor(descriptor);

        // Read full chunk
        bytes memory chunk = testToken.getCBORChunk(0, 15);
        assertEq(chunk, testData);

        // Read partial chunk
        bytes memory partialChunk = testToken.getCBORChunk(5, 5);
        assertEq(partialChunk, hex"060708090a");

        // Read beyond end (should return available data)
        bytes memory overflow = testToken.getCBORChunk(10, 100);
        assertEq(overflow, hex"0b0c0d0e0f");

        // Read from beyond end (should return empty)
        bytes memory empty = testToken.getCBORChunk(100, 10);
        assertEq(empty.length, 0);
    }

    function testGetFixCBORChunkNotInitialized() public {
        TestToken uninitializedToken = new TestToken();

        vm.expectRevert("Descriptor not initialized");
        uninitializedToken.getCBORChunk(0, 10);
    }

    function testGetFixCBORChunkNoCBORDeployed() public {
        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            dictionaryContract: address(0),
            fixRoot: sampleRoot,
            fixCBORPtr: address(0), // No CBOR deployed
            fixCBORLen: 0,
            fixURI: ""
        });

        testToken.setDescriptor(descriptor);

        vm.expectRevert("CBOR not deployed");
        testToken.getCBORChunk(0, 10);
    }

    function testGetFullCBORData() public {
        bytes memory testData = hex"a201190037026455534454"; 
        address cborPtr = SSTORE2.write(testData);

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            dictionaryContract: address(0),
            fixRoot: sampleRoot,
            fixCBORPtr: cborPtr,
            fixCBORLen: uint32(testData.length),
            fixURI: ""
        });

        testToken.setDescriptor(descriptor);

        bytes memory fullData = testToken.getFullCBOR();
        assertEq(fullData, testData);
    }

    function testIsInitialized() public {
        assertFalse(testToken.isInitialized());

        address cborPtr = SSTORE2.write(sampleCBOR);
        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            dictionaryContract: address(0),
            fixRoot: sampleRoot,
            fixCBORPtr: cborPtr,
            fixCBORLen: uint32(sampleCBOR.length),
            fixURI: ""
        });

        testToken.setDescriptor(descriptor);

        assertTrue(testToken.isInitialized());
    }

    function testGetInterfaceId() public pure {
        bytes4 expectedId = type(IFixDescriptor).interfaceId;
        bytes4 actualId = FixDescriptorLib.getInterfaceId();
        assertEq(actualId, expectedId);
    }

    function testVerifyFieldProof() public {
        // Set up descriptor with a simple root (single leaf for simplicity)
        address cborPtr = SSTORE2.write(sampleCBOR);
        
        // Create a simple merkle tree with one leaf: hash(pathCBOR || value)
        bytes memory pathCBOR = hex"01";  // Simple CBOR-encoded path
        bytes memory value = hex"37";
        bytes32 leaf = keccak256(abi.encodePacked(pathCBOR, value));
        
        // For a single-leaf tree, the root IS the leaf
        bytes32 testRoot = leaf;

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            dictionaryContract: address(0),
            fixRoot: testRoot,
            fixCBORPtr: cborPtr,
            fixCBORLen: uint32(sampleCBOR.length),
            fixURI: ""
        });

        testToken.setDescriptor(descriptor);

        // Verify with empty proof (single leaf tree)
        bytes32[] memory proof = new bytes32[](0);
        bool[] memory directions = new bool[](0);

        bool result = testToken.verifyFieldProofWrapper(
            pathCBOR,
            value,
            proof,
            directions
        );

        assertTrue(result);
    }

    function testFuzzSetDescriptor(
        uint16 major,
        uint16 minor,
        bytes32 dictHash,
        bytes32 root,
        uint32 cborLen
    ) public {
        address cborPtr = address(uint160(uint256(keccak256(abi.encodePacked(cborLen)))));

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: major,
            fixMinor: minor,
            dictHash: dictHash,
            dictionaryContract: address(0),
            fixRoot: root,
            fixCBORPtr: cborPtr,
            fixCBORLen: cborLen,
            fixURI: ""
        });

        testToken.setDescriptor(descriptor);

        IFixDescriptor.FixDescriptor memory stored = testToken.getDescriptor();
        assertEq(stored.fixMajor, major);
        assertEq(stored.fixMinor, minor);
        assertEq(stored.dictHash, dictHash);
        assertEq(stored.fixRoot, root);
        assertEq(stored.fixCBORLen, cborLen);
    }
}

/// @title TestToken
/// @notice Simple test contract that uses FixDescriptorLib
contract TestToken {
    using FixDescriptorLib for FixDescriptorLib.Storage;

    FixDescriptorLib.Storage private _fixDescriptor;

    function setDescriptor(IFixDescriptor.FixDescriptor calldata descriptor) external {
        _fixDescriptor.setDescriptor(descriptor);
    }

    function getDescriptor() external view returns (IFixDescriptor.FixDescriptor memory) {
        return _fixDescriptor.getDescriptor();
    }

    function getRoot() external view returns (bytes32) {
        return _fixDescriptor.getRoot();
    }

    function getCBORChunk(uint256 start, uint256 size) external view returns (bytes memory) {
        return _fixDescriptor.getFixCBORChunk(start, size);
    }

    function getFullCBOR() external view returns (bytes memory) {
        return _fixDescriptor.getFullCBORData();
    }

    function getHumanReadable() external view returns (string memory) {
        return _fixDescriptor.getHumanReadable();
    }

    function isInitialized() external view returns (bool) {
        return _fixDescriptor.isInitialized();
    }

    function verifyFieldProofWrapper(
        bytes calldata pathCBOR,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) external view returns (bool) {
        return _fixDescriptor.verifyFieldProof(pathCBOR, value, proof, directions);
    }
}

