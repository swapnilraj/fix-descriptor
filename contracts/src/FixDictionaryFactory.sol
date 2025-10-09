// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FixDictionary.sol";

/// @title FixDictionaryFactory
/// @notice Factory for deploying FixDictionary instances
/// @dev Allows creation of dictionaries for different FIX versions
contract FixDictionaryFactory {
    /// @notice Emitted when a new dictionary is deployed
    event DictionaryDeployed(
        address indexed dictionary,
        uint16 fixMajor,
        uint16 fixMinor,
        bytes32 indexed dataHash,
        address deployer
    );

    /// @notice Registry of deployed dictionaries by version
    /// @dev Mapping: keccak256(abi.encode(fixMajor, fixMinor)) => dictionary address
    mapping(bytes32 => address) public dictionaryByVersion;

    /// @notice Deploy a new FIX dictionary
    /// @param data Fixed-length dictionary data (957 * 24 bytes)
    /// @param fixMajor FIX version major number (e.g., 4)
    /// @param fixMinor FIX version minor number (e.g., 4)
    /// @return dictionary Address of deployed dictionary contract
    function deployDictionary(
        bytes calldata data,
        uint16 fixMajor,
        uint16 fixMinor
    ) external returns (address dictionary) {
        // Deploy new dictionary
        FixDictionary dict = new FixDictionary(data);
        dictionary = address(dict);

        // Calculate version key
        bytes32 versionKey = keccak256(abi.encode(fixMajor, fixMinor));
        
        // Store in registry (allows overwriting if needed)
        dictionaryByVersion[versionKey] = dictionary;

        // Emit event
        bytes32 dataHash = keccak256(data);
        emit DictionaryDeployed(dictionary, fixMajor, fixMinor, dataHash, msg.sender);
    }

    /// @notice Get dictionary address for a FIX version
    /// @param fixMajor FIX version major number
    /// @param fixMinor FIX version minor number
    /// @return dictionary Address of dictionary contract (zero if not deployed)
    function getDictionary(uint16 fixMajor, uint16 fixMinor) external view returns (address dictionary) {
        bytes32 versionKey = keccak256(abi.encode(fixMajor, fixMinor));
        return dictionaryByVersion[versionKey];
    }
}

