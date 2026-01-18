# Tenant Management Guide

## Overview

Platform super admin creates tenants and sets client admin credentials. Each client admin can deploy their software on their own domain. Super admin manages all tenant details, shops, and subscription expiry.

## Workflow

### 1. Super Admin Creates Tenant

Super admin creates a new tenant with client admin credentials:

```bash
POST /api/super-admin/tenants
```

**Request Body:**
```json
{
  "name": "ABC Beauty Salon Group",
  "email": "contact@abcsalon.com",
  "phone": "1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "subscriptionPlan": "premium",
  "maxShops": 10,
  "adminEmail": "admin@abcsalon.com",
  "adminPassword": "SecurePassword123!",
  "adminFirstName": "John",
  "adminLastName": "Doe",
  "adminPhone": "1234567890"
}
```

**Required Fields:**
- `name` - Company/tenant name
- `email` - Tenant contact email
- `phone` - Tenant phone number
- `adminEmail` - Client admin email (username)
- `adminPassword` - Client admin password (min 6 characters)
- `adminFirstName` - Client admin first name
- `adminLastName` - Client admin last name

**Optional Fields:**
- `address` - Tenant address
- `subscriptionPlan` - Plan type (basic/premium/enterprise)
- `maxShops` - Maximum shops allowed (default: 3 during demo)
- `adminPhone` - Client admin phone (uses tenant phone if not provided)

**Response:**
```json
{
  "success": true,
  "message": "Tenant and client admin created successfully with 3-day demo period",
  "tenant": {
    "_id": "...",
    "name": "ABC Beauty Salon Group",
    "email": "contact@abcsalon.com",
    "subscriptionExpiresAt": "2024-01-18T00:00:00.000Z",
    "daysUntilExpiry": 3,
    "subscriptionPlan": "premium",
    "maxShops": 10
  },
  "adminUser": {
    "id": "...",
    "email": "admin@abcsalon.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890"
  }
}
```

### 2. Demo Period

- **Duration:** 3 days from tenant creation
- **Features:** Full access to all features
- **Limitations:** 
  - Max shops: 3 (or specified maxShops)
  - Basic plan features (unless premium/enterprise specified)
- **Expiry:** After 3 days, access is blocked until payment

### 3. Client Admin Login

Client admin logs in with credentials set by super admin:

```bash
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@abcsalon.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "...",
    "email": "admin@abcsalon.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "client_admin",
    "tenantId": "...",
    "permissions": [...]
  }
}
```

### 4. Client Admin Deploys on Own Domain

Each client admin can:
- Deploy the frontend on their own domain
- Use their own branding
- Customize the software for their business
- All data remains isolated per tenant

### 5. Super Admin Views All Tenants

Super admin can view all tenants with complete details:

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
      "name": "ABC Beauty Salon Group",
      "email": "contact@abcsalon.com",
      "phone": "1234567890",
      "shopCount": 5,
      "totalShops": 5,
      "isSubscriptionActive": true,
      "isExpired": false,
      "isDemoPeriod": true,
      "daysUntilExpiry": 2,
      "subscriptionStartDate": "2024-01-15T00:00:00.000Z",
      "subscriptionExpiryDate": "2024-01-18T00:00:00.000Z",
      "subscriptionPlan": "premium",
      "maxShops": 10,
      "adminUser": {
        "email": "admin@abcsalon.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "1234567890",
        "lastLogin": "2024-01-16T10:00:00.000Z",
        "createdAt": "2024-01-15T00:00:00.000Z"
      }
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

### 6. Super Admin Views Tenant Details

Get complete information about a specific tenant:

```bash
GET /api/super-admin/tenants/:tenantId
```

**Response includes:**
- Complete tenant information
- Active and total shop counts
- Subscription status and expiry details
- Admin user details (email, name, phone, last login)
- Recent payment history
- Demo period status

### 7. Payment Recording

