# Hubnet Webhook - Delivery Status Authority

## Overview

The Hubnet webhook is the **ONLY source of truth** for marking orders as delivered or failed. No order should be marked as completed until Hubnet confirms delivery via this webhook.

## Webhook Endpoint

**URL:** `POST /api/hubnet/webhook`

**Purpose:** Receives delivery status updates from Hubnet after data is delivered to customers.

## Implementation

### Files Created

1. **[src/controllers/hubnetController.js](src/controllers/hubnetController.js)** - Webhook handler and status checker
2. **[src/routes/hubnetRoutes.js](src/routes/hubnetRoutes.js)** - Webhook routes
3. **[src/app.js](src/app.js)** - Updated to register Hubnet routes

### Flow Diagram

```
Hubnet delivers data → Calls webhook → Verifies request →
Matches order → Updates status to completed/failed →
Logs delivery time
```

## Webhook Request Format

### Expected Payload from Hubnet

```json
{
  "reference": "clr1abc2def3ghi4jkl5mno",
  "transaction_id": "TXN-ABC123",
  "status": "success",
  "message": "Data delivered successfully",
  "phone": "0241234567",
  "volume": "1024",
  "network": "mtn",
  "timestamp": "2026-01-29T12:00:00Z"
}
```

### Fields

| Field            | Type   | Description                                      |
| ---------------- | ------ | ------------------------------------------------ |
| `reference`      | String | Your order ID (sent when initiating transaction) |
| `transaction_id` | String | Hubnet's transaction ID                          |
| `status`         | String | Delivery status (success, failed, etc.)          |
| `message`        | String | Status message                                   |
| `phone`          | String | Customer phone number                            |
| `volume`         | String | Data volume in MB                                |
| `network`        | String | Network (mtn, big-time)                          |
| `timestamp`      | String | Delivery timestamp                               |

## Status Handling

### Success Statuses (Mark as Completed ✅)

- `success`
- `completed`
- `delivered`
- `successful`

**Action:** Order status → `completed`, sets `completedAt` timestamp

### Failure Statuses (Mark as Failed ❌)

- `failed`
- `error`
- `cancelled`

**Action:** Order status → `failed`

### Unknown Statuses

**Action:** Log warning, keep order in `processing` status

## Verification Process

The webhook verifies request authenticity by matching order details:

1. **Phone Number Match**
   - Compares webhook phone with order.customerPhone
   - Logs warning if mismatch

2. **Volume Match**
   - Extracts MB from bundle (e.g., "1GB" → 1024)
   - Compares with webhook volume
   - Logs warning if mismatch

3. **Network Match**
   - Converts order network to Hubnet format (MTN → mtn)
   - Compares with webhook network
   - Logs warning if mismatch

**Note:** Mismatches are logged as warnings but don't reject the webhook (Hubnet might send partial data).

## API Endpoints

### 1. Webhook Receiver (Main)

**POST** `/api/hubnet/webhook`

**Purpose:** Receives delivery updates from Hubnet

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "orderId": "clr1abc2def3ghi4jkl5mno",
  "status": "completed"
}
```

### 2. Delivery Status Checker (Debug)

**GET** `/api/hubnet/status/:orderId`

**Purpose:** Manually check order delivery status

**Example:**

```bash
curl http://localhost:3000/api/hubnet/status/clr1abc2def3ghi4jkl5mno
```

**Response:**

```json
{
  "success": true,
  "order": {
    "id": "clr1abc2def3ghi4jkl5mno",
    "status": "completed",
    "customerPhone": "0241234567",
    "customerName": "John Doe",
    "bundle": {
      "network": "MTN",
      "volume": "1GB"
    },
    "pricePaid": "5.50",
    "createdAt": "2026-01-29T11:45:00Z",
    "completedAt": "2026-01-29T12:05:30Z",
    "hubnetOrderId": "TXN-ABC123",
    "hubnetData": {
      "webhookReceived": true,
      "webhookTimestamp": "2026-01-29T12:05:30Z",
      "status": "success",
      "message": "Data delivered successfully",
      "previousStatus": "processing"
    }
  }
}
```

## Configuration

### 1. Set Webhook URL in Environment

**File:** `.env`

```env
HUBNET_WEBHOOK_URL=https://yourdomain.com/api/hubnet/webhook
```

This URL is sent to Hubnet when initiating transactions.

### 2. Configure in Hubnet Dashboard

1. Log in to [Hubnet Console](https://console.hubnet.app)
2. Navigate to Settings → API → Webhooks
3. Add webhook URL: `https://yourdomain.com/api/hubnet/webhook`
4. Save settings

### 3. Local Testing with ngrok

For local development, use ngrok to expose your local server:

```bash
# Start ngrok
ngrok http 3000

# Output: https://abc123.ngrok.io

# Update .env
HUBNET_WEBHOOK_URL=https://abc123.ngrok.io/api/hubnet/webhook
```

## Testing

### Test Webhook Locally

```bash
# Simulate Hubnet webhook call
curl -X POST http://localhost:3000/api/hubnet/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "clr1abc2def3ghi4jkl5mno",
    "transaction_id": "TXN-TEST-123",
    "status": "success",
    "message": "Test delivery",
    "phone": "0241234567",
    "volume": "1024",
    "network": "mtn"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "orderId": "clr1abc2def3ghi4jkl5mno",
  "status": "completed"
}
```

