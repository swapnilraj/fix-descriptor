# Upgradeable Token Examples

This directory contains example implementations using OpenZeppelin's upgradeable contracts library.

## Prerequisites

These examples require OpenZeppelin's upgradeable contracts library, which is not included by default.

### Installation

```bash
# Install the upgradeable contracts library
forge install OpenZeppelin/openzeppelin-contracts-upgradeable

# Add to your remappings in foundry.toml:
# @openzeppelin/contracts-upgradeable/=lib/openzeppelin-contracts-upgradeable/contracts/
```

## Files

- `AssetTokenERC20Upgradeable.sol.example` - Upgradeable ERC20 token with FIX descriptor (UUPS pattern)
- `AssetTokenERC721Upgradeable.sol.example` - Upgradeable ERC721 token with FIX descriptor (UUPS pattern)

## Usage

To use these examples:

1. Install the upgradeable contracts library (see above)
2. Rename the `.example` files to `.sol`
3. Update import paths if needed (change `../` to `../../` for files that moved up a directory)
4. Compile and deploy

These examples demonstrate how to integrate `FixDescriptorLib` into upgradeable contracts:

1. Use OpenZeppelin's upgradeable contract variants (`ERC20Upgradeable`, etc.)
2. Add `FixDescriptorLib.Storage` as a state variable
3. Forward IFixDescriptor calls to the library
4. Reserve storage gap for future upgrades

See [Integration Guide](../../../contracts/docs/INTEGRATION_GUIDE.md#upgradeable-integration) for detailed instructions.

