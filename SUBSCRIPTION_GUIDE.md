# Subscription Management Guide

## Overview

The subscription system allows super admins to manage tenant subscriptions manually. When a tenant pays their monthly subscription, the super admin records the payment, and the system automatically extends the subscription expiry date.

## Super Admin Features

### 1. View All Tenants

Get a list of all tenants with their shop counts and subscription status:

```bash
GET /api/super-admin/tenants
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by name or email
- `status` - Filter by active/inactive

**Response:**
```json
{
  "success": true,
  "tenants": [
    {
      "_id": "...",
      "name": "ABC Salon",
      "email": "admin@abcsalon.com",
      "shopCount": 3,
      "totalShops": 3,
      "isSubscriptionActive": true,
      "daysUntilExpiry": 15,
      "subscriptionPlan": "premium",
      "subscriptionExpiresAt": "2024-02-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 2. View Tenant Details

Get detailed information about a specific tenant:

```bash
GET /api/super-admin/tenants/:tenantId
```

**Response includes:**
- Tenant information
- Active and total shop counts
- Subscription status
- Days until expiry
- Admin user details
- Recent payment history

### 3. Record Subscription Payment

When a tenant makes a payment, record it to extend their subscription:

```bash
POST /api/super-admin/tenants/:tenantId/payments
```

**Request Body:**
```json
{
  "amount": 99.99,
  "currency": "USD",
  "paymentMethod": "bank_transfer",
  "subscriptionPeriod": 1,
  "paymentDate": "2024-01-15",
  "receiptNumber": "REC-2024-001",
  "notes": "Payment received via bank transfer"
}
```

**Payment Methods:**
- `cash`
- `bank_transfer`
- `check`
- `other`

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded and subscription updated",
  "payment": {
    "_id": "...",
    "amount": 99.99,
    "subscriptionExpiresAt": "2024-02-15T00:00:00.000Z"
  },
  "tenant": {
    "subscriptionExpiresAt": "2024-02-15T00:00:00.000Z"
  }
}
```

**How it works:**
- If tenant has existing expiry date, new expiry = existing expiry + subscription period
- If no expiry date, new expiry = today + subscription period
- Payment is recorded in history
- Tenant subscription is automatically updated

### 4. Manually Update Subscription Expiry

Update subscription expiry date directly (for adjustments):

```bash
PUT /api/super-admin/tenants/:tenantId/subscription
```

**Request Body:**
```json
{
  "subscriptionExpiresAt": "2024-03-15",
  "subscriptionPlan": "premium",
  "notes": "Extended for promotional period"
}
```

### 5. View Payment History

Get payment history for a tenant:

```bash
GET /api/super-admin/tenants/:tenantId/payments
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### 6. Dashboard Statistics

Get platform-wide statistics:

```bash
GET /api/super-admin/dashboard
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalTenants": 50,
    "activeTenants": 45,
    "expiredTenants": 5,
    "totalShops": 120,
    "expiringSoon": 3,
    "recentRevenue": 4995.00,
    "recentPaymentsCount": 12
  }
}
```

## Workflow Example

### Scenario: Tenant pays monthly subscription

1. **Tenant contacts you** saying they've paid $99.99 via bank transfer
2. **Verify payment** in your bank account
3. **Record the payment:**
   ```bash
   POST /api/super-admin/tenants/TENANT_ID/payments
   {
     "amount": 99.99,
     "paymentMethod": "bank_transfer",
     "subscriptionPeriod": 1,
     "receiptNumber": "BT-2024-001",
     "notes": "Verified in bank statement"
   }
   ```
4. **System automatically:**
   - Extends subscription expiry by 1 month
   - Records payment in history
   - Tenant can continue using the system

### Scenario: Multiple months payment

If tenant pays for 3 months:

```json
{
  "amount": 299.97,
  "subscriptionPeriod": 3,
  "notes": "Quarterly payment"
}
```

System extends expiry by 3 months from current expiry date.

## Subscription Validation

The system automatically checks subscription status:

- **Active Subscription**: Tenant can use all features
- **Expired Subscription**: Tenant operations are blocked
- **Expiring Soon**: Cron job logs warnings (7 days before expiry)

### Middleware Protection

All client admin routes are protected by subscription validation middleware. If subscription is expired, operations will be blocked with an error message.

## Cron Jobs

### Daily Subscription Check (3 AM)

Runs daily to check for:
- Expired subscriptions
- Subscriptions expiring soon (within 7 days)

Logs warnings for super admin to follow up.

## Best Practices

1. **Always verify payment** before recording
2. **Use receipt numbers** for tracking
3. **Add notes** for any special circumstances
4. **Check dashboard regularly** for expiring subscriptions
5. **Follow up** with tenants before expiry

## Payment Receipt Number Format

Recommended format: `TYPE-YEAR-NUMBER`

Examples:
- `BT-2024-001` (Bank Transfer)
- `CH-2024-001` (Check)
- `CS-2024-001` (Cash)

## Subscription Plans

Available plans:
- `basic` - Basic features
- `premium` - Premium features
- `enterprise` - Enterprise features

Plan can be updated when recording payment or manually.

## Troubleshooting

### Tenant says they paid but subscription expired

1. Check payment history: `GET /api/super-admin/tenants/:tenantId/payments`
2. If payment not recorded, record it now
3. If payment was recorded, check expiry date
4. Manually extend if needed

### Need to extend subscription without payment

Use manual update endpoint:
```bash
PUT /api/super-admin/tenants/:tenantId/subscription
{
  "subscriptionExpiresAt": "2024-12-31",
  "notes": "Promotional extension"
}
```

### Payment recorded but expiry not updated

Check:
1. Payment was successfully created
2. Tenant subscription was updated
3. Check logs for errors

If issue persists, manually update expiry date.

