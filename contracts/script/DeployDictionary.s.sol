// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/FixDictionary.sol";
import "../src/FixDictionaryFactory.sol";

/**
 * @title DeployDictionary
 * @notice Script to deploy FIX Dictionary contracts
 * @dev Usage: forge script script/DeployDictionary.s.sol --rpc-url <RPC> --broadcast
 */
contract DeployDictionary is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy factory
        FixDictionaryFactory factory = new FixDictionaryFactory();
        console.log("FixDictionaryFactory deployed at:", address(factory));
        
        // Load dictionary data from generated file
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/generated/fix44-dictionary.hex");
        bytes memory dictionaryData = vm.parseBytes(vm.readFile(path));
        
        console.log("Dictionary data size:", dictionaryData.length);
        
        // Deploy dictionary via factory
        address dictionary = factory.deployDictionary(dictionaryData, 4, 4);
        console.log("FIX 4.4 Dictionary deployed at:", dictionary);
        
        vm.stopBroadcast();
        
        // Verify deployment
        FixDictionary dict = FixDictionary(dictionary);
        
        // Test some known tags
        console.log("\nVerifying deployment:");
        console.log("Tag 15 (Currency):", dict.getTagName(15));
        console.log("Tag 55 (Symbol):", dict.getTagName(55));
        console.log("Tag 167 (SecurityType):", dict.getTagName(167));
        console.log("Tag 448 (PartyID):", dict.getTagName(448));
        console.log("Tag 541 (MaturityDate):", dict.getTagName(541));
    }
}

