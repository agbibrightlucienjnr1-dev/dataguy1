# Withdrawal System Documentation

## Overview

The withdrawal system enables agents and sub-agents to withdraw their wallet balance using Paystack's Transfer API. The system supports both bank account and mobile money withdrawals with a minimum withdrawal amount of GH₵10.

## Features

- ✅ Minimum withdrawal: GH₵10
- ✅ Admin approval workflow
- ✅ Paystack Transfer API integration
- ✅ Bank account validation
- ✅ Mobile money support (MTN, Vodafone, AirtelTigo)
- ✅ Withdrawal history tracking
- ✅ Real-time status updates via webhook
- ✅ Automatic wallet debit on approval

## Database Schema

### Withdrawal Model

```prisma
model Withdrawal {
  id                     String            @id @default(cuid())
  userId                 String
  amount                 Decimal           @db.Decimal(10, 2)
  accountType            BankAccountType
  accountNumber          String
  accountName            String
  bankName               String?
  mobileNetwork          String?
  status                 WithdrawalStatus  @default(pending)
  reference              String            @unique
  paystackRecipientCode  String?
  paystackTransferCode   String?
  paystackResponse       Json?
  adminNote              String?
  approvedBy             String?
  approvedAt             DateTime?
  processedAt            DateTime?
  completedAt            DateTime?
  createdAt              DateTime          @default(now())
  updatedAt              DateTime          @updatedAt

  user                   User              @relation("UserWithdrawals", fields: [userId], references: [id])
  approver               User?             @relation("ApprovedWithdrawals", fields: [approvedBy], references: [id])
}

enum WithdrawalStatus {
  pending
  approved
  processing
  completed
  failed
  rejected
}

enum BankAccountType {
  bank_account
  mobile_money
}
```

## API Endpoints

### User Endpoints (Agents/Sub-agents)

#### 1. Create Withdrawal Request

**POST** `/api/withdrawals`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "amount": 50.0,
  "accountType": "bank_account",
  "accountNumber": "0123456789",
  "accountName": "John Doe",
  "bankName": "GCB Bank Limited"
}
```

**For Mobile Money:**

```json
{
  "amount": 50.0,
  "accountType": "mobile_money",
  "accountNumber": "0241234567",
  "accountName": "John Doe",
  "mobileNetwork": "MTN"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "data": {
    "id": "clx...",
    "amount": "50.00",
    "accountType": "bank_account",
    "status": "pending",
    "reference": "WDL-clx...",
    "createdAt": "2025-01-29T12:00:00.000Z"
  }
}
```

#### 2. Get My Withdrawals

**GET** `/api/withdrawals?status=pending&page=1&limit=20`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "amount": "50.00",
      "accountType": "bank_account",
      "accountName": "John Doe",
      "status": "pending",
      "reference": "WDL-clx...",
      "createdAt": "2025-01-29T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### 3. Get Withdrawal by ID

**GET** `/api/withdrawals/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "amount": "50.00",
    "accountType": "bank_account",
    "accountNumber": "0123456789",
    "accountName": "John Doe",
    "bankName": "GCB Bank Limited",
    "status": "completed",
    "reference": "WDL-clx...",
    "completedAt": "2025-01-29T12:05:00.000Z"
  }
}
```

#### 4. Get Withdrawal Statistics

**GET** `/api/withdrawals/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalWithdrawals": 10,
    "pendingWithdrawals": 2,
    "completedWithdrawals": 8,
    "totalAmount": "500.00",
    "completedAmount": "400.00"
  }
}
```

### Helper Endpoints

#### 5. Get Ghana Banks

**GET** `/api/withdrawals/banks`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Access Bank Ghana",
      "slug": "access-bank-ghana",
      "code": "280100",
      "active": true,
      "country": "Ghana",
      "currency": "GHS",
      "type": "ghipss"
    }
  ]
}
```

#### 6. Verify Account Number

**POST** `/api/withdrawals/verify-account`

**Request Body:**

```json
{
  "accountNumber": "0123456789",
  "bankCode": "280100"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accountNumber": "0123456789",
    "accountName": "John Doe",
    "bankId": 1
  }
}
```

### Admin Endpoints

#### 7. Get All Withdrawals

