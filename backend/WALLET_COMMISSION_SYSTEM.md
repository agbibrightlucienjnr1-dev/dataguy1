# Wallet & Commission System

## ✅ Implementation Complete

The wallet and commission distribution system has been successfully implemented!

## 📊 Database Tables Added

### 1. **Wallets Table**

- Stores user wallet balances
- Tracks total earned and total withdrawn
- One wallet per user (agents and sub-agents)

### 2. **Wallet Transactions Table**

- Records all wallet activity (commissions, withdrawals, refunds)
- Tracks balance before/after each transaction
- Links to orders for commission tracking

### 3. **Orders Table Updates**

- Added `commissionAmount` - commission paid for the order
- Added `commissionPaid` - boolean flag for tracking

## 💰 Commission Calculation

### Agent Commission

```
Commission = Customer Price - Admin Price
```

Example:

- Customer pays: GH₵ 10.00
- Admin price: GH₵ 8.00
- **Agent commission: GH₵ 2.00**

### Sub-Agent Commission

```
Commission = Customer Price - Agent's Sub-Agent Price
```

Example:

- Customer pays: GH₵ 11.00
- Agent's sub-agent price: GH₵ 9.00
- **Sub-agent commission: GH₵ 2.00**

### Admin Profit (Not stored in wallet)

```
Admin Profit = Admin Price - Hubnet Cost
```

## 🔄 Payment Flow

```
1. Customer creates order → Status: "pending"

2. Payment webhook confirms payment
   ↓
3. Commission calculated and credited to seller's wallet
   ↓
4. Order status → "payment_confirmed"
   ↓
5. Hubnet order initiated
   ↓
6. Order status → "processing"
   ↓
7. Hubnet delivers data
   ↓
8. Order status → "completed"
```

## 🔌 API Endpoints

### Wallet Endpoints (Protected - Agents/Sub-agents only)

**Get Wallet Balance**

```bash
GET /api/wallet
Authorization: Bearer {token}
```

**Get Wallet Transactions**

```bash
GET /api/wallet/transactions?type=commission&page=1&limit=50
Authorization: Bearer {token}
```

**Get Wallet Summary**

```bash
GET /api/wallet/summary
Authorization: Bearer {token}
```

### Payment Webhook (Public - Verified by signature)

**Confirm Payment**

```bash
POST /api/payments/webhook
Content-Type: application/json

{
  "orderId": "order-id",
  "paymentReference": "PAY-12345",
  "status": "success"
}
```

## 📝 Service Functions

### Wallet Service

- `getOrCreateWallet(userId)` - Get or create wallet for user
- `creditWallet(userId, amount, data)` - Add funds to wallet
- `debitWallet(userId, amount, data)` - Remove funds (for withdrawals)
- `getWalletTransactions(userId, filters)` - Get transaction history
- `getWalletSummary(userId)` - Get wallet statistics

### Commission Service

- `calculateCommission(order)` - Calculate commission based on seller type
- `processPaymentConfirmation(orderId, reference)` - Confirm payment & credit wallet
- `markOrderAsProcessing(orderId)` - Update order status after Hubnet call

## 🧪 Testing

Run the test script:

```bash
bash test-wallet-commission.sh
```

Or test manually:

1. **Create an order:**

```bash
curl -X POST http://localhost:3000/api/orders/link/h7ban7jw2006zyosdt4sezo0/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "0501234567",
    "customerName": "Test Customer",
    "bundleId": "your-bundle-id"
  }'
```

2. **Simulate payment confirmation:**

```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-id-from-step-1",
    "paymentReference": "PAY-12345",
    "status": "success"
  }'
```

3. **Check wallet balance:**

```bash
curl http://localhost:3000/api/wallet \
  -H "Authorization: Bearer your-token"
```

## 🔐 Security Features

✅ **Atomic Transactions** - Commission credit and order update happen together
✅ **Balance Tracking** - Before/after balance recorded for every transaction
✅ **Commission Verification** - Calculated based on actual pricing tables
✅ **Payment First** - Hubnet order only placed after payment confirmed
✅ **Transaction History** - Complete audit trail of all wallet activity

## 📋 Transaction Types

- `commission` - Earned from order sales
- `withdrawal` - Money withdrawn by user
- `refund` - Refunded to wallet from failed orders
- `adjustment` - Manual adjustments by admin

## 🎯 Wallet Summary Data

The wallet summary provides:

- Current balance
- Total earned (all time)
- Total withdrawn (all time)
- Commission count and total
- Withdrawal count and total
- Total transaction count

## 🚀 Next Steps

1. **Withdrawal System**
   - Create withdrawal request endpoint
   - Admin approval workflow
   - Bank account verification
   - Transfer to bank account

2. **Hubnet Integration**
   - Implement actual API calls in `initiateHubnetOrder()`
   - Handle Hubnet responses
   - Update order status based on delivery

3. **Admin Dashboard**
   - View all wallets
   - Approve withdrawals
   - View commission reports
   - Adjust balances if needed

4. **Notifications**
   - SMS/Email on commission credit
   - Wallet balance updates
   - Withdrawal status updates

## ✅ Summary

The system now automatically:

- Calculates commissions based on pricing hierarchy
- Credits seller wallets when payment is confirmed
- Tracks all transactions with complete audit trail
- Maintains balance integrity with database transactions
- Separates payment confirmation from Hubnet order placement

**Critical Rule Maintained:** Hubnet orders are only initiated AFTER payment confirmation and commission distribution! ✅
