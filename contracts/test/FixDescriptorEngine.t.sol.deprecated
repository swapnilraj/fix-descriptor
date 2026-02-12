// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/cmtat/FixDescriptorEngine.sol";
import "../src/IFixDescriptor.sol";
import "../src/AssetTokenERC20.sol";
import "../src/SSTORE2.sol";

/// @title FixDescriptorEngineTest
/// @notice Test suite for FixDescriptorEngine contract
contract FixDescriptorEngineTest is Test {
    FixDescriptorEngine engine;
    AssetTokenERC20 token1;
    AssetTokenERC20 token2;
    address admin;
    address user;

    // Sample data
    bytes sampleSBE = hex"a2011901f70266555344"; // SBE encoded data
    bytes32 sampleRoot = bytes32(uint256(0x123456));
    bytes32 sampleDictHash = keccak256("test-dictionary");

    event FixDescriptorSet(
        bytes32 indexed fixRoot,
        bytes32 indexed dictHash,
        address fixSBEPtr,
        uint32 fixSBELen
    );

    event FixDescriptorUpdated(
        bytes32 indexed oldRoot,
        bytes32 indexed newRoot,
        address newPtr
    );

    function setUp() public {
        admin = address(0x1);
        user = address(0x2);
        
        vm.startPrank(admin);
        // Deploy test tokens first
        token1 = new AssetTokenERC20("Token1", "TKN1", 1000, admin);
        token2 = new AssetTokenERC20("Token2", "TKN2", 2000, admin);
        
        // Create engine bound to token1
        engine = new FixDescriptorEngine(address(token1), admin);
        vm.stopPrank();
    }

    function testSetDescriptor() public {
        address sbePtr = SSTORE2.write(sampleSBE);

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            fixRoot: sampleRoot,
            fixSBEPtr: sbePtr,
            fixSBELen: uint32(sampleSBE.length),
            schemaURI: ""
        });

        vm.prank(admin);
        engine.setFixDescriptor(descriptor);

        // Verify descriptor was set
        IFixDescriptor.FixDescriptor memory stored = engine.getFixDescriptor();
        assertEq(stored.fixMajor, 4);
        assertEq(stored.fixMinor, 4);
        assertEq(stored.dictHash, sampleDictHash);
        assertEq(stored.fixRoot, sampleRoot);
        assertEq(stored.fixSBEPtr, sbePtr);
        assertEq(stored.fixSBELen, uint32(sampleSBE.length));
        
        // Verify engine is bound to token1
        assertEq(engine.token(), address(token1));
    }

    function testSetDescriptorUnauthorized() public {
        address sbePtr = SSTORE2.write(sampleSBE);

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            fixRoot: sampleRoot,
            fixSBEPtr: sbePtr,
            fixSBELen: uint32(sampleSBE.length),
            schemaURI: ""
        });

        vm.prank(user);
        vm.expectRevert();
        engine.setFixDescriptor(descriptor);
    }

    function testGetRoot() public {
        address sbePtr = SSTORE2.write(sampleSBE);

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            fixRoot: sampleRoot,
            fixSBEPtr: sbePtr,
            fixSBELen: uint32(sampleSBE.length),
            schemaURI: ""
        });

        vm.prank(admin);
        engine.setFixDescriptor(descriptor);

        bytes32 root = engine.getFixRoot();
        assertEq(root, sampleRoot);
    }

    function testGetRootNotInitialized() public {
        vm.expectRevert("Descriptor not initialized");
        engine.getFixRoot();
    }

    function testUpdateDescriptor() public {
        // Set initial descriptor
        address sbePtr1 = SSTORE2.write(sampleSBE);
        IFixDescriptor.FixDescriptor memory descriptor1 = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            fixRoot: sampleRoot,
            fixSBEPtr: sbePtr1,
            fixSBELen: uint32(sampleSBE.length),
            schemaURI: ""
        });

        vm.prank(admin);
        engine.setFixDescriptor(descriptor1);

        // Update with new descriptor
        bytes32 newRoot = bytes32(uint256(0x654321));
        bytes memory newSBE = hex"a1011902";
        address sbePtr2 = SSTORE2.write(newSBE);

        IFixDescriptor.FixDescriptor memory descriptor2 = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            fixRoot: newRoot,
            fixSBEPtr: sbePtr2,
            fixSBELen: uint32(newSBE.length),
            schemaURI: ""
        });

        vm.prank(admin);
        engine.setFixDescriptor(descriptor2);

        // Verify update
        IFixDescriptor.FixDescriptor memory stored = engine.getFixDescriptor();
        assertEq(stored.fixRoot, newRoot);
        assertEq(stored.fixSBEPtr, sbePtr2);
    }

    function testMultipleTokens() public {
        address sbePtr1 = SSTORE2.write(sampleSBE);
        address sbePtr2 = SSTORE2.write(hex"a1011902");

        IFixDescriptor.FixDescriptor memory descriptor1 = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            fixRoot: sampleRoot,
            fixSBEPtr: sbePtr1,
            fixSBELen: uint32(sampleSBE.length),
            schemaURI: ""
        });

        bytes32 root2 = bytes32(uint256(0x789));
        IFixDescriptor.FixDescriptor memory descriptor2 = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            fixRoot: root2,
            fixSBEPtr: sbePtr2,
            fixSBELen: uint32(4),
            schemaURI: ""
        });

        vm.startPrank(admin);
        // Set descriptor for token1 (engine is bound to token1)
        engine.setFixDescriptor(descriptor1);
        
        // Create a separate engine for token2
        FixDescriptorEngine engine2 = new FixDescriptorEngine(address(token2), admin);
        engine2.setFixDescriptor(descriptor2);
        vm.stopPrank();

        // Verify each token has its own engine with its own descriptor
        assertEq(engine.getFixRoot(), sampleRoot);
        assertEq(engine.token(), address(token1));
        assertEq(engine2.getFixRoot(), root2);
        assertEq(engine2.token(), address(token2));
    }

    function testGetSBEChunk() public {
        address sbePtr = SSTORE2.write(sampleSBE);

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            fixRoot: sampleRoot,
            fixSBEPtr: sbePtr,
            fixSBELen: uint32(sampleSBE.length),
            schemaURI: ""
        });

        vm.prank(admin);
        engine.setFixDescriptor(descriptor);

        // Read chunk
        bytes memory chunk = engine.getFixSBEChunk(0, sampleSBE.length);
        assertEq(chunk.length, sampleSBE.length);
        assertEq(keccak256(chunk), keccak256(sampleSBE));
    }

    function testVersion() public {
        assertEq(engine.version(), "1.0.0");
    }

    function testHasRole() public {
        // Admin should have all roles
        assertTrue(engine.hasRole(engine.DESCRIPTOR_ADMIN_ROLE(), admin));
        assertTrue(engine.hasRole(engine.DEFAULT_ADMIN_ROLE(), admin));
        
        // User should not have roles
        assertFalse(engine.hasRole(engine.DESCRIPTOR_ADMIN_ROLE(), user));
    }

    function testTokenIntegration() public {
        address sbePtr = SSTORE2.write(sampleSBE);

        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: sampleDictHash,
            fixRoot: sampleRoot,
            fixSBEPtr: sbePtr,
            fixSBELen: uint32(sampleSBE.length),
            schemaURI: ""
        });

        // Set descriptor via engine directly (engine is bound to token1)
        vm.prank(admin);
        engine.setFixDescriptor(descriptor);

        // Engine should have the descriptor
        IFixDescriptor.FixDescriptor memory engineDescriptor = engine.getFixDescriptor();
        assertEq(engineDescriptor.fixRoot, sampleRoot);
        assertEq(engine.getFixRoot(), sampleRoot);
        assertEq(engine.token(), address(token1));
        
        // Token uses embedded storage, not engine
        assertEq(token1.getDescriptorEngine(), address(0));
    }
}