### Check Order Status

```bash
curl http://localhost:3000/api/hubnet/status/clr1abc2def3ghi4jkl5mno
```

## Order Status Lifecycle

```
1. pending → Order created, awaiting payment
   ↓
2. payment_confirmed → Paystack webhook confirms payment
   ↓
3. processing → Hubnet transaction initiated
   ↓ (WAIT FOR WEBHOOK)
   ↓
4. completed → ✅ Hubnet webhook confirms delivery
   OR
4. failed → ❌ Hubnet webhook reports failure
```

## Database Updates

### Order Record After Webhook

```javascript
{
  id: "clr1abc2def3ghi4jkl5mno",
  status: "completed", // Updated by webhook
  completedAt: "2026-01-29T12:05:30Z", // Set by webhook
  hubnetOrderId: "TXN-ABC123",
  hubnetResponse: JSON.stringify({
    webhookReceived: true,
    webhookTimestamp: "2026-01-29T12:05:30Z",
    status: "success",
    message: "Data delivered successfully",
    transaction_id: "TXN-ABC123",
    phone: "0241234567",
    volume: "1024",
    network: "mtn",
    previousStatus: "processing"
  })
}
```

## Error Handling

### Webhook Processing Errors

The webhook handler is designed to be resilient:

1. **Order Not Found**
   - Returns 404
   - Logs error with reference and transaction_id

2. **Invalid Status**
   - Returns 200 (acknowledges receipt)
   - Logs warning
   - Keeps order in current status

3. **Database Error**
   - Returns 200 (prevents Hubnet retry loops)
   - Logs error details
   - Requires manual intervention

### Verification Warnings

Mismatches in phone, volume, or network are logged as warnings but don't block webhook processing:

```javascript
// Example log output
{
  level: "warn",
  message: "Hubnet webhook data verification warnings",
  orderId: "clr1abc2def3ghi4jkl5mno",
  errors: [
    "Phone mismatch: expected 0241234567, got 0241234568",
    "Volume mismatch: expected 1024MB, got 1000MB"
  ]
}
```

## Security Considerations

1. **Request Verification**
   - Validates order exists before processing
   - Matches order details (phone, volume, network)
   - Logs all webhook requests for audit

2. **Idempotency**
   - Safe to receive same webhook multiple times
   - Won't duplicate status updates

3. **IP Whitelisting** (Recommended)
   - Add Hubnet IP addresses to firewall whitelist
   - Reject webhooks from unknown IPs

4. **Signature Verification** (If Available)
   - If Hubnet provides signature headers, verify them
   - Similar to Paystack HMAC verification

## Logging

All webhook events are logged with full details:

```javascript
// Webhook received
logger.info("Hubnet webhook received", { body: req.body });

// Order found
logger.info("Order found for Hubnet webhook", {
  orderId: order.id,
  currentStatus: order.status,
  webhookStatus: status,
});

// Success
logger.success("Order status updated from Hubnet webhook", {
  orderId: updatedOrder.id,
  previousStatus: order.status,
  newStatus: updatedOrder.status,
  deliveryTime: deliveryTime?.toISOString(),
});

// Warnings
logger.warn("Hubnet webhook data verification warnings", {
  orderId: order.id,
  errors: verificationErrors,
});

// Errors
logger.error("Error processing Hubnet webhook", {
  error: error.message,
  stack: error.stack,
});
```

## Troubleshooting

### Webhook Not Received

**Check:**

1. Webhook URL configured correctly in Hubnet dashboard
2. Server is publicly accessible (use ngrok for local testing)
3. Firewall allows incoming requests
4. Check Hubnet dashboard for webhook delivery logs

### Order Not Found

**Check:**

1. Reference matches order ID exactly
2. Order exists in database
3. Check logs for the reference being sent

### Status Not Updating

**Check:**

1. Webhook status format matches expected values
2. Database connection is working
3. Check logs for any errors
4. Verify order is in "processing" status before webhook

### Verification Warnings

**Check:**

1. Bundle volume format is correct (e.g., "1GB", "500MB")
2. Phone numbers match exactly
3. Network names match (MTN, AIRTELTIGO)
4. Check logs for specific mismatch details

## Next Steps

1. **Configure Hubnet Dashboard** - Add webhook URL
2. **Test with ngrok** - Expose local server for testing
3. **Monitor Logs** - Watch for webhook events in production
4. **Handle Failed Deliveries** - Create admin interface to retry
5. **Set Up Alerts** - Notify admins of failed deliveries

## Important Notes

⚠️ **Critical Rules:**

1. The webhook is the **ONLY** way to mark orders as completed
2. Never manually change order status to completed without webhook confirmation
3. Always wait for webhook before considering delivery successful
4. Commission has already been credited when order reaches "processing" status
5. Failed deliveries require manual investigation and possible refund

## Support

For webhook issues:

- Check logs first: `logger.info`, `logger.warn`, `logger.error`
- Verify webhook URL in Hubnet dashboard
- Test locally with ngrok
- Contact Hubnet support if webhooks not being sent
