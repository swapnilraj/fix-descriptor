// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./IFixDescriptor.sol";
import "./FixMerkleVerifier.sol";

/**
 * @title AssetTokenERC721
 * @notice Example ERC721 NFT with embedded FIX descriptor
 * @dev Demonstrates how to integrate FixDescriptor into an ERC721 token
 * This example uses a single descriptor for the entire collection.
 * For per-token descriptors, use mapping(uint256 => FixDescriptor)
 */
contract AssetTokenERC721 is ERC721, Ownable, IFixDescriptor {

    /// @notice The FIX descriptor for this collection
    FixDescriptor private _collectionDescriptor;

    /// @notice Whether the descriptor has been initialized
    bool private _descriptorInitialized;

    /// @notice Next token ID to mint
    uint256 private _nextTokenId;

    /// @dev ERC165 interface ID for IFixDescriptor
    bytes4 private constant IFIX_DESCRIPTOR_INTERFACE_ID = 
        type(IFixDescriptor).interfaceId;

    /**
     * @notice Constructor
     * @param name Token name
     * @param symbol Token symbol
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {}

    /**
     * @notice Mint a new token
     * @param to Address to mint to
     * @return tokenId The minted token ID
     */
    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    /**
     * @notice Set the FIX descriptor for this collection
     * @dev Can only be called by owner. Emits appropriate event.
     * @param descriptor The complete FixDescriptor struct
     */
    function setFixDescriptor(FixDescriptor calldata descriptor) external onlyOwner {
        bytes32 oldRoot = _collectionDescriptor.fixRoot;
        _collectionDescriptor = descriptor;

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
        return _collectionDescriptor;
    }

    /**
     * @inheritdoc IFixDescriptor
     */
    function getFixRoot() external view override returns (bytes32) {
        require(_descriptorInitialized, "Descriptor not initialized");
        return _collectionDescriptor.fixRoot;
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
        return FixMerkleVerifier.verify(_collectionDescriptor.fixRoot, pathCBOR, value, proof, directions);
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
        require(_collectionDescriptor.fixCBORPtr != address(0), "CBOR not deployed");

        address ptr = _collectionDescriptor.fixCBORPtr;

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
        override(ERC721) 
        returns (bool) 
    {
        return interfaceId == IFIX_DESCRIPTOR_INTERFACE_ID || 
               super.supportsInterface(interfaceId);
    }
}
