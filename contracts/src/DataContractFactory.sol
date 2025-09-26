// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DataContractFactory {
    event DataDeployed(address indexed ptr, uint256 length);

    function deploy(bytes calldata data) external returns (address ptr) {
        // runtime code: 0x00 (STOP) || data
        bytes memory runtime = bytes.concat(bytes1(0x00), data);
        // minimal init code to return the runtime
        // create contract with provided runtime code
        assembly {
            ptr := create(0, add(runtime, 0x20), mload(runtime))
        }
        require(ptr != address(0), "DEPLOY_FAIL");
        emit DataDeployed(ptr, data.length);
    }
}


