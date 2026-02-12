// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DataContractFactory.sol";
import "../src/AssetTokenFactory.sol";

/**
 * @title DeployFactory
 * @notice Deployment script for AssetTokenFactory and DataContractFactory
 * @dev Deploys the factory contracts needed for token deployment
 */
contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy DataContractFactory for SBE storage
        DataContractFactory dataFactory = new DataContractFactory();
        console.log("DataContractFactory deployed at:", address(dataFactory));

        // Deploy AssetTokenFactory
        AssetTokenFactory tokenFactory = new AssetTokenFactory(address(dataFactory));
        console.log("AssetTokenFactory deployed at:", address(tokenFactory));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("Deployer:", msg.sender);
        console.log("DataContractFactory:", address(dataFactory));
        console.log("AssetTokenFactory:", address(tokenFactory));
        console.log("\n=== Environment Variables for Frontend ===");
        console.log("NEXT_PUBLIC_DATA_FACTORY_ADDRESS=%s", address(dataFactory));
        console.log("NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=%s", address(tokenFactory));
    }
}
