// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {DataContractFactory} from "../src/DataContractFactory.sol";

contract DeployCBORData is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get factory address from environment or use a known address
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        DataContractFactory factory = DataContractFactory(factoryAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Example CBOR data (this would come from your web app)
        bytes memory cborData = hex"a815a163555354422d323033302d31312d31350a48a1635553393132383243455a37360a22a161340a167a164544f4e440a461a16444425445460a541a16332303330313131350a223a1633423235300a15a1635553440a454a182455a163393132383243455a370a456a161310a455a1635553393132383243455a37360a456a161340a453a182448a16355535f54524541535552590a447a161440a452a161310a448a163435553544f4449414e5f42414e4b5f4142430a447a161440a452a161318";
        
        // Deploy CBOR data contract
        address dataContract = factory.deploy(cborData);
        
        console.log("CBOR Data Contract deployed at:", dataContract);
        console.log("CBOR Data length:", cborData.length);
        
        vm.stopBroadcast();
        
        // Output for web app
        console.log("\n=== Environment Variable for Web App ===");
        console.log("NEXT_PUBLIC_LAST_DEPLOYED_PTR=%s", dataContract);
    }
}
