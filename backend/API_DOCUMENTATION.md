# DataGuy API Documentation

**Base URL:** `http://localhost:3000/api`  
**Version:** 1.0.0  
**Last Updated:** January 29, 2026

## Table of Contents

1. [Authentication](#authentication)
2. [Data Bundles](#data-bundles)
3. [Orders](#orders)
4. [Wallet](#wallet)
5. [Withdrawals](#withdrawals)
6. [Admin](#admin)
7. [Payments & Webhooks](#payments--webhooks)
8. [Error Handling](#error-handling)
9. [Quick Start Guide](#quick-start-guide)

---

## Authentication

### Register

Create a new user account.

**Endpoint:** `POST /auth/register`  
**Auth Required:** No

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+233241234567",
  "password": "SecurePass123!",
  "role": "agent"
}
```

**Fields:**

- `name` (string, required) - Full name
- `email` (string, required) - Valid email address
- `phone` (string, required) - Phone number with country code
- `password` (string, required) - Minimum 6 characters
- `role` (string, optional) - One of: `agent`, `sub_agent`. Default: `agent`

**Success Response:** `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "clx123abc",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+233241234567",
      "role": "agent",
      "paymentLinkCode": "A1B2C3D4",
      "createdAt": "2026-01-29T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login

Authenticate and get access token.

**Endpoint:** `POST /auth/login`  
**Auth Required:** No

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response:** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clx123abc",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+233241234567",
      "role": "agent",
      "paymentLinkCode": "A1B2C3D4"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User Profile

Get authenticated user's profile.

**Endpoint:** `GET /auth/me`  
**Auth Required:** Yes

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+233241234567",
    "role": "agent",
    "paymentLinkCode": "A1B2C3D4",
    "createdAt": "2026-01-29T12:00:00.000Z"
  }
}
```

---

## Data Bundles

### Get All Data Bundles

Get list of all available data bundles with prices based on user role.

**Endpoint:** `GET /bundles`  
**Auth Required:** Yes

**Query Parameters:**

- `network` (string, optional) - Filter by network: `MTN`, `AIRTELTIGO`
- `page` (number, optional) - Page number. Default: 1
- `limit` (number, optional) - Items per page. Default: 50

**Example:** `GET /bundles?network=MTN&page=1&limit=20`

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clx456def",
      "network": "MTN",
      "volume": "1GB",
      "validity": "24 hours",
      "basePrice": "5.00",
      "agentPrice": "4.50",
      "subAgentPrice": "4.75",
      "yourPrice": "4.50",
      "commission": "0.50",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Note:** `yourPrice` and `commission` are calculated based on authenticated user's role.

---

### Get Bundle by ID

Get details of a specific data bundle.

**Endpoint:** `GET /bundles/:id`  
**Auth Required:** Yes

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx456def",
    "network": "MTN",
    "volume": "1GB",
    "validity": "24 hours",
    "basePrice": "5.00",
    "agentPrice": "4.50",
    "subAgentPrice": "4.75",
    "yourPrice": "4.50",
    "commission": "0.50",
    "isActive": true
  }
}
```

---

## Orders

### Create Order

Create a new data bundle order using payment link.

**Endpoint:** `POST /orders`  
**Auth Required:** No (uses payment link code)

**Request Body:**

```json
{
  "paymentLinkCode": "A1B2C3D4",
  "bundleId": "clx456def",
  "phone": "0241234567",
  "email": "customer@example.com"
}
```

**Fields:**

- `paymentLinkCode` (string, required) - Agent's payment link code
- `bundleId` (string, required) - Data bundle ID
- `phone` (string, required) - Customer's phone number (10 digits)
- `email` (string, optional) - Customer's email address

**Success Response:** `201 Created`

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "clx789ghi",
      "bundleId": "clx456def",
      "phone": "0241234567",
      "network": "MTN",
      "volume": "1GB",
      "pricePaid": "4.50",
      "status": "pending_payment",
      "createdAt": "2026-01-29T12:00:00.000Z"
    },
    "paymentUrl": "https://checkout.paystack.com/abc123"
  }
}
```

---

### Get My Orders

Get list of orders created by authenticated user.

**Endpoint:** `GET /orders`  
**Auth Required:** Yes

**Query Parameters:**

- `status` (string, optional) - Filter by status: `pending_payment`, `paid`, `processing`, `delivered`, `failed`
- `network` (string, optional) - Filter by network
- `page` (number, optional) - Default: 1
- `limit` (number, optional) - Default: 20

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clx789ghi",
      "bundleId": "clx456def",
      "phone": "0241234567",
      "network": "MTN",
      "volume": "1GB",
      "pricePaid": "4.50",
      "commission": "0.50",
      "status": "delivered",
      "hubnetResponse": {
        "status": "success",
        "message": "Transaction successful"
      },
      "createdAt": "2026-01-29T12:00:00.000Z",
      "deliveredAt": "2026-01-29T12:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### Get Order by ID

Get details of a specific order.

**Endpoint:** `GET /orders/:id`  
**Auth Required:** Yes

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx789ghi",
    "bundleId": "clx456def",
    "userId": "clx123abc",
    "phone": "0241234567",
    "email": "customer@example.com",
    "network": "MTN",
    "volume": "1GB",
    "pricePaid": "4.50",
    "commission": "0.50",
    "status": "delivered",
    "paymentReference": "PAY_abc123",
    "hubnetReference": "HUB_xyz789",
    "hubnetResponse": {
      "status": "success",
      "message": "Transaction successful"
    },
    "createdAt": "2026-01-29T12:00:00.000Z",
    "paidAt": "2026-01-29T12:01:00.000Z",
    "deliveredAt": "2026-01-29T12:05:00.000Z"
  }
}
```

---

### Track Order (Public)

Track order status without authentication.

**Endpoint:** `GET /orders/track/:orderId`  
**Auth Required:** No

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx789ghi",
    "phone": "0241234567",
    "network": "MTN",
    "volume": "1GB",
    "status": "delivered",
    "createdAt": "2026-01-29T12:00:00.000Z",
    "deliveredAt": "2026-01-29T12:05:00.000Z"
  }
}
```

---

### Track Orders by Phone (Public)

Get last 20 orders for a phone number.

**Endpoint:** `GET /orders/track/phone/:phone`  
**Auth Required:** No

**Example:** `GET /orders/track/phone/0241234567`

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clx789ghi",
      "network": "MTN",
      "volume": "1GB",
      "status": "delivered",
      "createdAt": "2026-01-29T12:00:00.000Z"
    }
  ]
}
```

---

## Wallet

### Get My Wallet

Get authenticated user's wallet balance and details.

**Endpoint:** `GET /wallet`  
**Auth Required:** Yes

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clxwallet123",
    "userId": "clx123abc",
    "balance": "125.50",
    "totalEarned": "250.00",
    "totalWithdrawn": "100.00",
    "lastTransactionAt": "2026-01-29T12:00:00.000Z",
    "createdAt": "2026-01-28T10:00:00.000Z",
    "updatedAt": "2026-01-29T12:00:00.000Z"
  }
}
```

---

### Get Wallet Transactions

Get wallet transaction history.

**Endpoint:** `GET /wallet/transactions`  
**Auth Required:** Yes

**Query Parameters:**

- `type` (string, optional) - Filter by type: `commission`, `withdrawal`
- `status` (string, optional) - Filter by status: `pending`, `completed`, `failed`
- `page` (number, optional) - Default: 1
- `limit` (number, optional) - Default: 50

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clxtxn123",
      "type": "commission",
      "amount": "0.50",
      "balanceBefore": "125.00",
      "balanceAfter": "125.50",
      "status": "completed",
      "description": "Commission from order clx789ghi",
      "orderId": "clx789ghi",
      "reference": "COM_abc123",
      "createdAt": "2026-01-29T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 200,
    "totalPages": 4
  }
}
```

