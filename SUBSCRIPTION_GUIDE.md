# Subscription Management Guide

## Overview

The subscription system allows super admins to manage tenant subscriptions manually. When a tenant pays their monthly subscription, the super admin records the payment, and the system automatically extends the subscription expiry date.

## Super Admin Features

### 1. View All Client Admins

Get a list of all client admins with their shop counts and subscription status:

```bash
GET /api/super-admin/tenants
```

### 2. Record Subscription Payment

When a client admin makes a payment, record it to extend their subscription:

```bash
POST /api/super-admin/tenants/:clientId/payments
```

**Request Body:**
```json
{
  "amount": 99.99,
  "paymentMethod": "bank_transfer",
  "subscriptionPeriod": 1,
  "paymentDate": "2024-01-15",
  "receiptNumber": "REC-2024-001",
  "notes": "Verified in statement"
}
```

**How it works:**
- If tenant has an existing expiry date, `new expiry = existing expiry + subscription period`.
- If expired, `new expiry = today + subscription period`.
- Tenant is automatically active in `platform_db` metadata.

## Subscription Validation

The system automatically checks status before any client admin operation:

1. **Middleware Check**: All requests verify `subscriptionExpiresAt` in `platform_db`.
2. **Expired**: Operations are blocked with a `403 Forbidden` error.
3. **Active**: Request proceeds to the specific client database.

## Demo Period

New tenants receive an automatic **3-day demo period** upon creation. After this period, any operation will be blocked until a subscription payment is recorded.

