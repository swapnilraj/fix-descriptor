// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {DataContractFactory} from "../src/DataContractFactory.sol";
import {DescriptorRegistry} from "../src/DescriptorRegistry.sol";
import {FixMerkleVerifier} from "../src/FixMerkleVerifier.sol";

contract DeployAndTest is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy core contracts
        DataContractFactory factory = new DataContractFactory();
        DescriptorRegistry registry = new DescriptorRegistry();
        
        console.log("=== Core Contracts Deployed ===");
        console.log("DataContractFactory:", address(factory));
        console.log("DescriptorRegistry:", address(registry));
        console.log("FixMerkleVerifier: Library (no deployment needed)");
        
        // 2. Deploy example CBOR data
        bytes memory exampleCBOR = hex"a815a163555354422d323033302d31312d31350a48a1635553393132383243455a37360a22a161340a167a164544f4e440a461a16444425445460a541a16332303330313131350a223a1633423235300a15a1635553440a454a182455a163393132383243455a370a456a161310a455a1635553393132383243455a37360a456a161340a453a182448a16355535f54524541535552590a447a161440a452a161310a448a163435553544f4449414e5f42414e4b5f4142430a447a161440a452a161318";
        
        address dataContract = factory.deploy(exampleCBOR);
        console.log("\n=== CBOR Data Deployed ===");
        console.log("CBOR Data Contract:", dataContract);
        console.log("CBOR Data Length:", exampleCBOR.length);
        
        // 3. Register a descriptor in the registry
        bytes32 assetId = keccak256("TEST_ASSET_001");
        DescriptorRegistry.FixDescriptor memory descriptor = DescriptorRegistry.FixDescriptor({
            fixMajor: 4,
            fixMinor: 4,
            dictHash: keccak256("FIX_DICT_V1"),
            fixRoot: keccak256("EXAMPLE_MERKLE_ROOT"),
            fixCBORPtr: dataContract,
            fixCBORLen: uint32(exampleCBOR.length),
            fixURI: "https://example.com/descriptor"
        });
        
        registry.setDescriptor(assetId, descriptor);
        console.log("\n=== Descriptor Registered ===");
        console.log("Asset ID:", vm.toString(assetId));
        console.log("Descriptor registered successfully");
        
        vm.stopBroadcast();
        
        // 4. Output all environment variables
        console.log("\n=== Complete Environment Variables ===");
        console.log("NEXT_PUBLIC_FACTORY_ADDRESS=%s", address(factory));
        console.log("NEXT_PUBLIC_REGISTRY_ADDRESS=%s", address(registry));
        console.log("NEXT_PUBLIC_VERIFIER_ADDRESS=0x0000000000000000000000000000000000000000");
        console.log("NEXT_PUBLIC_LAST_DEPLOYED_PTR=%s", dataContract);
        console.log("\nCopy these to your apps/web/.env.local file");
    }
}