---

## Withdrawals

### Create Withdrawal Request

Request to withdraw funds from wallet.

**Endpoint:** `POST /withdrawals`  
**Auth Required:** Yes

**Request Body (Bank Account):**

```json
{
  "amount": 50.0,
  "accountType": "bank_account",
  "accountNumber": "0123456789",
  "accountName": "John Doe",
  "bankName": "Access Bank Ghana"
}
```

**Request Body (Mobile Money):**

```json
{
  "amount": 50.0,
  "accountType": "mobile_money",
  "accountNumber": "0241234567",
  "accountName": "John Doe",
  "mobileNetwork": "MTN"
}
```

**Fields:**

- `amount` (number, required) - Minimum: 10.00 GHS
- `accountType` (string, required) - `bank_account` or `mobile_money`
- `accountNumber` (string, required) - Account/phone number
- `accountName` (string, required) - Account holder name
- `bankName` (string, required if bank_account) - Full bank name
- `mobileNetwork` (string, required if mobile_money) - `MTN`, `VODAFONE`, or `AIRTELTIGO`

**Success Response:** `201 Created`

```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "data": {
    "id": "clxwdl123",
    "amount": "50.00",
    "accountType": "bank_account",
    "accountName": "John Doe",
    "status": "pending",
    "reference": "WDL-abc123",
    "createdAt": "2026-01-29T12:00:00.000Z"
  }
}
```

