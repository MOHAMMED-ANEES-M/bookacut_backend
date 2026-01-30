# Client Admin Management Guide

## Overview

Platform super admin creates client admins, and the system automatically creates a dedicated database for each client. Each client admin can deploy their software on their own domain. Super admin manages all client admin details, shops (via queries), and subscription expiry.

## Architecture

### Database Structure

- **Platform Database (`platform_db`)**: 
  - Platform super admin users
  - Client admin metadata and subscription info
  - Client ID to database name mapping
  
- **Client Databases (`client_*_db`)**:
  - Each client gets a unique database (e.g., `client_a1b2c3d4_db`)
  - All client data stored here (shops, users, bookings, invoices, etc.)
  - Complete data isolation from other clients

## Workflow

### 1. Super Admin Creates Client Admin

Super admin creates a new client admin with credentials. The system automatically:
- Creates client admin record in `platform_db`
- Creates a new client database
- Initializes the database with default roles
- Creates client admin user in the client database

```bash
POST /api/super-admin/tenants
```

**Request Body:**
```json
{
  "email": "admin@abcsalon.com",
  "phone": "1234567890",
  "adminPassword": "SecurePassword123!",
  "adminFirstName": "John",
  "adminLastName": "Doe",
  "subscriptionPlan": "premium",
  "maxShops": 10,
  "maxStaff": 50
}
```

**Required Fields:**
- `email` - Client admin email (unique identifier)
- `phone` - Phone number
- `adminPassword` - Client admin password (min 6 characters)
- `adminFirstName` - Client admin first name
- `adminLastName` - Client admin last name

**Response:**
```json
{
  "success": true,
  "message": "Client admin and database created successfully with 3-day demo period",
  "client": {
    "clientId": "64fa2c9e...",
    "databaseName": "client_a1b2c3d4_db",
    "email": "admin@abcsalon.com",
    "subscriptionExpiresAt": "2024-01-18T00:00:00.000Z",
    "daysUntilExpiry": 3
  }
}
```

### 2. Demo Period

- **Duration:** 3 days from creation.
- **Expiry:** After 3 days, access is blocked unless a subscription is recorded.

### 3. Client Admin Login

```bash
POST /api/auth/login
```

**Important:** The JWT token includes `databaseName` which routes requests to the correct client database.

### 4. Subscription Management

When a client admin pays, the super admin records it:

```bash
POST /api/super-admin/tenants/:clientId/payments
```

**Request Body:**
```json
{
  "amount": 99.99,
  "paymentMethod": "bank_transfer",
  "subscriptionPeriod": 1,
  "receiptNumber": "REC-2024-001"
}
```

## Multi-Domain Deployment

Each client admin can:
- Deploy their own frontend on a unique domain.
- Point to the central backend API.
- Use the `databaseName` context for all operations.
