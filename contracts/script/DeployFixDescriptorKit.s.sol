// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {DataContractFactory} from "../src/DataContractFactory.sol";
import {DescriptorRegistry} from "../src/DescriptorRegistry.sol";
import {FixMerkleVerifier} from "../src/FixMerkleVerifier.sol";

contract DeployFixDescriptorKit is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy DataContractFactory
        DataContractFactory factory = new DataContractFactory();
        console.log("DataContractFactory deployed at:", address(factory));
        
        // Deploy DescriptorRegistry
        DescriptorRegistry registry = new DescriptorRegistry();
        console.log("DescriptorRegistry deployed at:", address(registry));
        
        // FixMerkleVerifier is a library, no deployment needed
        console.log("FixMerkleVerifier: Library (no deployment needed)");
        
        vm.stopBroadcast();
        
        // Output environment variables for the web app
        console.log("\n=== Environment Variables for Web App ===");
        console.log("NEXT_PUBLIC_FACTORY_ADDRESS=%s", address(factory));
        console.log("NEXT_PUBLIC_REGISTRY_ADDRESS=%s", address(registry));
        console.log("NEXT_PUBLIC_VERIFIER_ADDRESS=0x0000000000000000000000000000000000000000");
        console.log("NEXT_PUBLIC_LAST_DEPLOYED_PTR=0x0000000000000000000000000000000000000000");
    }
}
