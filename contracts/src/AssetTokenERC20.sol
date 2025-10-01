// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./IFixDescriptor.sol";
import "./FixMerkleVerifier.sol";

/**
 * @title AssetTokenERC20
 * @notice Example ERC20 token with embedded FIX descriptor
 * @dev Demonstrates how to integrate FixDescriptor into an ERC20 token
 */
contract AssetTokenERC20 is ERC20, Ownable, ERC165, IFixDescriptor {

    /// @notice The FIX descriptor for this asset
    FixDescriptor private _descriptor;

    /// @notice Whether the descriptor has been initialized
    bool private _descriptorInitialized;

    /// @dev ERC165 interface ID for IFixDescriptor
    bytes4 private constant IFIX_DESCRIPTOR_INTERFACE_ID = 
        type(IFixDescriptor).interfaceId;

    /**
     * @notice Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply
     * @param initialOwner Address to receive initial supply and ownership
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);
    }

    /**
     * @notice Set the FIX descriptor for this asset
     * @dev Can only be called by owner. Emits appropriate event.
     * @param descriptor The complete FixDescriptor struct
     */
    function setFixDescriptor(FixDescriptor calldata descriptor) external onlyOwner {
        bytes32 oldRoot = _descriptor.fixRoot;
        _descriptor = descriptor;

        if (_descriptorInitialized) {
            emit FixDescriptorUpdated(oldRoot, descriptor.fixRoot, descriptor.fixCBORPtr);
        } else {
            emit FixDescriptorSet(
                descriptor.fixRoot,
                descriptor.dictHash,
                descriptor.fixCBORPtr,
                descriptor.fixCBORLen
            );
            _descriptorInitialized = true;
        }
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function getFixDescriptor() external view override returns (FixDescriptor memory) {
        require(_descriptorInitialized, "Descriptor not initialized");
        return _descriptor;
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function getFixRoot() external view override returns (bytes32) {
        require(_descriptorInitialized, "Descriptor not initialized");
        return _descriptor.fixRoot;
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function verifyField(
        bytes calldata pathCBOR,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) external view override returns (bool) {
        require(_descriptorInitialized, "Descriptor not initialized");
        return FixMerkleVerifier.verify(_descriptor.fixRoot, pathCBOR, value, proof, directions);
    }

    /**
     * @notice Get CBOR data chunk
     * @param start Start offset (in the data, not including STOP byte)
     * @param size Number of bytes to read
     * @return chunk The requested CBOR data
     */
    function getFixCBORChunk(uint256 start, uint256 size)
        external
        view
        returns (bytes memory chunk)
    {
        require(_descriptorInitialized, "Descriptor not initialized");
        require(_descriptor.fixCBORPtr != address(0), "CBOR not deployed");

        address ptr = _descriptor.fixCBORPtr;

        // Get code size using extcodesize
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(ptr)
        }

        require(codeSize > 0, "No CBOR data");

        // Data starts at byte 1 (after STOP byte at position 0)
        // Data length is codeSize - 1
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
            extcodecopy(ptr, add(chunk, 0x20), add(start, 1), actualSize)
        }
    }

    /**
     * @inheritdoc ERC165
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override(ERC165) 
        returns (bool) 
    {
        return interfaceId == IFIX_DESCRIPTOR_INTERFACE_ID || 
               super.supportsInterface(interfaceId);
    }
}
