// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DataContractFactory
 * @notice Factory for deploying SSTORE2-style data contracts
 * @dev Uses the same pattern as 0xSequence's SSTORE2 library
 */
contract DataContractFactory {
    event DataDeployed(address indexed ptr, uint256 length);

    /**
     * @notice Deploy data to a contract using SSTORE2 pattern
     * @param data The data to store
     * @return ptr Address of the deployed data contract
     */
    function deploy(bytes calldata data) external returns (address ptr) {
        // Prepend STOP opcode (0x00) to prevent calls to the contract
        bytes memory runtimeCode = abi.encodePacked(hex"00", data);

        // Create initialization code that returns the runtime code
        // Pattern from 0xSequence SSTORE2:
        // 0x63 - PUSH4 (size)
        // size - runtime code size (4 bytes)
        // 0x80 - DUP1
        // 0x60 0x0E - PUSH1 14 (offset where runtime code starts)
        // 0x60 0x00 - PUSH1 0 (memory destination)
        // 0x39 - CODECOPY
        // 0x60 0x00 - PUSH1 0 (offset in memory to return from)
        // 0xF3 - RETURN
        bytes memory creationCode = abi.encodePacked(
            hex"63",
            uint32(runtimeCode.length),
            hex"80_60_0E_60_00_39_60_00_F3",
            runtimeCode
        );

        assembly {
            ptr := create(0, add(creationCode, 0x20), mload(creationCode))
        }

        require(ptr != address(0), "DEPLOY_FAIL");
        emit DataDeployed(ptr, data.length);
    }
}


