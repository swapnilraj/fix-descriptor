// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AssetTokenFactory.sol";
import "../src/AssetTokenERC20.sol";
import "../src/DataContractFactory.sol";
import "../src/IFixDescriptor.sol";

contract AssetTokenFactoryTest is Test {
    AssetTokenFactory public factory;
    DataContractFactory public dataFactory;
    
    address public deployer = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        dataFactory = new DataContractFactory();
        factory = new AssetTokenFactory(address(dataFactory));
    }

    function testFactoryDeployment() public view {
        assertEq(address(factory.dataFactory()), address(dataFactory));
        assertEq(factory.getDeployedTokensCount(), 0);
    }

    function testDeployAssetToken() public {
        address tokenAddress = factory.deployAssetToken(
            "Test Token",
            "TEST",
            1000000 * 10**18
        );

        assertTrue(tokenAddress != address(0));
        assertEq(factory.getDeployedTokensCount(), 1);
        assertTrue(factory.isFactoryToken(tokenAddress));

        // Check token properties
        AssetTokenERC20 token = AssetTokenERC20(tokenAddress);
        assertEq(token.name(), "Test Token");
        assertEq(token.symbol(), "TEST");
        assertEq(token.totalSupply(), 1000000 * 10**18);
        assertEq(token.owner(), deployer);
        assertEq(token.balanceOf(deployer), 1000000 * 10**18);
    }

    function testDeployMultipleTokens() public {
        address token1 = factory.deployAssetToken("Token1", "TK1", 1000);
        address token2 = factory.deployAssetToken("Token2", "TK2", 2000);
        address token3 = factory.deployAssetToken("Token3", "TK3", 3000);

        assertEq(factory.getDeployedTokensCount(), 3);
        
        (address[] memory tokens, uint256 total) = factory.getDeployedTokens(0, 10);
        assertEq(total, 3);
        assertEq(tokens.length, 3);
        assertEq(tokens[0], token1);
        assertEq(tokens[1], token2);
        assertEq(tokens[2], token3);
    }

    function testTokensByDeployer() public {
        // Deploy from deployer
        address token1 = factory.deployAssetToken("Token1", "TK1", 1000);
        address token2 = factory.deployAssetToken("Token2", "TK2", 2000);

        // Deploy from user1
        vm.prank(user1);
        address token3 = factory.deployAssetToken("Token3", "TK3", 3000);

        address[] memory deployerTokens = factory.getTokensByDeployer(deployer);
        assertEq(deployerTokens.length, 2);
        assertEq(deployerTokens[0], token1);
        assertEq(deployerTokens[1], token2);

        address[] memory user1Tokens = factory.getTokensByDeployer(user1);
        assertEq(user1Tokens.length, 1);
        assertEq(user1Tokens[0], token3);
    }

    function testDeployWithDescriptor() public {
        // Create test CBOR data
        bytes memory cborData = hex"a1186f6355534404";
        
        // Create descriptor
        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: keccak256("test-dict"),
            fixRoot: bytes32(uint256(12345)),
            fixCBORPtr: address(0), // Will be set by factory
            fixCBORLen: 0,          // Will be set by factory
            fixURI: "ipfs://test"
        });

        // Deploy with descriptor
        (address tokenAddress, address cborPtr) = factory.deployWithDescriptor(
            "Treasury Token",
            "USTB",
            1000000 * 10**18,
            cborData,
            descriptor
        );

        assertTrue(tokenAddress != address(0));
        assertTrue(cborPtr != address(0));

        // Verify token
        AssetTokenERC20 token = AssetTokenERC20(tokenAddress);
        assertEq(token.name(), "Treasury Token");
        assertEq(token.owner(), deployer);

        // Verify descriptor
        IFixDescriptor.FixDescriptor memory retrieved = token.getFixDescriptor();
        assertEq(retrieved.fixMajor, 4);
        assertEq(retrieved.fixMinor, 4);
        assertEq(retrieved.dictHash, keccak256("test-dict"));
        assertEq(retrieved.fixRoot, bytes32(uint256(12345)));
        assertEq(retrieved.fixCBORPtr, cborPtr);
        assertEq(retrieved.fixCBORLen, uint32(cborData.length));
        assertEq(retrieved.fixURI, "ipfs://test");
    }

    function testPaginatedTokenList() public {
        // Deploy 10 tokens
        for (uint256 i = 0; i < 10; i++) {
            factory.deployAssetToken(
                string(abi.encodePacked("Token", vm.toString(i))),
                string(abi.encodePacked("TK", vm.toString(i))),
                1000
            );
        }

        // Get first 5
        (address[] memory tokens1, uint256 total1) = factory.getDeployedTokens(0, 5);
        assertEq(total1, 10);
        assertEq(tokens1.length, 5);

        // Get next 5
        (address[] memory tokens2, uint256 total2) = factory.getDeployedTokens(5, 5);
        assertEq(total2, 10);
        assertEq(tokens2.length, 5);

        // Ensure no overlap
        assertTrue(tokens1[0] != tokens2[0]);
    }

    function testPaginationBeyondLimit() public {
        factory.deployAssetToken("Token1", "TK1", 1000);

        (address[] memory tokens, uint256 total) = factory.getDeployedTokens(10, 5);
        assertEq(total, 1);
        assertEq(tokens.length, 0);
    }

    function testIsFactoryToken() public {
        address token1 = factory.deployAssetToken("Token1", "TK1", 1000);
        address randomAddress = address(0x9999);

        assertTrue(factory.isFactoryToken(token1));
        assertFalse(factory.isFactoryToken(randomAddress));
    }

    function testOwnershipTransfer() public {
        address tokenAddress = factory.deployAssetToken("Token", "TK", 1000);
        AssetTokenERC20 token = AssetTokenERC20(tokenAddress);

        // Deployer is the owner
        assertEq(token.owner(), deployer);

        // Only owner can set descriptor
        IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: bytes32(0),
            fixRoot: bytes32(0),
            fixCBORPtr: address(0),
            fixCBORLen: 0,
            fixURI: ""
        });

        // Deployer can set descriptor
        token.setFixDescriptor(descriptor);

        // Non-owner cannot set descriptor
        vm.prank(user1);
        vm.expectRevert();
        token.setFixDescriptor(descriptor);
    }

    function testEmitEvents() public {
        // We can't predict the exact address, but we can check the event was emitted
        vm.recordLogs();
        
        address tokenAddress = factory.deployAssetToken("Test", "TST", 1000);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        
        // Should have emitted AssetTokenDeployed event
        bool found = false;
        for (uint i = 0; i < entries.length; i++) {
            // Check event signature matches AssetTokenDeployed
            if (entries[i].topics[0] == keccak256("AssetTokenDeployed(address,address,string,string,uint256)")) {
                found = true;
                assertEq(address(uint160(uint256(entries[i].topics[1]))), tokenAddress);
                assertEq(address(uint160(uint256(entries[i].topics[2]))), deployer);
                break;
            }
        }
        assertTrue(found, "AssetTokenDeployed event not emitted");
    }

    function testFactoryWithMultipleDeployers() public {
        // Deployer deploys 2 tokens
        factory.deployAssetToken("Token1", "TK1", 1000);
        factory.deployAssetToken("Token2", "TK2", 2000);

        // User1 deploys 1 token
        vm.prank(user1);
        factory.deployAssetToken("Token3", "TK3", 3000);

        // User2 deploys 2 tokens
        vm.startPrank(user2);
        factory.deployAssetToken("Token4", "TK4", 4000);
        factory.deployAssetToken("Token5", "TK5", 5000);
        vm.stopPrank();

        // Check totals
        assertEq(factory.getDeployedTokensCount(), 5);
        assertEq(factory.getTokensByDeployer(deployer).length, 2);
        assertEq(factory.getTokensByDeployer(user1).length, 1);
        assertEq(factory.getTokensByDeployer(user2).length, 2);
    }

    function testInvalidFactoryAddress() public {
        vm.expectRevert("Invalid factory address");
        new AssetTokenFactory(address(0));
    }
}