**Error Response:** `400 Bad Request`

```json
{
  "success": false,
  "message": "Minimum withdrawal amount is GH₵10"
}
```

---

### Get My Withdrawals

Get withdrawal history for authenticated user.

**Endpoint:** `GET /withdrawals`  
**Auth Required:** Yes

**Query Parameters:**

- `status` (string, optional) - Filter: `pending`, `approved`, `processing`, `completed`, `failed`, `rejected`
- `page` (number, optional) - Default: 1
- `limit` (number, optional) - Default: 20

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clxwdl123",
      "amount": "50.00",
      "accountType": "bank_account",
      "accountName": "John Doe",
      "status": "completed",
      "reference": "WDL-abc123",
      "createdAt": "2026-01-29T12:00:00.000Z",
      "completedAt": "2026-01-29T12:10:00.000Z"
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

---

### Get Withdrawal by ID

Get details of a specific withdrawal.

**Endpoint:** `GET /withdrawals/:id`  
**Auth Required:** Yes

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clxwdl123",
    "amount": "50.00",
    "accountType": "bank_account",
    "accountNumber": "0123456789",
    "accountName": "John Doe",
    "bankName": "Access Bank Ghana",
    "status": "completed",
    "reference": "WDL-abc123",
    "approvedBy": "clxadmin",
    "approvedAt": "2026-01-29T12:05:00.000Z",
    "processedAt": "2026-01-29T12:06:00.000Z",
    "completedAt": "2026-01-29T12:10:00.000Z",
    "createdAt": "2026-01-29T12:00:00.000Z"
  }
}
```

---

### Get Withdrawal Statistics

Get withdrawal statistics for authenticated user.

**Endpoint:** `GET /withdrawals/stats`  
**Auth Required:** Yes

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalWithdrawals": 10,
    "pendingWithdrawals": 1,
    "completedWithdrawals": 8,
    "totalAmount": "500.00",
    "completedAmount": "450.00"
  }
}
```

---

### Get Ghana Banks List

Get list of supported Ghanaian banks.

**Endpoint:** `GET /withdrawals/banks`  
**Auth Required:** Yes

**Success Response:** `200 OK`

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
    },
    {
      "id": 2,
      "name": "GCB Bank Limited",
      "slug": "gcb-bank-limited",
      "code": "040100",
      "active": true,
      "country": "Ghana",
      "currency": "GHS",
      "type": "ghipss"
    }
  ]
}
```

---

### Verify Account Number

Verify bank account details before withdrawal.

**Endpoint:** `POST /withdrawals/verify-account`  
**Auth Required:** Yes

**Request Body:**

```json
{
  "accountNumber": "0123456789",
  "bankCode": "280100"
}
```

**Success Response:** `200 OK`

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

---

## Admin

### Get Dashboard Summary

Get overview statistics for admin dashboard.

**Endpoint:** `GET /admin/dashboard`  
**Auth Required:** Yes (Admin only)

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalAgents": 100,
    "totalSubAgents": 50,
    "totalOrders": 5000,
    "pendingOrders": 25,
    "deliveredOrders": 4800,
    "failedOrders": 175,
    "totalRevenue": "25000.00",
    "totalCommissionsPaid": "2500.00",
    "pendingWithdrawals": 5,
    "todayOrders": 150,
    "todayRevenue": "750.00"
  }
}
```

---

### Get All Users

Get list of all users (admin view).

**Endpoint:** `GET /admin/users`  
**Auth Required:** Yes (Admin only)

**Query Parameters:**

