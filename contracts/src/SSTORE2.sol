// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SSTORE2
/// @notice Library for storing and reading data using contract bytecode (SSTORE2 pattern)
/// @dev Stores data by deploying a contract with the data as bytecode, prefixed with STOP (0x00)
library SSTORE2 {

    /**
     * @notice Deploy data using SSTORE2 pattern
     * @param data The data to store
     * @return pointer The address of the deployed contract containing the data
     */
    function write(bytes memory data) internal returns (address pointer) {
        // SSTORE2 pattern: deploy a contract where the bytecode is STOP (0x00) + data
        // The contract's code will be the data itself, retrievable via EXTCODECOPY

        bytes memory runtimeCode = abi.encodePacked(hex"00", data);
        bytes memory initCode = abi.encodePacked(
            // Deploy code that returns runtimeCode
            hex"63",                      // PUSH4
            uint32(runtimeCode.length),   // size of runtime code
            hex"80600e6000396000f3",      // DUP1, PUSH1 0x0e, PUSH1 0x00, CODECOPY, PUSH1 0x00, RETURN
            runtimeCode                   // The actual runtime code (STOP + data)
        );

        assembly {
            pointer := create(0, add(initCode, 0x20), mload(initCode))
        }

        require(pointer != address(0), "SSTORE2: deployment failed");
    }

    /**
     * @notice Read all data from an SSTORE2 pointer
     * @param pointer The address of the SSTORE2 contract
     * @return data The complete data stored at the pointer
     */
    function read(address pointer) internal view returns (bytes memory data) {
        require(pointer != address(0), "SSTORE2: invalid pointer");

        // Get code size using extcodesize
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(pointer)
        }

        require(codeSize > 0, "SSTORE2: no data");

        // Data length is codeSize - 1 (excluding STOP byte)
        uint256 dataLength = codeSize - 1;

        // Use extcodecopy to read directly from contract bytecode
        // Skip first byte (STOP opcode at position 0)
        data = new bytes(dataLength);
        assembly {
            extcodecopy(pointer, add(data, 0x20), 1, dataLength)
        }
    }

    /**
     * @notice Read a chunk of data from an SSTORE2 pointer
     * @param pointer The address of the SSTORE2 contract
     * @param start Start offset (in the data, not including STOP byte)
     * @param size Number of bytes to read
     * @return chunk The requested data chunk
     */
    function read(address pointer, uint256 start, uint256 size)
        internal
        view
        returns (bytes memory chunk)
    {
        require(pointer != address(0), "SSTORE2: invalid pointer");

        // Get code size using extcodesize
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(pointer)
        }

        require(codeSize > 0, "SSTORE2: no data");

        // Data starts at byte 1 (after STOP byte at position 0)
        uint256 dataLength = codeSize - 1;

        // Validate and adjust range
        if (start >= dataLength) {
            return new bytes(0);
        }

        uint256 end = start + size;
        if (end > dataLength) {
            end = dataLength;
        }

        uint256 actualSize = end - start;

        // Use extcodecopy to read directly from contract bytecode
        // Add 1 to start to skip the STOP byte (data begins at position 1)
        chunk = new bytes(actualSize);
        assembly {
            extcodecopy(pointer, add(chunk, 0x20), add(start, 1), actualSize)
        }
    }
}
