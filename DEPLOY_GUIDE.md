# Factory Deployment Guide

## Prerequisites

1. Create a `.env` file in the `contracts/` directory with:
```bash
PRIVATE_KEY=0x... # Your wallet private key
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

2. Ensure your wallet has Sepolia ETH for gas fees

## Step 1: Deploy the Factory

```bash
cd contracts
forge script script/DeployAssetToken.s.sol \
  --rpc-url $NEXT_PUBLIC_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

This will deploy:
- DataContractFactory (for SSTORE2 storage)
- AssetTokenFactory (main factory)
- Example ERC20 token
- Example ERC721 token

## Step 2: Deploy an Asset via Factory

After deployment, you'll get the factory address. Use it to deploy tokens:

### Option A: Using Cast (CLI)

```bash
# Set variables
FACTORY_ADDRESS=0x... # From deployment output
TOKEN_NAME="My Asset Token"
TOKEN_SYMBOL="MAT"
INITIAL_SUPPLY=1000000000000000000000000 # 1M tokens (18 decimals)

# Deploy token
cast send $FACTORY_ADDRESS \
  "deployAssetToken(string,string,uint256)" \
  "$TOKEN_NAME" "$TOKEN_SYMBOL" $INITIAL_SUPPLY \
  --rpc-url $NEXT_PUBLIC_RPC_URL \
  --private-key $PRIVATE_KEY
```

### Option B: Using Forge Script

Create a new script or use the factory's `deployWithDescriptor` function for tokens with FIX descriptors.

## Deployed Contract Addresses

After deployment, save these addresses:
- DataContractFactory: `0x...`
- AssetTokenFactory: `0x...`

## Verify Contracts

If verification fails during deployment, verify manually:

```bash
forge verify-contract \
  --chain sepolia \
  --compiler-version v0.8.20+commit.a1b79de6 \
  --constructor-args $(cast abi-encode "constructor(address)" $DATA_FACTORY_ADDRESS) \
  $FACTORY_ADDRESS \
  src/AssetTokenFactory.sol:AssetTokenFactory
```

