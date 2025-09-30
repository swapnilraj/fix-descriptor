# FixDescriptorKit Smart Contracts

> **Solidity contracts for onchain storage and verification of FIX asset descriptors**

A suite of Ethereum smart contracts that enable embedding FIX descriptors directly in token contracts (ERC20, ERC721) with gas-efficient storage (SSTORE2) and cryptographic verification (Merkle proofs).

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue.svg)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built_with-Foundry-red.svg)](https://getfoundry.sh/)
[![OpenZeppelin](https://img.shields.io/badge/Uses-OpenZeppelin-blue.svg)](https://openzeppelin.com/contracts/)

## 🎯 Purpose

These smart contracts implement the onchain component of the FIX Descriptor specification:

- **Embedded Architecture** - Descriptors stored directly in asset contracts (not registries)
- **SSTORE2 Storage** - Gas-efficient CBOR storage in contract bytecode
- **Merkle Verification** - Prove any field without revealing full descriptor
- **Token Integration** - Works with ERC20, ERC721, and custom token standards
- **Standard Interface** - `IFixDescriptor` for interoperability

## 📁 Contract Structure

```
contracts/src/
├── IFixDescriptor.sol              # Standard interface
├── FixMerkleVerifier.sol           # Merkle proof verification library
├── DataContractFactory.sol         # SSTORE2 deployment utility
├── AssetTokenERC20.sol             # Example ERC20 with embedded descriptor
├── AssetTokenERC721.sol            # Example ERC721 with embedded descriptor
└── AssetTokenFactory.sol           # Factory for deploying asset tokens
```

## 🔑 Core Contracts

### `IFixDescriptor.sol`

The standard interface that all asset contracts with FIX descriptors should implement.

```solidity
interface IFixDescriptor {
    struct FixDescriptor {
        uint16 fixMajor;        // FIX version major (e.g., 4)
        uint16 fixMinor;        // FIX version minor (e.g., 4)
        bytes32 dictHash;       // FIX dictionary hash
        bytes32 fixRoot;        // Merkle root commitment
        address fixCBORPtr;     // SSTORE2 address of CBOR data
        uint32 fixCBORLen;      // CBOR byte length
        string fixURI;          // Optional URI for off-chain mirror
    }

    function getFixDescriptor() external view returns (FixDescriptor memory);
    function getFixRoot() external view returns (bytes32);
    function verifyField(
        bytes calldata pathCBOR,
        bytes calldata value,
        bytes32[] calldata proof,
        bool[] calldata directions
    ) external view returns (bool);
    
    event FixDescriptorSet(
        bytes32 indexed fixRoot,
        bytes32 indexed dictHash,
        address fixCBORPtr,
        uint32 fixCBORLen
    );
}
```

### `FixMerkleVerifier.sol`

Library for verifying Merkle proofs. Gas cost: ~30-40k gas (typical depth 4-6).

### `DataContractFactory.sol`

Factory for deploying CBOR data using SSTORE2 pattern (3-4x cheaper than storage slots).

### `AssetTokenERC20.sol` & `AssetTokenERC721.sol`

Example token implementations with embedded FIX descriptors.

### `AssetTokenFactory.sol`

Factory for deploying new asset tokens with descriptors.

## 🚀 Getting Started

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- OpenZeppelin contracts (via git submodules)

### Installation

```bash
cd contracts

# Initialize OpenZeppelin submodules
git submodule update --init --recursive

# Build contracts
forge build

# Run tests
forge test
```

## 📖 Usage Example

```solidity
// Deploy CBOR data via SSTORE2
DataContractFactory dataFactory = new DataContractFactory();
address cborPtr = dataFactory.deployData(cborBytes);

// Create descriptor
IFixDescriptor.FixDescriptor memory descriptor = IFixDescriptor.FixDescriptor({
    fixMajor: 4,
    fixMinor: 4,
    dictHash: keccak256(fixDictionaryBytes),
    fixRoot: merkleRoot,
    fixCBORPtr: cborPtr,
    fixCBORLen: uint32(cborBytes.length),
    fixURI: "ipfs://..."
});

// Deploy token
AssetTokenFactory factory = new AssetTokenFactory();
address token = factory.deployERC20(
    "US Treasury Bond 2030",
    "USTB30",
    1000000 ether,
    descriptor
);
```

## 🚀 Deployment

```bash
# Deploy to Hoodi Testnet
forge script script/DeployAssetToken.s.sol \
  --rpc-url https://ethereum-hoodi-rpc.publicnode.com \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

## 📚 Related Documentation

- **Main Repository**: [FixDescriptorKit](../README.md)
- **Technical Spec**: [SPEC.md](../SPEC.md)
- **TypeScript Library**: [packages/fixdescriptorkit-typescript](../packages/fixdescriptorkit-typescript/README.md)
- **Web App**: [apps/web](../apps/web/README.md)

## 🔧 Foundry Commands

```bash
forge build          # Build contracts
forge test           # Run tests
forge test --gas-report  # Gas report
forge fmt            # Format code
```

## 📄 License

ISC License
