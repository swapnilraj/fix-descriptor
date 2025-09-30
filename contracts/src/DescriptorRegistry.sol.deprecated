// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DescriptorRegistry {
    struct FixDescriptor {
        uint16 fixMajor;
        uint16 fixMinor;
        bytes32 dictHash;
        bytes32 fixRoot;
        address fixCBORPtr;
        uint32 fixCBORLen;
        string fixURI;
    }

    address public owner;
    mapping(bytes32 => FixDescriptor) private descriptors;

    event AssetFIXCommitted(bytes32 indexed id, bytes32 fixRoot, bytes32 dictHash, address fixCBORPtr, uint32 fixCBORLen);
    event AssetFIXUpdated(bytes32 indexed id, bytes32 oldRoot, bytes32 newRoot, address newPtr);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setDescriptor(bytes32 assetId, FixDescriptor calldata d) external onlyOwner {
        bytes32 oldRoot = descriptors[assetId].fixRoot;
        descriptors[assetId] = d;
        if (oldRoot == bytes32(0)) {
            emit AssetFIXCommitted(assetId, d.fixRoot, d.dictHash, d.fixCBORPtr, d.fixCBORLen);
        } else {
            emit AssetFIXUpdated(assetId, oldRoot, d.fixRoot, d.fixCBORPtr);
        }
    }

    function getDescriptor(bytes32 assetId) external view returns (FixDescriptor memory) {
        return descriptors[assetId];
    }

    function fixCBORChunk(bytes32 assetId, uint256 start, uint256 size) external view returns (bytes memory out) {
        FixDescriptor memory d = descriptors[assetId];
        require(d.fixCBORPtr != address(0), "NO_DATA");
        require(start + size <= uint256(d.fixCBORLen), "OOB");
        out = new bytes(size);
        // skip first byte (STOP) in runtime code
        address ptr = d.fixCBORPtr;
        uint256 offs = start + 1;
        assembly {
            extcodecopy(ptr, add(out, 0x20), offs, size)
        }
    }
}


