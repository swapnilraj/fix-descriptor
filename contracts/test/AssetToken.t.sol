// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AssetTokenERC20.sol";
import "../src/AssetTokenERC721.sol";
import "../src/DataContractFactory.sol";
import "../src/IFixDescriptor.sol";

contract AssetTokenTest is Test {
    AssetTokenERC20 public erc20Token;
    AssetTokenERC721 public erc721Token;
    DataContractFactory public factory;
    
    address public owner = address(this);
    address public user = address(0x1);

    function setUp() public {
        // Deploy contracts
        erc20Token = new AssetTokenERC20("Test Token", "TEST", 1000000 * 10**18, owner);
        erc721Token = new AssetTokenERC721("Test NFT", "TNFT");
        factory = new DataContractFactory();
    }

    function testERC20Deployment() public view {
        assertEq(erc20Token.name(), "Test Token");
        assertEq(erc20Token.symbol(), "TEST");
        assertEq(erc20Token.totalSupply(), 1000000 * 10**18);
    }

    function testERC721Deployment() public view {
        assertEq(erc721Token.name(), "Test NFT");
        assertEq(erc721Token.symbol(), "TNFT");
    }

    function testERC20SetFixDescriptor() public {
        // Create mock SBE data
        bytes memory sbeData = hex"a1186f6355534404"; // Simple SBE data
        address sbePtr = factory.deploy(sbeData);

        // Create descriptor
        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: keccak256("test-dict"),
            fixRoot: bytes32(uint256(1)),
            fixSBEPtr: sbePtr,
            fixSBELen: uint32(sbeData.length),
            schemaURI: ""
        });

        // Set descriptor
        vm.expectEmit(true, true, false, true);
        emit IFixDescriptor.FixDescriptorSet(
            descriptor.fixRoot,
            descriptor.dictHash,
            descriptor.fixSBEPtr,
            descriptor.fixSBELen
        );
        erc20Token.setFixDescriptor(descriptor);

        // Verify descriptor
        IFixDescriptor.FixDescriptor memory retrieved = erc20Token.getFixDescriptor();
        assertEq(retrieved.fixMajor, 4);
        assertEq(retrieved.fixMinor, 4);
        assertEq(retrieved.dictHash, keccak256("test-dict"));
        assertEq(retrieved.fixRoot, bytes32(uint256(1)));
        assertEq(retrieved.fixSBEPtr, sbePtr);
        assertEq(retrieved.fixSBELen, uint32(sbeData.length));
    }

    function testERC721SetFixDescriptor() public {
        // Create mock SBE data
        bytes memory sbeData = hex"a1186f6355534404";
        address sbePtr = factory.deploy(sbeData);

        // Create descriptor
        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: keccak256("test-dict"),
            fixRoot: bytes32(uint256(1)),
            fixSBEPtr: sbePtr,
            fixSBELen: uint32(sbeData.length),
            schemaURI: ""
        });

        // Set descriptor
        erc721Token.setFixDescriptor(descriptor);

        // Verify descriptor
        IFixDescriptor.FixDescriptor memory retrieved = erc721Token.getFixDescriptor();
        assertEq(retrieved.fixRoot, bytes32(uint256(1)));
    }

    function testCannotSetDescriptorUnauthorized() public {
        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: bytes32(0),
            fixRoot: bytes32(0),
            fixSBEPtr: address(0),
            fixSBELen: 0,
            schemaURI: ""
        });

        // Try to set descriptor from non-owner
        vm.prank(user);
        vm.expectRevert();
        erc20Token.setFixDescriptor(descriptor);
    }

    function testUpdateDescriptor() public {
        // Set initial descriptor
        bytes memory sbeData1 = hex"a1186f6355534404";
        address sbePtr1 = factory.deploy(sbeData1);

        IFixDescriptor.FixDescriptor memory descriptor1 = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: keccak256("dict1"),
            fixRoot: bytes32(uint256(1)),
            fixSBEPtr: sbePtr1,
            fixSBELen: uint32(sbeData1.length),
            schemaURI: ""
        });
        erc20Token.setFixDescriptor(descriptor1);

        // Update descriptor
        bytes memory sbeData2 = hex"a2186f6355534404186f63555344";
        address sbePtr2 = factory.deploy(sbeData2);

        IFixDescriptor.FixDescriptor memory descriptor2 = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: keccak256("dict2"),
            fixRoot: bytes32(uint256(2)),
            fixSBEPtr: sbePtr2,
            fixSBELen: uint32(sbeData2.length),
            schemaURI: ""
        });

        vm.expectEmit(true, true, false, true);
        emit IFixDescriptor.FixDescriptorUpdated(
            bytes32(uint256(1)),
            bytes32(uint256(2)),
            sbePtr2
        );
        erc20Token.setFixDescriptor(descriptor2);

        // Verify updated descriptor
        assertEq(erc20Token.getFixRoot(), bytes32(uint256(2)));
    }

    function testERC165Support() public view {
        // Check IFixDescriptor interface support
        bytes4 interfaceId = type(IFixDescriptor).interfaceId;
        assertTrue(erc20Token.supportsInterface(interfaceId));
        assertTrue(erc721Token.supportsInterface(interfaceId));
    }

    function testGetFixRootBeforeInit() public {
        AssetTokenERC20 newToken = new AssetTokenERC20("New", "NEW", 1000, address(this));
        vm.expectRevert("Descriptor not initialized");
        newToken.getFixRoot();
    }

    function testERC721Minting() public {
        uint256 tokenId = erc721Token.mint(user);
        assertEq(tokenId, 0);
        assertEq(erc721Token.ownerOf(tokenId), user);
    }
}