- `role` (string, optional) - Filter: `admin`, `agent`, `sub_agent`
- `search` (string, optional) - Search by name, email, phone
- `page` (number, optional) - Default: 1
- `limit` (number, optional) - Default: 50

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clx123abc",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+233241234567",
      "role": "agent",
      "paymentLinkCode": "A1B2C3D4",
      "createdAt": "2026-01-28T10:00:00.000Z",
      "totalOrders": 50,
      "totalRevenue": "500.00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

### Get User by ID

Get detailed information about a specific user.

**Endpoint:** `GET /admin/users/:userId`  
**Auth Required:** Yes (Admin only)

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+233241234567",
    "role": "agent",
    "paymentLinkCode": "A1B2C3D4",
    "createdAt": "2026-01-28T10:00:00.000Z",
    "wallet": {
      "balance": "125.50",
      "totalEarned": "250.00",
      "totalWithdrawn": "100.00"
    },
    "statistics": {
      "totalOrders": 50,
      "deliveredOrders": 48,
      "failedOrders": 2,
      "totalRevenue": "500.00",
      "totalCommission": "50.00"
    }
  }
}
```

---

### Get All Orders (Admin)

Get all orders across all users.

**Endpoint:** `GET /admin/orders`  
**Auth Required:** Yes (Admin only)

**Query Parameters:**

- `status` (string, optional) - Filter by status
- `userId` (string, optional) - Filter by user
- `network` (string, optional) - Filter by network
- `page` (number, optional) - Default: 1
- `limit` (number, optional) - Default: 50

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clx789ghi",
      "user": {
        "id": "clx123abc",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "agent"
      },
      "phone": "0241234567",
      "network": "MTN",
      "volume": "1GB",
      "pricePaid": "4.50",
      "commission": "0.50",
      "status": "delivered",
      "createdAt": "2026-01-29T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5000,
    "totalPages": 100
  }
}
```

---

### Get Failed Orders

Get list of failed orders.

**Endpoint:** `GET /admin/orders/failed`  
**Auth Required:** Yes (Admin only)

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clx789ghi",
      "user": {
        "id": "clx123abc",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "phone": "0241234567",
      "network": "MTN",
      "volume": "1GB",
      "status": "failed",
      "hubnetResponse": {
        "status": "failed",
        "message": "Insufficient balance"
      },
      "createdAt": "2026-01-29T12:00:00.000Z"
    }
  ]
}
```

---

### Get Platform Statistics

Get overall platform statistics.

**Endpoint:** `GET /admin/statistics`  
**Auth Required:** Yes (Admin only)

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "agents": 100,
      "subAgents": 50,
      "topSellers": [
        {
          "id": "clx123abc",
          "name": "John Doe",
          "totalOrders": 200,
          "totalRevenue": "2000.00"
        }
      ]
    },
    "orders": {
      "total": 5000,
      "pending": 25,
      "delivered": 4800,
      "failed": 175,
      "totalRevenue": "25000.00"
    },
    "wallets": {
      "totalBalance": "5000.00",
      "totalEarned": "15000.00",
      "totalWithdrawn": "10000.00"
    },
    "withdrawals": {
      "total": 100,
      "pending": 5,
      "completed": 90,
      "rejected": 5,
      "totalAmount": "10000.00"
    }
  }
}
```

---

### Get All Wallet Balances

Get wallet balances for all users.

**Endpoint:** `GET /admin/wallets`  
**Auth Required:** Yes (Admin only)

**Query Parameters:**

- `page` (number, optional) - Default: 1
- `limit` (number, optional) - Default: 50

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clxwallet123",
      "user": {
        "id": "clx123abc",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "agent"
      },
      "balance": "125.50",
      "totalEarned": "250.00",
      "totalWithdrawn": "100.00",
      "lastTransactionAt": "2026-01-29T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

### Toggle Bundle Status

Enable or disable a data bundle.

**Endpoint:** `PATCH /admin/bundles/:bundleId/status`  
**Auth Required:** Yes (Admin only)

**Request Body:**

```json
{
  "isActive": false
}
```

**Success Response:** `200 OK`

```json
{
  "success": true,
  "message": "Bundle status updated successfully",
  "data": {
    "id": "clx456def",
    "network": "MTN",
    "volume": "1GB",
    "isActive": false
  }
}
```

---

### Get All Withdrawals (Admin)

View all withdrawal requests across all users.

