#!/bin/bash

# AssetTokenFactory Deployment Script
# Run this script to deploy the factory contracts

set -e  # Exit on error

echo "🚀 AssetTokenFactory Deployment Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "contracts/.env" ]; then
    echo -e "${RED}❌ Error: contracts/.env not found${NC}"
    echo ""
    echo "Please create contracts/.env with:"
    echo "  PRIVATE_KEY=0x..."
    echo "  NEXT_PUBLIC_RPC_URL=https://..."
    echo ""
    exit 1
fi

echo -e "${BLUE}📝 Step 1: Checking environment...${NC}"
source contracts/.env

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: PRIVATE_KEY not set in contracts/.env${NC}"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_RPC_URL" ]; then
    echo -e "${RED}❌ Error: NEXT_PUBLIC_RPC_URL not set in contracts/.env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Build contracts first
echo -e "${BLUE}📦 Step 2: Building contracts...${NC}"
cd contracts
forge build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contracts built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Deploy contracts
echo -e "${BLUE}🚀 Step 3: Deploying contracts...${NC}"
echo "   Network: $NEXT_PUBLIC_RPC_URL"
echo ""

forge script script/DeployAssetToken.s.sol \
  --rpc-url $NEXT_PUBLIC_RPC_URL \
  --broadcast \
  --slow \
  -vvv | tee ../deployment-output.log

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${BLUE}📋 Step 4: Extracting deployment addresses...${NC}"

# Extract addresses from deployment log
DATA_FACTORY=$(grep "DataContractFactory deployed at:" deployment-output.log | awk '{print $NF}')
TOKEN_FACTORY=$(grep "AssetTokenFactory deployed at:" deployment-output.log | awk '{print $NF}')

if [ -z "$DATA_FACTORY" ] || [ -z "$TOKEN_FACTORY" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically extract addresses${NC}"
    echo "Please check deployment-output.log manually"
    echo ""
    exit 0
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📍 Deployed Contract Addresses:${NC}"
echo ""
echo -e "  DataContractFactory:  ${GREEN}$DATA_FACTORY${NC}"
echo -e "  AssetTokenFactory:    ${GREEN}$TOKEN_FACTORY${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Update or create .env.local
echo -e "${BLUE}📝 Step 5: Updating web app configuration...${NC}"

ENV_FILE="apps/web/.env.local"

# Backup existing .env.local if it exists
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup"
    echo -e "${YELLOW}   Backed up existing .env.local${NC}"
fi

# Update or append the variables
if [ -f "$ENV_FILE" ]; then
    # Remove old values if they exist
    sed -i.tmp '/NEXT_PUBLIC_DATA_FACTORY_ADDRESS/d' "$ENV_FILE"
    sed -i.tmp '/NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS/d' "$ENV_FILE"
    rm "$ENV_FILE.tmp"
fi

# Append new values
echo "NEXT_PUBLIC_DATA_FACTORY_ADDRESS=$DATA_FACTORY" >> "$ENV_FILE"
echo "NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=$TOKEN_FACTORY" >> "$ENV_FILE"

echo -e "${GREEN}✅ Updated $ENV_FILE${NC}"
echo ""

# Final instructions
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Next Steps:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "1. ${BLUE}Verify contracts on block explorer${NC}"
echo -e "   Visit your block explorer and search for the addresses above"
echo ""
echo -e "2. ${BLUE}Start the development server:${NC}"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo -e "3. ${BLUE}Test the factory:${NC}"
echo -e "   - Open http://localhost:3000"
echo -e "   - Connect your wallet"
echo -e "   - Generate a FIX descriptor"
echo -e "   - Click '🚀 Quick Deploy Token'"
echo ""
echo -e "4. ${BLUE}Deploy to production (optional):${NC}"
echo -e "   ${YELLOW}npm run build${NC}"
echo -e "   ${YELLOW}vercel --prod${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📄 Full deployment log saved to: ${YELLOW}deployment-output.log${NC}"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
