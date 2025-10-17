#!/bin/bash

# Generate Standard JSON for Contract Verification
# This script generates the Solidity standard JSON input for Etherscan verification
# Run this script after modifying AssetTokenERC20.sol

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
OUTPUT_FILE="$PROJECT_ROOT/apps/web/lib/AssetTokenERC20-standard-json.json"

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
  echo ""
  echo "💡 Don't forget to commit this file:"
  echo "   git add $OUTPUT_FILE"
  echo "   git commit -m \"Update contract verification JSON\""
else
  echo "❌ Failed to generate standard JSON"
  exit 1
fi

