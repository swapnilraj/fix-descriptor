#!/bin/bash

# Generate Standard JSON for Contract Verification
# This script generates the Solidity standard JSON input for Etherscan verification
# Run this script after modifying AssetTokenERC20.sol
# Includes smart caching to skip regeneration when contracts haven't changed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
OUTPUT_FILE="$PROJECT_ROOT/apps/web/lib/AssetTokenERC20-standard-json.json"
CACHE_FILE="$PROJECT_ROOT/.verification-json-cache"

# Function to calculate hash of contract files
calculate_contract_hash() {
  cd "$CONTRACTS_DIR"
  # Hash all Solidity files in src/ and foundry.toml
  find src -name "*.sol" -type f -exec cat {} \; | cat - foundry.toml | shasum -a 256 | cut -d' ' -f1
}

# Check if output file exists
if [ ! -f "$OUTPUT_FILE" ]; then
  echo "📝 Standard JSON file doesn't exist, will generate..."
  FORCE_REGENERATE=true
else
  FORCE_REGENERATE=false
fi

# Calculate current hash
CURRENT_HASH=$(calculate_contract_hash)

# Check if we need to regenerate
NEEDS_REGENERATION=false

if [ "$FORCE_REGENERATE" = true ]; then
  NEEDS_REGENERATION=true
elif [ -f "$CACHE_FILE" ]; then
  CACHED_HASH=$(cat "$CACHE_FILE" 2>/dev/null || echo "")
  if [ "$CURRENT_HASH" != "$CACHED_HASH" ]; then
    echo "📝 Contract files have changed, will regenerate standard JSON..."
    NEEDS_REGENERATION=true
  else
    echo "✅ Contract verification JSON is up to date (no changes detected)"
    echo "   Skipping regeneration to save time"
    exit 0
  fi
else
  echo "📝 No cache found, will generate standard JSON..."
  NEEDS_REGENERATION=true
fi

if [ "$NEEDS_REGENERATION" = true ]; then
  echo "🔨 Generating standard JSON for AssetTokenERC20..."
  
  # Change to contracts directory
  cd "$CONTRACTS_DIR"
  
  # Build contracts first
  echo "📦 Building contracts..."
  forge build --force > /dev/null 2>&1
  
  # Generate standard JSON input
  # Using a dummy address since we only need the source structure
  echo "📝 Generating standard JSON input..."
  forge verify-contract \
    --show-standard-json-input \
    0x0000000000000000000000000000000000000000 \
    src/AssetTokenERC20.sol:AssetTokenERC20 \
    2>/dev/null | jq '.' > "$OUTPUT_FILE"
  
  if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(wc -c < "$OUTPUT_FILE" | tr -d ' ')
    echo "✅ Standard JSON generated successfully!"
    echo "   Output: $OUTPUT_FILE"
    echo "   Size: $FILE_SIZE bytes"
    
    # Save the hash to cache
    echo "$CURRENT_HASH" > "$CACHE_FILE"
    echo "   Cache updated: $CACHE_FILE"
    
    echo ""
    echo "💡 Don't forget to commit these files:"
    echo "   git add $OUTPUT_FILE $CACHE_FILE"
    echo "   git commit -m \"Update contract verification JSON\""
  else
    echo "❌ Failed to generate standard JSON"
    exit 1
  fi
fi


