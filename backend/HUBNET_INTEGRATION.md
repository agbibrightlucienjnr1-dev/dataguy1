# Hubnet API Integration Guide

## Overview

This guide covers the Hubnet API integration for delivering mobile data to customers after payment confirmation.

## Features Implemented

- ✅ Balance checking before transactions
- ✅ Data purchase initiation
- ✅ Hubnet transaction tracking
- ✅ Error handling and logging
- ✅ Network mapping (MTN, AirtelTigo)
- ✅ Volume conversion (GB to MB)
- ✅ Phone number validation
- ✅ Order status management

## Setup

### 1. Get Hubnet API Key

1. Visit [Hubnet Console](https://console.hubnet.app)
2. Sign up or log in to your account
3. Navigate to API settings
4. Copy your API key
5. Add it to your `.env` file:

```env
HUBNET_API_KEY=your_actual_hubnet_api_key_here
HUBNET_BASE_URL=https://console.hubnet.app/live/api/context/business/transaction
HUBNET_WEBHOOK_URL=http://localhost:3000/api/hubnet/webhook
```

### 2. Configure Webhook (Optional)

If you want to receive status updates from Hubnet:

1. Set up a webhook endpoint (see below)
2. Add the URL to `HUBNET_WEBHOOK_URL` in `.env`
3. The webhook URL will be sent with each transaction

## API Endpoints

### Check Balance

**GET** `/live/api/context/business/transaction/check_balance`

**Headers:**

```json
{
  "token": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

**Response:**

```json
{
  "status": true,
  "balance": "1500.00",
  "currency": "GHS"
}
```

### Initiate Transaction

**POST** `/live/api/context/business/transaction/{network}-new-transaction`

Where `{network}` can be:

- `mtn` - MTN Ghana
- `big-time` - AirtelTigo

**Headers:**

```json
{
  "token": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

**Request Body:**

```json
{
  "phone": "0241234567",
  "volume": "2000",
  "reference": "ORD-12345",
  "referrer": "0270123456",
  "webhook": "https://yourdomain.com/api/hubnet/webhook"
}
```

**Response:**

```json
{
  "status": true,
  "reason": "Successful",
  "code": "0000",
  "message": "transaction initiated successfully.",
  "transaction_id": "TXN-12345",
  "payment_id": "PSH-12345",
  "ip_address": "192.168.1.1",
  "reference": "ORD-12345",
  "data": {
    "status": true,
    "code": "0000",
    "message": "Order successfully placed."
  }
}
```

## Integration Flow

### After Payment Confirmation

```
1. Payment confirmed (Paystack webhook)
   ↓
2. Commission credited to wallet
   ↓
3. Check Hubnet balance
   ↓
4. Initiate Hubnet transaction
   ↓
5. Store transaction_id and payment_id
   ↓
6. Keep order status as "processing"
   ↓
7. Wait for Hubnet webhook (if configured)
   ↓
8. Update order to "completed" when data is delivered
```

## Network Mapping

Our system uses different network names than Hubnet. The mapping is handled automatically:

| Our System | Hubnet API |
| ---------- | ---------- |
| MTN        | mtn        |
| AIRTELTIGO | big-time   |

## Volume Conversion

Data bundles in our system use human-readable formats (e.g., "1GB", "500MB").
These are automatically converted to megabytes for Hubnet:

| Bundle Volume | Hubnet Volume |
| ------------- | ------------- |
| 500MB         | 500           |
| 1GB           | 1024          |
| 2GB           | 2048          |
| 5GB           | 5120          |

## Phone Number Format

- **Required:** 10 digits in national format
- **Example:** 0241234567 (starts with 0)
- **Validation:** Automatic removal of spaces and dashes

## Error Codes

| Code | Meaning         | Action                |
| ---- | --------------- | --------------------- |
| 0000 | Success         | Transaction initiated |
| 1001 | Invalid network | Check network name    |
| 1002 | Invalid volume  | Check volume format   |

## Code Examples

### Check Balance Before Transaction

```javascript
import { checkBalance } from "./services/hubnetService.js";

try {
  const balance = await checkBalance();
  console.log(`Balance: ${balance.balance} ${balance.currency}`);
} catch (error) {
  console.error("Balance check failed:", error.message);
}
```

### Initiate Data Transaction

```javascript
import { initiateDataTransaction } from "./services/hubnetService.js";

try {
  const result = await initiateDataTransaction({
    phone: "0241234567",
    network: "MTN", // Will be converted to 'mtn'
    volume: "1GB", // Will be converted to 1024 MB
    reference: "ORD-12345",
    referrer: "0270123456", // Optional
    webhookUrl: "https://yourdomain.com/webhook", // Optional
  });

  console.log("Transaction ID:", result.transactionId);
  console.log("Payment ID:", result.paymentId);
} catch (error) {
  console.error("Transaction failed:", error.message);
}
```

### Complete Order Flow (Automatic)

The integration happens automatically after payment:

```javascript
// In paymentController.js - webhook handler
if (event === "charge.success") {
  // 1. Verify payment
  // 2. Credit commission
  // 3. Initiate Hubnet order (automatic)
  await initiateHubnetOrder(order.id);
}
```

## Order Status Flow

1. **pending** - Order created, awaiting payment
2. **processing** - Payment confirmed, Hubnet transaction initiated
3. **completed** - Data delivered (✅ **ONLY updated via Hubnet webhook**)
4. **failed** - Payment or delivery failed (updated via webhook)

**Critical:** The Hubnet webhook is the **ONLY source of truth** for delivery status. Orders are never marked as "completed" until the webhook confirms delivery.

## Database Fields

### Order Table

```javascript
{
  id: "ORD-12345",
  status: "processing",
  hubnetOrderId: "TXN-12345", // Hubnet transaction_id
  hubnetResponse: "{...}", // Full Hubnet response JSON
  completedAt: null, // Set only when webhook confirms delivery
  // ... other fields
}
```

## Webhook Implementation (✅ IMPLEMENTED - Final Authority)

The webhook endpoint receives delivery status updates from Hubnet and is the **ONLY source of truth** for marking orders as completed or failed.

### Webhook Endpoint (✅ Already Implemented)

**URL:** `POST /api/hubnet/webhook`

**What it does:**

1. Receives delivery updates from Hubnet
2. Verifies request authenticity by matching order details
3. Finds order by reference (order ID) or transaction_id
4. Updates order status to `completed` or `failed`
5. Logs delivery timestamp

**Expected Webhook Payload from Hubnet:**

```json
{
  "reference": "ORD-12345",
  "transaction_id": "TXN-12345",
  "status": "success",
  "message": "Data delivered successfully",
  "phone": "0241234567",
  "volume": "1024",
  "network": "mtn",
  "timestamp": "2026-01-29T12:00:00Z"
}
```

**Status Handling:**

- `success`, `completed`, `delivered` → Order marked as `completed` ✅
- `failed`, `error`, `cancelled` → Order marked as `failed` ❌
- Other statuses → Logged but order remains `processing`

**Security Verification:**

- Matches phone number with order
- Validates volume matches bundle
- Confirms network matches order
- Logs any mismatches as warnings

### Configure Webhook URL in Hubnet

1. Log in to [Hubnet Console](https://console.hubnet.app)
2. Go to Settings → Webhooks
3. Set webhook URL: `https://yourdomain.com/api/hubnet/webhook`
4. For local testing, use ngrok:
   ```bash
   ngrok http 3000
   # Use the ngrok URL: https://abc123.ngrok.io/api/hubnet/webhook
   ```

### Check Delivery Status (Debug Endpoint)

**URL:** `GET /api/hubnet/status/:orderId`

**Example:**

```bash
curl http://localhost:3000/api/hubnet/status/ORD-12345
```

**Response:**

```json
{
  "success": true,
  "order": {
    "id": "ORD-12345",
    "status": "completed",
    "customerPhone": "0241234567",
    "completedAt": "2026-01-29T12:05:30Z",
    "hubnetOrderId": "TXN-12345",
    "hubnetData": {
      "webhookReceived": true,
      "status": "success",
      "webhookTimestamp": "2026-01-29T12:05:30Z"
    }
  }
}
```

## Testing

### 1. Test Balance Check

```bash
curl -X GET https://console.hubnet.app/live/api/context/business/transaction/check_balance \
  -H "token: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

### 2. Test Transaction (MTN)

```bash
curl -X POST https://console.hubnet.app/live/api/context/business/transaction/mtn-new-transaction \
  -H "token: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0241234567",
    "volume": "1000",
    "reference": "TEST-001"
  }'
```

### 3. Test Through Your API

Create a test order and pay with Paystack test cards. The Hubnet integration will run automatically.

## Rate Limits

⚠️ **Important:** All Hubnet endpoints are rate-limited to **5 requests per minute**.

**Best Practices:**

- Implement retry logic with exponential backoff
- Don't make parallel requests for multiple orders
- Queue orders and process them sequentially
- Monitor rate limit errors and adjust accordingly

## Error Handling

The integration includes comprehensive error handling:

```javascript
try {
  await initiateHubnetOrder(orderId);
} catch (error) {
  // Error is logged and order status is updated to 'failed'
  // Commission is already credited (not reversed)
  // Admin needs to manually resolve failed orders
  console.error("Hubnet order failed:", error.message);
}
```

## Security Considerations

1. **API Key Protection:**
   - Never commit API keys to version control
   - Use environment variables only
   - Rotate keys regularly

2. **Webhook Verification:**
   - Implement signature verification if Hubnet provides it
   - Validate all webhook data
   - Check order status before updating

3. **Phone Number Validation:**
   - Always validate phone format
   - Sanitize input before sending to API
   - Log all transactions for audit

## Troubleshooting

### Issue: Balance check fails

**Solution:**

- Verify API key is correct
- Check if Hubnet account has sufficient balance
- Ensure API endpoint is accessible

### Issue: Invalid network error

**Solution:**

- Check network mapping in hubnetService.js
- Verify bundle network is one of: MTN, AIRTELTIGO

### Issue: Invalid volume error

**Solution:**

- Check volume format in database (e.g., "1GB", "500MB")
- Verify conversion logic in extractVolumeInMB()

### Issue: Phone validation fails

**Solution:**

- Ensure phone is 10 digits
- Must start with 0
- Format: 0XXXXXXXXX

## Next Steps

1. **Get Hubnet API Key** - Sign up and obtain credentials
2. **Configure .env** - Add API key and webhook URL
3. **Test with Live Data** - Create real orders and verify delivery
4. **Implement Webhook** - Set up endpoint to receive status updates
5. **Monitor Logs** - Check logger outputs for transaction details
6. **Handle Failed Orders** - Create admin interface to retry failed deliveries

## Support

For Hubnet API issues:

- Documentation: https://hubnet-web.onrender.com/api-documentation
- Contact: Hubnet support team

For integration issues:

- Check logs in console
- Review error messages in order.hubnetResponse
- Contact development team