When client admin pays, super admin records payment:

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
  "paymentDate": "2024-01-17",
  "receiptNumber": "REC-2024-001",
  "notes": "Monthly subscription payment"
}
```

**What happens:**
- Payment is recorded in history
- Subscription expiry extends automatically
- If expired: new expiry = today + period
- If active: new expiry = current expiry + period

**Example:**
- Current expiry: Jan 18, 2024
- Payment period: 1 month
- New expiry: Feb 18, 2024

## Additional Client Admin Management

### Create Additional Client Admin

Super admin can create additional client admin users for a tenant:

```bash
POST /api/super-admin/tenants/:tenantId/admin
```

**Request Body:**
```json
{
  "email": "manager@abcsalon.com",
  "password": "ManagerPass123!",
  "firstName": "Jane",
  "lastName": "Manager",
  "phone": "9876543210"
}
```

### Update Client Admin Password

Super admin can update client admin password:

```bash
PUT /api/super-admin/tenants/:tenantId/admin/:userId/password
```

**Request Body:**
```json
{
  "password": "NewSecurePassword123!"
}
```

## Multi-Domain Deployment

### Architecture

Each tenant (client admin) can deploy their own frontend:

```
Platform Backend (bookacut.com/api)
    ├── Tenant 1 (abcsalon.com) → Uses bookacut.com/api
    ├── Tenant 2 (xyzsalon.com) → Uses bookacut.com/api
    └── Tenant 3 (beautysalon.com) → Uses bookacut.com/api
```

### Frontend Configuration

Each client admin's frontend should:

1. **Set API Base URL:**
   ```javascript
   const API_BASE_URL = 'https://bookacut.com/api';
   ```

2. **Include Tenant Context:**
   - All API calls include tenantId automatically (from JWT)
   - Frontend doesn't need to manage tenantId

3. **Custom Branding:**
   - Each domain can have custom branding
   - Logo, colors, name can be tenant-specific
   - Data remains isolated

### Security

- All API calls require JWT authentication
- Tenant isolation enforced at backend level
- Client admin can only access their own tenant data
- Super admin can access all tenants

## Subscription Management

### Demo Period Features

- **Duration:** 3 days
- **Full Access:** All features available
- **Shop Limit:** 3 shops (configurable)
- **Auto-Expiry:** Blocks access after 3 days

### After Demo Expires

- Client admin operations blocked
- Super admin must record payment
- System shows expiry status
- Payment extends expiry automatically

### Subscription Plans

- **Basic:** Standard features
- **Premium:** Advanced features
- **Enterprise:** Full features + custom limits

## Best Practices

1. **Tenant Creation:**
   - Use professional email addresses
   - Set strong passwords (min 6 chars)
   - Provide complete information
   - Set appropriate maxShops limit

2. **Password Management:**
   - Use strong, unique passwords
   - Don't share passwords via insecure channels
   - Update passwords periodically
   - Super admin controls all passwords

3. **Payment Recording:**
   - Verify payment before recording
   - Use receipt numbers for tracking
   - Keep payment history for audit
   - Extend expiry appropriately

4. **Multi-Domain:**
   - Each tenant uses same API
   - Frontend can be customized per domain
   - Data isolation maintained automatically
   - Super admin manages all from one place

## Error Handling

### Tenant Already Exists
```json
{
  "success": false,
  "error": "Tenant with this email already exists"
}
```

### User Already Exists
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

### Missing Required Fields
```json
{
  "success": false,
  "error": "Tenant name, email, and phone are required"
}
```

## Summary

1. **Super Admin** creates tenant with client admin credentials
2. **Client Admin** receives credentials and logs in
3. **Client Admin** deploys frontend on their own domain
4. **Super Admin** views all tenants, shops, and expiry dates
5. **Client Admin** pays subscription
6. **Super Admin** records payment and extends expiry
7. **System** automatically manages subscription status

All tenant data is isolated, and each client admin can have their own domain while using the same backend API.

