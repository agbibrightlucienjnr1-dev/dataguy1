#!/bin/bash

# Payment Link Flow Test Script
# This demonstrates the complete customer purchase flow using payment links

echo "=================================="
echo "PAYMENT LINK FLOW TEST"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Agent payment code (from login response)
AGENT_CODE="h7ban7jw2006zyosdt4sezo0"

echo -e "${BLUE}Step 1: Customer opens agent's payment link${NC}"
echo "URL: http://localhost:3000/buy/$AGENT_CODE"
echo ""

echo -e "${BLUE}Step 2: Get seller information${NC}"
curl -s http://localhost:3000/api/orders/link/$AGENT_CODE | jq '.'
echo ""

echo -e "${BLUE}Step 3: Get available bundles with agent's pricing${NC}"
BUNDLES_RESPONSE=$(curl -s http://localhost:3000/api/orders/link/$AGENT_CODE/bundles)
echo "$BUNDLES_RESPONSE" | jq '.'
echo ""

# Extract first bundle ID from the response
BUNDLE_ID=$(echo "$BUNDLES_RESPONSE" | jq -r '.data.bundles | to_entries | .[0].value | .[0].id')

if [ "$BUNDLE_ID" != "null" ] && [ -n "$BUNDLE_ID" ]; then
    echo -e "${GREEN}Found bundle: $BUNDLE_ID${NC}"
    echo ""

    echo -e "${BLUE}Step 4: Customer creates order (no account needed)${NC}"
    ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/orders/link/$AGENT_CODE/purchase \
      -H "Content-Type: application/json" \
      -d "{
        \"customerPhone\": \"0501234567\",
        \"customerName\": \"John Doe\",
        \"bundleId\": \"$BUNDLE_ID\"
      }")
    
    echo "$ORDER_RESPONSE" | jq '.'
    echo ""

    ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.order.id')
    
    if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
        echo -e "${GREEN}Order created successfully!${NC}"
        echo -e "${GREEN}Order ID: $ORDER_ID${NC}"
        echo ""
        
        echo -e "${BLUE}Step 5: Customer can track order${NC}"
        curl -s http://localhost:3000/api/orders/$ORDER_ID | jq '.'
        echo ""
        
        echo -e "${GREEN}✓ Complete! Customer would now proceed to payment.${NC}"
        echo -e "${GREEN}✓ Once payment is confirmed, Hubnet order will be placed.${NC}"
    else
        echo "Failed to create order"
    fi
else
    echo "No bundles found. Agent needs to set pricing first."
fi