**Endpoint:** `GET /withdrawals/admin/all`  
**Auth Required:** Yes (Admin only)

**Query Parameters:**

- `status` (string, optional) - Filter by status
- `userId` (string, optional) - Filter by user
- `page` (number, optional) - Default: 1
- `limit` (number, optional) - Default: 50

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clxwdl123",
      "user": {
        "id": "clx123abc",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+233241234567",
        "role": "agent"
      },
      "amount": "50.00",
      "accountType": "bank_account",
      "accountName": "John Doe",
      "status": "pending",
      "reference": "WDL-abc123",
      "createdAt": "2026-01-29T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

---

### Approve Withdrawal

Approve a withdrawal request and initiate transfer.

**Endpoint:** `PUT /withdrawals/:id/approve`  
**Auth Required:** Yes (Admin only)

**Success Response:** `200 OK`

```json
{
  "success": true,
  "message": "Withdrawal approved and transfer initiated",
  "data": {
    "id": "clxwdl123",
    "amount": "50.00",
    "status": "processing",
    "approvedBy": "clxadmin",
    "approvedAt": "2026-01-29T12:05:00.000Z",
    "processedAt": "2026-01-29T12:05:00.000Z"
  }
}
```

---

### Reject Withdrawal

Reject a withdrawal request with reason.

**Endpoint:** `PUT /withdrawals/:id/reject`  
**Auth Required:** Yes (Admin only)

**Request Body:**

```json
{
  "reason": "Insufficient documentation"
}
```

**Success Response:** `200 OK`

```json
{
  "success": true,
  "message": "Withdrawal rejected",
  "data": {
    "id": "clxwdl123",
    "status": "rejected",
    "adminNote": "Insufficient documentation",
    "approvedBy": "clxadmin",
    "approvedAt": "2026-01-29T12:05:00.000Z"
  }
}
```

---

## Payments & Webhooks

### Paystack Webhook

Endpoint for receiving Paystack webhook events.

**Endpoint:** `POST /payments/webhook`  
**Auth Required:** No (verified by signature)

**Headers:**

```
x-paystack-signature: <signature>
```

**Events Handled:**

- `charge.success` - Payment successful
- `transfer.success` - Withdrawal completed
- `transfer.failed` - Withdrawal failed
- `transfer.reversed` - Withdrawal reversed

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Webhook processed"
}
```

---

### Payment Callback

Redirect endpoint after Paystack payment.

**Endpoint:** `GET /payments/callback`  
**Auth Required:** No

**Query Parameters:**

- `reference` or `trxref` - Payment reference

**Response:** Redirects to frontend with order ID

---

### Verify Payment Status

Manually verify payment status.

**Endpoint:** `GET /payments/verify/:reference`  
**Auth Required:** Yes

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "success": true,
    "reference": "PAY_abc123",
    "amount": 4.5,
    "status": "success",
    "currency": "GHS",
    "paidAt": "2026-01-29T12:01:00.000Z"
  }
}
```

---

### Hubnet Webhook

Endpoint for receiving Hubnet delivery status updates.

**Endpoint:** `POST /hubnet/webhook`  
**Auth Required:** No (verified by IP/signature)

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Webhook received"
}
```

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Meaning               | Usage                         |
| ---- | --------------------- | ----------------------------- |
| 200  | OK                    | Request successful            |
| 201  | Created               | Resource created successfully |
| 400  | Bad Request           | Invalid request data          |
| 401  | Unauthorized          | Missing or invalid token      |
| 403  | Forbidden             | Insufficient permissions      |
| 404  | Not Found             | Resource doesn't exist        |
| 409  | Conflict              | Resource already exists       |
| 422  | Unprocessable Entity  | Validation failed             |
| 500  | Internal Server Error | Server error                  |

### Common Error Codes

**Authentication Errors:**

```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "INVALID_CREDENTIALS"
}
```

```json
{
  "success": false,
  "message": "Token expired",
  "error": "TOKEN_EXPIRED"
}
```

```json
{
  "success": false,
  "message": "No token provided",
  "error": "NO_TOKEN"
}
```

**Authorization Errors:**

```json
{
  "success": false,
  "message": "Admin access required",
  "error": "FORBIDDEN"
}
```

**Validation Errors:**

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 6 characters"
  }
}
```

**Resource Errors:**

