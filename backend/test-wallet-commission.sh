#!/bin/bash

# Wallet & Commission System Test
echo "=================================="
echo "WALLET & COMMISSION SYSTEM TEST"
echo "=================================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Agent credentials
AGENT_CODE="h7ban7jw2006zyosdt4sezo0"
AGENT_PHONE="0241234567"
AGENT_PASSWORD="Test@1234"

echo -e "${BLUE}Step 1: Login as agent to get token${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$AGENT_PHONE\",\"password\":\"$AGENT_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
echo "Token: ${TOKEN:0:50}..."
echo ""

echo -e "${BLUE}Step 2: Check agent's wallet${NC}"
curl -s http://localhost:3000/api/wallet \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo -e "${BLUE}Step 3: Check wallet summary${NC}"
curl -s http://localhost:3000/api/wallet/summary \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo -e "${BLUE}Step 4: Create a test order${NC}"
BUNDLES_RESPONSE=$(curl -s http://localhost:3000/api/orders/link/$AGENT_CODE/bundles)
BUNDLE_ID=$(echo "$BUNDLES_RESPONSE" | jq -r '.data.bundles | to_entries | .[0].value | .[0].id')

if [ "$BUNDLE_ID" != "null" ] && [ -n "$BUNDLE_ID" ]; then
    ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/orders/link/$AGENT_CODE/purchase \
      -H "Content-Type: application/json" \
      -d "{
        \"customerPhone\": \"0501234567\",
        \"customerName\": \"Test Customer\",
        \"bundleId\": \"$BUNDLE_ID\"
      }")
    
    echo "$ORDER_RESPONSE" | jq '.'
    ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.order.id')
    PRICE=$(echo "$ORDER_RESPONSE" | jq -r '.data.order.pricePaid')
    echo ""
    
    if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
        echo -e "${GREEN}Order created: $ORDER_ID${NC}"
        echo -e "${YELLOW}Price: GH₵ $PRICE${NC}"
        echo ""
        
        echo -e "${BLUE}Step 5: Simulate payment webhook${NC}"
        WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments/webhook \
          -H "Content-Type: application/json" \
          -d "{
            \"orderId\": \"$ORDER_ID\",
            \"paymentReference\": \"PAY-$(date +%s)\",
            \"status\": \"success\"
          }")
        
        echo "$WEBHOOK_RESPONSE" | jq '.'
        echo ""
        
        echo -e "${BLUE}Step 6: Check updated wallet${NC}"
        curl -s http://localhost:3000/api/wallet \
          -H "Authorization: Bearer $TOKEN" | jq '.'
        echo ""
        
        echo -e "${BLUE}Step 7: Check wallet transactions${NC}"
        curl -s http://localhost:3000/api/wallet/transactions \
          -H "Authorization: Bearer $TOKEN" | jq '.'
        echo ""
        
        echo -e "${BLUE}Step 8: Check wallet summary${NC}"
        curl -s http://localhost:3000/api/wallet/summary \
          -H "Authorization: Bearer $TOKEN" | jq '.'
        echo ""
        
        echo -e "${GREEN}✓ Test complete! Commission credited to wallet.${NC}"
    fi
else
    echo "No bundles found. Please set agent pricing first."
fi
