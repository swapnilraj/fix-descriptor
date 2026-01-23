// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AssetTokenERC20.sol";
import "./DataContractFactory.sol";
import "./IFixDescriptor.sol";

/**
 * @title AssetTokenFactory
 * @notice Factory contract for deploying AssetTokenERC20 contracts with embedded FIX descriptors
 * @dev Simplifies the deployment process by handling token creation, SBE deployment, and descriptor setup
 */
contract AssetTokenFactory {
    /// @notice Data contract factory for SBE storage
    DataContractFactory public immutable dataFactory;

    /// @notice Array of all deployed asset tokens
    address[] public deployedTokens;

    /// @notice Mapping from deployer address to their deployed tokens
    mapping(address => address[]) public tokensByDeployer;

    /// @notice Emitted when a new asset token is deployed
    event AssetTokenDeployed(
        address indexed tokenAddress,
        address indexed deployer,
        string name,
        string symbol,
        uint256 initialSupply
    );

    /// @notice Emitted when a descriptor is set on a token
    event DescriptorSet(
        address indexed tokenAddress,
        bytes32 indexed fixRoot,
        address fixSBEPtr
    );

    /**
     * @notice Constructor
     * @param _dataFactory Address of the DataContractFactory
     */
    constructor(address _dataFactory) {
        require(_dataFactory != address(0), "Invalid factory address");
        dataFactory = DataContractFactory(_dataFactory);
    }

    /**
     * @notice Deploy a new AssetTokenERC20 contract
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply
     * @return tokenAddress Address of the deployed token
     */
    function deployAssetToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external returns (address tokenAddress) {
        // Deploy the token contract with msg.sender as initial owner
        AssetTokenERC20 token = new AssetTokenERC20(name, symbol, initialSupply, msg.sender);
        tokenAddress = address(token);

        // Record deployment
        deployedTokens.push(tokenAddress);
        tokensByDeployer[msg.sender].push(tokenAddress);

        emit AssetTokenDeployed(tokenAddress, msg.sender, name, symbol, initialSupply);
    }

    /**
     * @notice Deploy token and set its FIX descriptor in one transaction
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply
     * @param sbeData SBE-encoded descriptor data
     * @param descriptor The complete FixDescriptor struct
     * @return tokenAddress Address of the deployed token
     * @return sbePtr Address of the deployed SBE data contract
     */
    function deployWithDescriptor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        bytes memory sbeData,
        IFixDescriptor.FixDescriptor memory descriptor
    ) external returns (address tokenAddress, address sbePtr) {
        // Deploy SBE data first
        sbePtr = dataFactory.deploy(sbeData);

        // Ensure SSTORE2 payload is present and matches expected length
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(sbePtr)
        }
        require(codeSize == sbeData.length + 1, "SBE_INVALID_SIZE");

        // Update descriptor with the deployed SBE pointer
        descriptor.fixSBEPtr = sbePtr;
        descriptor.fixSBELen = uint32(sbeData.length);

        // Deploy the token contract with factory as temporary owner (to set descriptor)
        AssetTokenERC20 token = new AssetTokenERC20(name, symbol, initialSupply, address(this));
        tokenAddress = address(token);

        // Set the descriptor (we own the token at this point)
        token.setFixDescriptor(descriptor);

        // Transfer ownership and tokens to the caller
        token.transferOwnership(msg.sender);
        token.transfer(msg.sender, initialSupply);

        // Record deployment
        deployedTokens.push(tokenAddress);
        tokensByDeployer[msg.sender].push(tokenAddress);

        emit AssetTokenDeployed(tokenAddress, msg.sender, name, symbol, initialSupply);
        emit DescriptorSet(tokenAddress, descriptor.fixRoot, sbePtr);
    }

    /**
     * @notice Get total number of deployed tokens
     * @return count Number of tokens deployed through this factory
     */
    function getDeployedTokensCount() external view returns (uint256 count) {
        return deployedTokens.length;
    }

    /**
     * @notice Get all tokens deployed by a specific address
     * @param deployer Address of the deployer
     * @return tokens Array of token addresses
     */
    function getTokensByDeployer(address deployer) external view returns (address[] memory tokens) {
        return tokensByDeployer[deployer];
    }

    /**
     * @notice Get a paginated list of all deployed tokens
     * @param offset Starting index
     * @param limit Maximum number of tokens to return
     * @return tokens Array of token addresses
     * @return total Total number of deployed tokens
     */
    function getDeployedTokens(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory tokens, uint256 total) 
    {
        total = deployedTokens.length;
        
        if (offset >= total) {
            return (new address[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        tokens = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            tokens[i] = deployedTokens[offset + i];
        }
    }

    /**
     * @notice Check if a token was deployed by this factory
     * @param token Address to check
     * @return deployed True if the token was deployed by this factory
     */
    function isFactoryToken(address token) external view returns (bool deployed) {
        for (uint256 i = 0; i < deployedTokens.length; i++) {
            if (deployedTokens[i] == token) {
                return true;
            }
        }
        return false;
    }
}