```json
{
  "success": false,
  "message": "Order not found",
  "error": "NOT_FOUND"
}
```

**Business Logic Errors:**

```json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "error": "INSUFFICIENT_BALANCE"
}
```

```json
{
  "success": false,
  "message": "Minimum withdrawal amount is GH₵10",
  "error": "MINIMUM_AMOUNT_NOT_MET"
}
```

---

## Quick Start Guide

### 1. User Registration & Authentication

```javascript
// Register
const response = await fetch("http://localhost:3000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    phone: "+233241234567",
    password: "SecurePass123!",
    role: "agent",
  }),
});

const { data } = await response.json();
const token = data.token; // Save this token

// Login
const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "SecurePass123!",
  }),
});
```

### 2. Using Authentication Token

All protected endpoints require the JWT token in the Authorization header:

```javascript
const response = await fetch("http://localhost:3000/api/bundles", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

### 3. Creating an Order (Customer Flow)

```javascript
// Customer visits agent's payment link and creates order
const orderResponse = await fetch("http://localhost:3000/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    paymentLinkCode: "A1B2C3D4", // Agent's code
    bundleId: "clx456def",
    phone: "0241234567",
    email: "customer@example.com",
  }),
});

const { data } = await orderResponse.json();
const paymentUrl = data.paymentUrl; // Redirect customer here
```

### 4. Checking Wallet Balance

```javascript
const walletResponse = await fetch("http://localhost:3000/api/wallet", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { data } = await walletResponse.json();
console.log("Balance:", data.balance);
```

### 5. Creating Withdrawal Request

```javascript
const withdrawalResponse = await fetch(
  "http://localhost:3000/api/withdrawals",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: 50.0,
      accountType: "mobile_money",
      accountNumber: "0241234567",
      accountName: "John Doe",
      mobileNetwork: "MTN",
    }),
  },
);
```

### 6. Admin Operations

```javascript
// Get dashboard stats
const statsResponse = await fetch("http://localhost:3000/api/admin/dashboard", {
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});

// Approve withdrawal
const approveResponse = await fetch(
  `http://localhost:3000/api/withdrawals/${withdrawalId}/approve`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
  },
);
```

---

## Payment Link Format

**Agent Payment Links:**

```
https://yourdomain.com/buy/{paymentLinkCode}
```

Example: `https://yourdomain.com/buy/A1B2C3D4`

When customer visits this link, your frontend should:

1. Extract `paymentLinkCode` from URL
2. Fetch available bundles
3. Let customer select bundle and enter phone
4. Create order using the API
5. Redirect to Paystack payment URL

---

## Supported Networks

- **MTN** - MTN Ghana
- **AIRTELTIGO** - AirtelTigo Ghana

_Note: Vodafone has been removed from the system_

---

## Environment Variables

Required in backend `.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dataguy"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Hubnet
HUBNET_API_KEY=your-hubnet-key
HUBNET_API_URL=https://hubnetapi.com/api
HUBNET_WEBHOOK_URL=https://yourdomain.com/api/hubnet/webhook

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## Testing Credentials

### Admin Account

```
Email: admin@dataguy.com
Password: Admin123!
```

### Test Payment Card (Paystack)

```
Card Number: 4084 0840 8408 4081
Expiry: 12/25
CVV: 408
Pin: 0000
```

---

## Notes for Frontend Development

1. **Token Storage**: Store JWT token in localStorage or httpOnly cookies
2. **Token Expiry**: Handle 401 errors and refresh/re-login
3. **Payment Flow**: Always redirect to `paymentUrl` from order creation response
4. **Order Status**: Poll or use webhooks for real-time order status updates
5. **Error Handling**: Always check `success` field in response
6. **Pagination**: Implement pagination for lists (orders, transactions, etc.)
7. **Admin Routes**: Protect admin pages with role check
8. **Phone Format**: Accept 10-digit format (0241234567), backend normalizes it
9. **Amount Display**: All amounts are in Ghana Cedis (GHS), show as "GH₵50.00"
10. **Withdrawal Limits**: Show minimum withdrawal of GH₵10.00 prominently

---

## Support

For questions or issues:

- Email: support@dataguy.com
- Documentation: https://docs.dataguy.com
- GitHub: https://github.com/dataguy/api

---

**Last Updated:** January 29, 2026  
**API Version:** 1.0.0
