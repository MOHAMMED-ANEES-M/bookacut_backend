# User Management Guide

## Overview

This guide explains how to manage user credentials in the BookACut system:
- **Super Admin** sets credentials for **Client Admins**
- **Client Admin** sets credentials for **Staff**

## Super Admin → Client Admin

### Creating Tenant with Client Admin

When creating a new tenant, you can optionally create the client admin user at the same time:

```bash
POST /api/super-admin/tenants
```

**Request Body:**
```json
{
  "name": "ABC Salon Group",
  "email": "contact@abcsalon.com",
  "phone": "1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY"
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

**Response:**
```json
{
  "success": true,
  "tenant": { ... },
  "adminUser": {
    "id": "...",
    "email": "admin@abcsalon.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Tenant and client admin user created successfully"
}
```

### Creating Client Admin Separately

If you didn't create the admin user during tenant creation, create it separately:

```bash
POST /api/super-admin/tenants/:tenantId/admin
```

**Request Body:**
```json
{
  "email": "admin@abcsalon.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890"
}
```

**Required Fields:**
- `email` - Client admin email (must be unique)
- `password` - Password (min 6 characters)
- `firstName` - First name
- `lastName` - Last name
- `phone` - Phone number (optional, uses tenant phone if not provided)

### Updating Client Admin Password

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

## Client Admin → Staff

### Adding Staff with Credentials

When adding staff to a shop, client admin sets their username (email) and password:

```bash
POST /api/admin/shops/:shopId/staff
```

**Request Body:**
```json
{
  "email": "staff@abcsalon.com",
  "password": "StaffPassword123!",
  "phone": "9876543210",
  "firstName": "Jane",
  "lastName": "Stylist",
  "specialization": ["haircut", "coloring"],
  "hourlyRate": 25,
  "commissionRate": 10
}
```

**Required Fields:**
- `email` - Staff email/username (must be unique within tenant)
- `password` - Password (min 6 characters)
- `phone` - Phone number
- `firstName` - First name
- `lastName` - Last name

**Optional Fields:**
- `specialization` - Array of specializations
- `hourlyRate` - Hourly rate
- `commissionRate` - Commission percentage

### Updating Staff Password

Client admin can update staff password:

```bash
PUT /api/admin/shops/:shopId/staff/:staffId/password
```

**Request Body:**
```json
{
  "password": "NewStaffPassword123!"
}
```

### Updating Staff Credentials

Client admin can update multiple staff credentials at once:

```bash
PUT /api/admin/shops/:shopId/staff/:staffId/credentials
```

**Request Body:**
```json
{
  "email": "newemail@abcsalon.com",
  "password": "NewPassword123!",
  "phone": "9876543210",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Note:** All fields are optional. Only include fields you want to update.

## Workflow Examples

### Example 1: Complete Tenant Setup

1. **Super Admin creates tenant with admin:**
   ```bash
   POST /api/super-admin/tenants
   {
     "name": "Beauty Salon",
     "email": "contact@beautysalon.com",
     "phone": "555-1234",
     "adminEmail": "admin@beautysalon.com",
     "adminPassword": "AdminPass123!",
     "adminFirstName": "Sarah",
     "adminLastName": "Manager"
   }
   ```

2. **Client Admin logs in:**
   ```bash
   POST /api/auth/login
   {
     "email": "admin@beautysalon.com",
     "password": "AdminPass123!"
   }
   ```

3. **Client Admin creates shop:**
   ```bash
   POST /api/admin/shops
   {
     "name": "Main Street Location",
     "phone": "555-5678"
   }
   ```

4. **Client Admin adds staff:**
   ```bash
   POST /api/admin/shops/SHOP_ID/staff
   {
     "email": "stylist1@beautysalon.com",
     "password": "StaffPass123!",
     "phone": "555-9999",
     "firstName": "Mike",
     "lastName": "Stylist"
   }
   ```

### Example 2: Password Reset Flow

**Super Admin resets client admin password:**
```bash
PUT /api/super-admin/tenants/TENANT_ID/admin/USER_ID/password
{
  "password": "NewAdminPassword123!"
}
```

**Client Admin resets staff password:**
```bash
PUT /api/admin/shops/SHOP_ID/staff/STAFF_ID/password
{
  "password": "NewStaffPassword123!"
}
```

## Security Best Practices

1. **Strong Passwords:**
   - Minimum 6 characters (enforced)
   - Use mix of uppercase, lowercase, numbers, and symbols
   - Don't reuse passwords

2. **Email as Username:**
   - Email serves as username for login
   - Must be unique within tenant
   - Use professional email addresses

3. **Password Management:**
   - Super admin controls client admin passwords
   - Client admin controls staff passwords
   - Users can't change their own passwords (can be added if needed)

4. **Access Control:**
   - Super admin can only manage client admins
   - Client admin can only manage their own staff
   - Staff cannot manage other users

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Staff password updated successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Password must be at least 6 characters"
}
```

## Common Errors

1. **Email Already Exists:**
   - Error: "User with this email already exists"
   - Solution: Use a different email address

2. **Weak Password:**
   - Error: "Password must be at least 6 characters"
   - Solution: Use a stronger password

3. **User Not Found:**
   - Error: "Client admin user not found" or "Staff not found"
   - Solution: Verify the user ID and tenant/shop IDs

4. **Unauthorized:**
   - Error: "Access denied"
   - Solution: Ensure you're logged in with correct role

## Notes

- Passwords are automatically hashed using bcrypt
- Email addresses are normalized (lowercase)
- User accounts are tenant-scoped (email can be reused across tenants)
- Staff can be assigned to multiple shops (same user, different StaffProfile)
- Inactive staff can be reactivated (preserves user account)

