# Quick Start Guide

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A strong secret key
   - `PLATFORM_ADMIN_EMAIL` - Admin email (optional)
   - `PLATFORM_ADMIN_PASSWORD` - Admin password (optional)

3. **Start MongoDB**
   Ensure MongoDB is running on your system.

4. **Run Seed Script** (Optional but recommended)
   ```bash
   npm run seed
   ```
   This creates:
   - Platform super admin user
   - Default roles
   - Sample tenant (if `CREATE_SAMPLE_TENANT=true` in .env)

5. **Start Server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Creating Your First Tenant

### Option 1: Via API (Recommended)

1. **Login as Platform Admin**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@bookacut.com",
       "password": "ChangeThisPassword123!"
     }'
   ```

2. **Create Tenant** (You'll need to add this endpoint or use MongoDB directly)
   ```bash
   # Using MongoDB shell or Compass
   db.tenants.insertOne({
     name: "My Shop Owner",
     email: "owner@example.com",
     phone: "1234567890",
     isActive: true,
     subscriptionPlan: "premium",
     maxShops: 10
   })
   ```

3. **Create Client Admin User**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@myshop.com",
       "password": "password123",
       "phone": "1234567890",
       "firstName": "Shop",
       "lastName": "Owner",
       "tenantId": "YOUR_TENANT_ID"
     }'
   ```

### Option 2: Direct MongoDB Insert

```javascript
// In MongoDB shell or Compass
use bookacut

// Create Tenant
const tenant = db.tenants.insertOne({
  name: "My Shop Owner",
  email: "owner@example.com",
  phone: "1234567890",
  isActive: true,
  subscriptionPlan: "premium",
  maxShops: 10,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Create Roles for Tenant
const tenantId = tenant.insertedId

db.roles.insertMany([
  {
    tenantId: tenantId,
    name: "client_admin",
    permissions: [
      "manage_shops",
      "manage_staff",
      "manage_services",
      "view_dashboard",
      "manage_slots",
      "view_invoices",
      "manage_settings"
    ],
    isSystemRole: true
  },
  {
    tenantId: tenantId,
    name: "staff",
    permissions: [
      "view_bookings",
      "create_walkin",
      "edit_price",
      "mark_arrived",
      "mark_no_show",
      "complete_service",
      "generate_invoice"
    ],
    isSystemRole: true
  },
  {
    tenantId: tenantId,
    name: "customer",
    permissions: [
      "view_services",
      "view_slots",
      "book_slot",
      "view_booking_history",
      "cancel_booking"
    ],
    isSystemRole: true
  }
])

// Create Client Admin User (password will be hashed on first save)
// Note: You'll need to use the API to create users with proper password hashing
```

## Typical Workflow

1. **Client Admin Login**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@myshop.com",
       "password": "password123",
       "tenantId": "YOUR_TENANT_ID"
     }'
   ```

2. **Create Shop**
   ```bash
   curl -X POST http://localhost:3000/api/admin/shops \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Main Street Salon",
       "phone": "555-1234",
       "address": {
         "street": "123 Main St",
         "city": "New York",
         "state": "NY",
         "zipCode": "10001"
       },
       "slotDuration": 30
     }'
   ```

3. **Add Staff**
   ```bash
   curl -X POST http://localhost:3000/api/admin/shops/SHOP_ID/staff \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "staff@myshop.com",
       "password": "password123",
       "phone": "555-5678",
       "firstName": "John",
       "lastName": "Stylist"
     }'
   ```

4. **Create Service**
   ```bash
   curl -X POST http://localhost:3000/api/admin/shops/SHOP_ID/services \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Haircut",
       "description": "Standard haircut",
       "category": "haircut",
       "duration": 30,
       "price": 25
     }'
   ```

5. **Generate Slots**
   ```bash
   curl -X POST http://localhost:3000/api/admin/shops/SHOP_ID/slots/generate \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "startDate": "2024-01-01",
       "endDate": "2024-01-07"
     }'
   ```

6. **Customer Books Slot**
   ```bash
   curl -X POST http://localhost:3000/api/customer/shops/SHOP_ID/bookings \
     -H "Authorization: Bearer CUSTOMER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "slotId": "SLOT_ID",
       "serviceId": "SERVICE_ID"
     }'
   ```

## Testing with Postman/Insomnia

Import these sample requests:

1. **Login** - POST `/api/auth/login`
2. **Create Shop** - POST `/api/admin/shops`
3. **Add Staff** - POST `/api/admin/shops/:shopId/staff`
4. **Create Service** - POST `/api/admin/shops/:shopId/services`
5. **Generate Slots** - POST `/api/admin/shops/:shopId/slots/generate`
6. **Get Available Slots** - GET `/api/customer/shops/:shopId/slots`
7. **Book Slot** - POST `/api/customer/shops/:shopId/bookings`

## Socket.IO Testing

```javascript
// In browser console or Node.js
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.emit('join-shop', {
  tenantId: 'YOUR_TENANT_ID',
  shopId: 'YOUR_SHOP_ID'
});

socket.on('slot-updates', (data) => {
  console.log('Slots updated:', data);
});

socket.on('booking-updated', (data) => {
  console.log('Booking updated:', data);
});
```

## Common Issues

### MongoDB Connection Failed
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env`
- Check network connectivity

### JWT Token Invalid
- Verify `JWT_SECRET` is set
- Check token expiration
- Ensure token is sent in `Authorization: Bearer TOKEN` header

### Tenant Not Found
- Verify tenant exists in database
- Check tenantId in request
- Ensure tenant is active

### Slot Generation Failed
- Ensure shop has active staff
- Check working hours configuration
- Verify shop is active

## Next Steps

1. Set up your frontend application
2. Configure shop settings
3. Add more services
4. Customize working hours
5. Set up payment integration (if needed)

For detailed API documentation, see `README.md`.

