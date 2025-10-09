// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title FixDictionary
/// @notice Immutable on-chain dictionary mapping FIX tag numbers to tag names
/// @dev Uses SSTORE2 pattern with fixed 24-byte slots for O(1) lookups
contract FixDictionary {
    /// @notice SSTORE2 pointer to dictionary data
    address public immutable dataContract;

    /// @notice Maximum tag number supported (FIX 4.4 has tags 1-957)
    uint16 public constant MAX_TAG = 957;

    /// @notice Size of each dictionary slot in bytes
    uint8 public constant SLOT_SIZE = 24;

    error TagOutOfRange(uint16 tag);
    error InvalidDataContract();

    /// @notice Constructor deploys dictionary data as SSTORE2 contract
    /// @param data Fixed-length dictionary data ((MAX_TAG + 1) * SLOT_SIZE bytes, includes slot 0)
    constructor(bytes memory data) {
        require(data.length == (MAX_TAG + 1) * SLOT_SIZE, "Invalid data length");
        
        // Deploy as SSTORE2 contract
        // Create init code: PUSH data.length PUSH 0 PUSH 0 CODECOPY PUSH data.length PUSH 0 RETURN
        // Then append the data
        bytes memory initCode = abi.encodePacked(
            // Copy data to memory starting at 0
            hex"63", // PUSH4
            uint32(data.length + 1), // data length + STOP byte
            hex"80600E6000396000F300", // DUP1 PUSH1 0x0E PUSH1 0 CODECOPY PUSH1 0 RETURN STOP
            data
        );
        
        address pointer;
        assembly {
            pointer := create(0, add(initCode, 0x20), mload(initCode))
        }
        
        require(pointer != address(0), "Deployment failed");
        dataContract = pointer;
    }

    /// @notice Get tag name for a single tag
    /// @param tag FIX tag number (1-957)
    /// @return name Tag name string (empty if tag not defined)
    function getTagName(uint16 tag) public view returns (string memory name) {
        if (tag == 0 || tag > MAX_TAG) {
            revert TagOutOfRange(tag);
        }

        // Calculate offset: tag * SLOT_SIZE
        // Add 1 to skip STOP byte in SSTORE2 contract
        uint256 offset = tag * SLOT_SIZE + 1;
        
        // Read 24-byte slot
        bytes memory slot = new bytes(SLOT_SIZE);
        address ptr = dataContract;
        assembly {
            extcodecopy(
                ptr,
                add(slot, 0x20),
                offset,
                mload(slot)
            )
        }

        // First byte is length
        uint8 length = uint8(slot[0]);
        
        // If length is 0, tag is not defined
        if (length == 0) {
            return "";
        }

        // Extract name bytes (skip first byte which is length)
        bytes memory nameBytes = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            nameBytes[i] = slot[i + 1];
        }

        return string(nameBytes);
    }

    /// @notice Get tag names for multiple tags (batch operation)
    /// @param tags Array of FIX tag numbers
    /// @return names Array of tag name strings
    function getTagNames(uint16[] calldata tags) external view returns (string[] memory names) {
        names = new string[](tags.length);
        for (uint256 i = 0; i < tags.length; i++) {
            names[i] = getTagName(tags[i]);
        }
    }

    /// @notice Check if a tag is defined in the dictionary
    /// @param tag FIX tag number
    /// @return True if tag has a name defined
    function hasTag(uint16 tag) external view returns (bool) {
        if (tag == 0 || tag > MAX_TAG) {
            return false;
        }

        uint256 offset = tag * SLOT_SIZE + 1;
        
        // Read just the length byte
        bytes1 lengthByte;
        address ptr = dataContract;
        assembly {
            let tmpPtr := mload(0x40)
            extcodecopy(
                ptr,
                tmpPtr,
                offset,
                1
            )
            lengthByte := mload(tmpPtr)
        }

        return lengthByte != 0x00;
    }

    /// @notice Get raw 24-byte slot data for a tag
    /// @param tag FIX tag number
    /// @return Slot data (for debugging/inspection)
    function getSlot(uint16 tag) external view returns (bytes memory) {
        if (tag == 0 || tag > MAX_TAG) {
            revert TagOutOfRange(tag);
        }

        uint256 offset = tag * SLOT_SIZE + 1;
        bytes memory slot = new bytes(SLOT_SIZE);
        address ptr = dataContract;
        
        assembly {
            extcodecopy(
                ptr,
                add(slot, 0x20),
                offset,
                mload(slot)
            )
        }

        return slot;
    }
}