**GET** `/api/withdrawals/admin/all?status=pending&page=1&limit=50`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "amount": "50.00",
      "accountType": "bank_account",
      "accountName": "John Doe",
      "status": "pending",
      "reference": "WDL-clx...",
      "user": {
        "id": "clx...",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+233241234567",
        "role": "agent"
      },
      "createdAt": "2025-01-29T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "totalPages": 1
  }
}
```

#### 8. Approve Withdrawal

**PUT** `/api/withdrawals/:id/approve`

**Response:**

```json
{
  "success": true,
  "message": "Withdrawal approved and transfer initiated",
  "data": {
    "id": "clx...",
    "amount": "50.00",
    "status": "processing",
    "paystackTransferCode": "TRF_xxx",
    "approvedBy": "clx...",
    "approvedAt": "2025-01-29T12:02:00.000Z",
    "processedAt": "2025-01-29T12:02:00.000Z"
  }
}
```

#### 9. Reject Withdrawal

**PUT** `/api/withdrawals/:id/reject`

**Request Body:**

```json
{
  "reason": "Insufficient documentation"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Withdrawal rejected",
  "data": {
    "id": "clx...",
    "status": "rejected",
    "adminNote": "Insufficient documentation",
    "approvedBy": "clx...",
    "approvedAt": "2025-01-29T12:02:00.000Z"
  }
}
```

## Withdrawal Flow

### 1. Request Creation

```
User → Create Request → Check Balance → Generate Reference → Save to DB → Return Response
```

### 2. Admin Approval

```
Admin → Approve → Create Paystack Recipient → Initiate Transfer → Debit Wallet → Update Status
```

### 3. Webhook Processing

```
Paystack → Send Webhook → Verify Signature → Update Status → Complete
```

## Status Flow

```
pending → approved → processing → completed
                  ↘ rejected
                               ↘ failed
```

## Paystack Integration

### Transfer Recipient Creation

```javascript
{
  "type": "ghipss", // or "mobile_money"
  "name": "John Doe",
  "account_number": "0123456789",
  "bank_code": "280100",
  "currency": "GHS"
}
```

### Transfer Initiation

```javascript
{
  "source": "balance",
  "reason": "Withdrawal for John Doe",
  "amount": 5000, // 50 GHS in pesewas
  "recipient": "RCP_xxx",
  "reference": "WDL-clx..."
}
```

### Webhook Events

- `transfer.success` - Transfer completed successfully
- `transfer.failed` - Transfer failed
- `transfer.reversed` - Transfer reversed (funds returned)

## Error Handling

### Validation Errors

- Minimum withdrawal not met (< GH₵10)
- Insufficient wallet balance
- Pending withdrawal exists
- Missing required fields

### Processing Errors

- Paystack API errors
- Invalid account details
- Transfer failures

## Business Rules

1. **Minimum Withdrawal:** GH₵10
2. **One Active Request:** Users can only have one pending/processing withdrawal at a time
3. **Balance Check:** Withdrawal amount must not exceed wallet balance
4. **Admin Approval Required:** All withdrawals require admin approval
5. **Automatic Wallet Debit:** Wallet is debited when admin approves withdrawal
6. **Final Status from Webhook:** Transfer status is updated via Paystack webhook

## Security

1. **Authentication Required:** All endpoints require JWT authentication
2. **Role-Based Access:** Admin endpoints restricted to admin role only
3. **Webhook Verification:** Paystack webhooks verified using signature
4. **Reference Uniqueness:** Each withdrawal has unique reference for tracking
5. **Transaction Atomicity:** Wallet debit and transfer initiation in single transaction

## Testing

### Test Accounts (Paystack Sandbox)

- **Test Bank Account:** 0123456789
- **Test Mobile Money:** 0241234567
- **Test Bank Code:** 280100 (Access Bank)

### Test Flow

1. Create withdrawal request
2. Admin approves
3. Paystack sends test webhook
4. Status updates to completed

## Monitoring

### Key Metrics

- Total withdrawals
- Pending withdrawals
- Completed withdrawals
- Failed withdrawals
- Total amount withdrawn
- Average processing time

### Logs

- Withdrawal creation
- Approval/rejection
- Transfer initiation
- Webhook processing
- Status updates

## Future Enhancements

1. **Automated Approval:** Auto-approve withdrawals below certain amount
2. **Scheduled Withdrawals:** Batch process withdrawals at specific times
3. **Withdrawal Limits:** Daily/monthly withdrawal limits per user
4. **Notifications:** Email/SMS notifications for status changes
5. **Withdrawal Reports:** Generate reports for accounting
6. **Multi-Currency:** Support other currencies beyond GHS
7. **Bank Account Verification:** Verify account ownership before approval
8. **Failed Transfer Retry:** Auto-retry failed transfers
9. **Wallet Refund:** Auto-refund wallet for failed/reversed transfers
