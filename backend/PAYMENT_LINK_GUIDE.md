# Payment Link Example

After registration/login, agents and sub-agents receive a unique payment link:

```
http://localhost:3000/buy/h7ban7jw2006zyosdt4sezo0
```

## API Endpoints

### 1. Get Seller Info (Public)

```bash
GET /api/orders/link/:code
```

Example:

```bash
curl http://localhost:3000/api/orders/link/h7ban7jw2006zyosdt4sezo0
```

Response:

```json
{
  "success": true,
  "data": {
    "seller": {
      "id": "...",
      "name": "Test Agent",
      "phone": "0241234567",
      "role": "agent",
      "code": "h7ban7jw2006zyosdt4sezo0"
    }
  }
}
```

### 2. Get Bundles with Seller's Pricing (Public)

```bash
GET /api/orders/link/:code/bundles
```

Example:

```bash
curl http://localhost:3000/api/orders/link/h7ban7jw2006zyosdt4sezo0/bundles
```

Response:

```json
{
  "success": true,
  "data": {
    "seller": {
      "name": "Test Agent",
      "phone": "0241234567",
      "code": "h7ban7jw2006zyosdt4sezo0"
    },
    "bundles": {
      "MTN": [
        {
          "id": "bundle-id-1",
          "network": "MTN",
          "volume": "1GB",
          "price": "5.50",
          "isActive": true
        },
        {
          "id": "bundle-id-2",
          "network": "MTN",
          "volume": "2GB",
          "price": "10.00",
          "isActive": true
        }
      ],
      "VODAFONE": [
        {
          "id": "bundle-id-3",
          "network": "VODAFONE",
          "volume": "1GB",
          "price": "5.75",
          "isActive": true
        }
      ],
      "AIRTELTIGO": [
        {
          "id": "bundle-id-4",
          "network": "AIRTELTIGO",
          "volume": "1GB",
          "price": "5.00",
          "isActive": true
        }
      ]
    },
    "totalBundles": 4
  }
}
```

### 3. Create Order from Payment Link (Public)

```bash
POST /api/orders/link/:code/purchase
```

Example:

```bash
curl -X POST http://localhost:3000/api/orders/link/h7ban7jw2006zyosdt4sezo0/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "0501234567",
    "customerName": "John Doe",
    "bundleId": "bundle-id-1"
  }'
```

Response:

```json
{
  "success": true,
  "message": "Order created successfully. Please proceed with payment.",
  "data": {
    "order": {
      "id": "order-id",
      "customerPhone": "0501234567",
      "customerName": "John Doe",
      "bundleId": "bundle-id-1",
      "sellerId": "agent-id",
      "sellerType": "agent",
      "pricePaid": "5.50",
      "status": "pending",
      "createdAt": "2026-01-29T...",
      "bundle": {
        "network": "MTN",
        "volume": "1GB"
      },
      "seller": {
        "name": "Test Agent",
        "phone": "0241234567"
      }
    }
  }
}
```

## Flow

1. **Agent/Sub-agent Registration**
   - User registers and gets a unique payment link code
   - Payment link returned: `http://localhost:3000/buy/{code}`

2. **Customer Opens Link**
   - Customer visits payment link
   - Sees bundles grouped by network (MTN, VODAFONE, AIRTELTIGO)
   - Prices shown are the specific prices set by that agent/sub-agent

3. **Customer Selects Bundle**
   - Customer enters phone number and name
   - Selects desired bundle
   - Creates order with status "pending"

4. **Payment**
   - Customer proceeds to payment gateway
   - Upon confirmation, order status changes to "payment_confirmed"
   - Only then is Hubnet order placed

## Example User Codes

- Test Agent: `h7ban7jw2006zyosdt4sezo0`
- Test Sub-Agent: `yv7rj2ge8drn4lvyzpmmpdnp`
