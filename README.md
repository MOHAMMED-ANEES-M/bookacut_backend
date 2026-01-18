# BookACut - Multi-Tenant SaaS Backend

A production-ready, multi-tenant SaaS backend for Beauty Parlour & Barber Shop Management Software built with Node.js, Express.js, and MongoDB.

## 🏗️ Architecture

### Multi-Tenant Architecture
- **Single MongoDB cluster** with tenant-based data isolation
- **Tenant ID (clientId)** on every model for logical data separation
- **Multi-shop support**: One client (shop owner) can manage multiple shops
- **Independent operations**: Each shop has independent staff, slots, bookings, and invoices

### Key Features
- ✅ Multi-tenant data isolation
- ✅ Multi-shop management per client
- ✅ Dynamic slot generation based on staff count
- ✅ Real-time slot updates via Socket.IO
- ✅ Auto no-show handling via cron jobs
- ✅ Role-based access control (RBAC)
- ✅ JWT authentication
- ✅ Online and walk-in booking support
- ✅ Price editing with audit trail
- ✅ Automatic invoice generation
- ✅ Comprehensive API endpoints

## 📋 Prerequisites

- Node.js (LTS version - 18.x or higher)
- MongoDB (4.4 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookacut
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/bookacut
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRE=7d
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

6. **Verify installation**
   ```bash
   curl http://localhost:3000/health
   ```

## 📁 Project Structure

```
src/
 ├── config/          # Configuration files
 │   ├── database.js
 │   └── constants.js
 ├── controllers/    # Request handlers
 │   ├── authController.js
 │   ├── clientAdminController.js
 │   ├── staffController.js
 │   └── customerController.js
 ├── models/          # Mongoose models
 │   ├── Tenant.js
 │   ├── Shop.js
 │   ├── User.js
 │   ├── StaffProfile.js
 │   ├── Role.js
 │   ├── Service.js
 │   ├── Slot.js
 │   ├── Booking.js
 │   ├── Invoice.js
 │   ├── ShopSettings.js
 │   └── Offer.js
 ├── routes/          # API routes
 │   ├── authRoutes.js
 │   ├── clientAdminRoutes.js
 │   ├── staffRoutes.js
 │   ├── customerRoutes.js
 │   └── index.js
 ├── middlewares/     # Express middlewares
 │   ├── auth.js
 │   ├── tenant.js
 │   ├── rbac.js
 │   ├── errorHandler.js
 │   └── validator.js
 ├── services/        # Business logic
 │   ├── slotService.js
 │   ├── bookingService.js
 │   ├── invoiceService.js
 │   └── cronService.js
 ├── sockets/         # Socket.IO handlers
 │   └── slotSocket.js
 ├── cron/            # Scheduled jobs
 │   └── jobs.js
 ├── utils/           # Utility functions
 │   ├── logger.js
 │   └── errors.js
 ├── app.js           # Express app configuration
 └── server.js        # Server entry point
```

## 🔐 User Roles & Permissions

### 1. Platform Super Admin
- Full system access
- Can manage all tenants

### 2. Client Admin (Shop Owner)
- Create and manage shops
- Add/manage staff per shop
- Configure shop settings
- View shop-wise dashboards
- Block/unblock slots
- Manage services
- View invoices and revenue

### 3. Staff
- View shop bookings
- Create walk-in customers
- Assign slots
- Edit booking price (if allowed)
- Mark arrived/no-show
- Complete services
- Generate invoices

### 4. Customer (Online)
- View services
- View available slots
- Book slots (up to 7 days ahead)
- View booking history
- Cancel bookings

### 5. Walk-in Customer
- Created by staff
- No authentication required
- High priority booking

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register customer
- `GET /api/auth/me` - Get current user

### Super Admin APIs (Platform Management)
- `GET /api/super-admin/dashboard` - Get platform dashboard stats
- `GET /api/super-admin/tenants` - Get all tenants with shop counts
- `GET /api/super-admin/tenants/:tenantId` - Get tenant details
- `POST /api/super-admin/tenants` - Create tenant with client admin credentials (3-day demo period)
- `PUT /api/super-admin/tenants/:tenantId` - Update tenant
- `POST /api/super-admin/tenants/:tenantId/admin` - Create client admin user for tenant
- `PUT /api/super-admin/tenants/:tenantId/admin/:userId/password` - Update client admin password
- `POST /api/super-admin/tenants/:tenantId/payments` - Record subscription payment
- `PUT /api/super-admin/tenants/:tenantId/subscription` - Update subscription expiry
- `GET /api/super-admin/tenants/:tenantId/payments` - Get payment history

### Client Admin APIs
- `POST /api/admin/shops` - Create shop
- `GET /api/admin/shops` - Get all shops
- `GET /api/admin/shops/:shopId` - Get shop details
- `PUT /api/admin/shops/:shopId` - Update shop
- `POST /api/admin/shops/:shopId/staff` - Add staff (with username/password)
- `GET /api/admin/shops/:shopId/staff` - Get shop staff
- `DELETE /api/admin/shops/:shopId/staff/:staffId` - Remove staff
- `PUT /api/admin/shops/:shopId/staff/:staffId/password` - Update staff password
- `PUT /api/admin/shops/:shopId/staff/:staffId/credentials` - Update staff credentials (email, password, etc.)
- `POST /api/admin/shops/:shopId/services` - Create service
- `GET /api/admin/shops/:shopId/services` - Get shop services
- `PUT /api/admin/shops/:shopId/settings` - Update shop settings
- `POST /api/admin/shops/:shopId/slots/generate` - Generate slots
- `POST /api/admin/shops/:shopId/slots/:slotId/block` - Block slot
- `POST /api/admin/shops/:shopId/slots/:slotId/unblock` - Unblock slot
- `PUT /api/admin/shops/:shopId/slots/:slotId/capacity` - Reduce slot capacity
- `GET /api/admin/shops/:shopId/dashboard` - Get dashboard stats
- `GET /api/admin/shops/:shopId/invoices` - Get shop invoices

### Staff APIs
- `GET /api/staff/shops/:shopId/bookings` - Get shop bookings
- `POST /api/staff/shops/:shopId/bookings/walkin` - Create walk-in booking
- `POST /api/staff/shops/:shopId/bookings/:bookingId/arrived` - Mark arrived
- `POST /api/staff/shops/:shopId/bookings/:bookingId/no-show` - Mark no-show
- `POST /api/staff/shops/:shopId/bookings/:bookingId/start` - Start service
- `POST /api/staff/shops/:shopId/bookings/:bookingId/complete` - Complete service
- `PUT /api/staff/shops/:shopId/bookings/:bookingId/price` - Edit price
- `POST /api/staff/shops/:shopId/bookings/:bookingId/invoice` - Generate invoice
- `POST /api/staff/shops/:shopId/invoices/:invoiceId/paid` - Mark invoice paid

### Customer APIs
- `GET /api/customer/shops/:shopId` - Get shop details
- `GET /api/customer/shops/:shopId/services` - Get shop services
- `GET /api/customer/shops/:shopId/slots` - Get available slots
- `POST /api/customer/shops/:shopId/bookings` - Book slot
- `GET /api/customer/bookings` - Get booking history
- `POST /api/customer/shops/:shopId/bookings/:bookingId/cancel` - Cancel booking

## 🔄 Booking Flow

1. **Online Booking**
   - Customer views available slots
   - Selects slot and service
   - Booking auto-confirmed (if enabled)
   - Customer must arrive within 5 minutes

2. **Walk-in Booking**
   - Staff creates walk-in customer
   - Assigns slot and service
   - Can edit price
   - High priority booking

3. **Service Completion**
   - Staff marks customer arrived
   - Starts service
   - Completes service
   - Invoice auto-generated

4. **No-Show Handling**
   - Auto-detected after 5 minutes
   - Slot capacity freed
   - Walk-in can replace no-show

## ⚙️ Slot Engine

### Dynamic Slot Generation
- Slots generated per shop per day
- Capacity = number of active staff
- Example: 2 staff = capacity of 2 bookings per slot

### Slot Management
- Admin can block any slot
- Admin can reduce capacity manually
- Capacity auto-updates when staff changes
- Real-time updates via Socket.IO

## 🔔 Real-time Updates (Socket.IO)

### Client Connection
```javascript
const socket = io('http://localhost:3000');

// Join shop room
socket.emit('join-shop', { tenantId: '...', shopId: '...' });

// Listen for slot updates
socket.on('slot-updates', (data) => {
  console.log('Slots updated:', data.slots);
});

// Listen for booking updates
socket.on('booking-updated', (data) => {
  console.log('Booking updated:', data.booking);
});
```

## ⏰ Cron Jobs

1. **No-Show Handler** (Every minute)
   - Checks for bookings past scheduled time + timeout
   - Marks as no-show automatically

2. **Slot Generation** (Daily at 2 AM)
   - Generates slots for upcoming booking advance period

3. **Slot Capacity Update** (Every hour)
   - Updates slot capacities based on current staff count

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Tenant isolation on all queries
- Role-based access control (RBAC)
- Input validation with express-validator
- Rate limiting
- Helmet.js for security headers
- CORS configuration

## 📊 Database Models

### Core Models
- **Tenant**: Client/Shop Owner (with subscription management)
- **Shop**: Individual shop locations
- **User**: All users (admin, staff, customers)
- **StaffProfile**: Staff-shop relationships
- **Role**: RBAC roles and permissions
- **Service**: Services offered
- **Slot**: Time slots for bookings
- **Booking**: Customer bookings (with start/finish time tracking)
- **Invoice**: Generated invoices
- **ShopSettings**: Shop configuration
- **Offer**: Promotional offers (optional)
- **SubscriptionPayment**: Subscription payment history

## 💳 Subscription Management

### Features
- **Monthly Subscription**: Tenants pay monthly subscription fees
- **Manual Payment Recording**: Super admin records payments when received (no payment gateway)
- **Automatic Expiry Extension**: Expiry date extends based on payment period
- **Subscription Validation**: Middleware checks subscription status before operations
- **Payment History**: Track all subscription payments with receipts
- **Expiry Notifications**: Cron job checks for expiring subscriptions

### Super Admin Workflow
1. View all tenants with shop counts and subscription status
2. When tenant makes payment, record it via API
3. System automatically extends subscription expiry date
4. View payment history for each tenant
5. Manually update expiry if needed

### Subscription Payment Recording
```bash
curl -X POST http://localhost:3000/api/super-admin/tenants/TENANT_ID/payments \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.99,
    "currency": "USD",
    "paymentMethod": "bank_transfer",
    "subscriptionPeriod": 1,
    "paymentDate": "2024-01-15",
    "receiptNumber": "REC-001",
    "notes": "Payment received via bank transfer"
  }'
```

## ⏱️ Service Time Tracking

### Features
- **Start Time**: Recorded when service starts (`startedAt`)
- **Finish Time**: Recorded when service completes (`finishedAt`)
- **Duration Calculation**: Can calculate actual service duration
- **Performance Metrics**: Track service completion times

### Booking Time Fields
- `scheduledAt`: Original scheduled time
- `arrivedAt`: Customer arrival time
- `startedAt`: Service start time
- `completedAt`: Service completion time
- `finishedAt`: Service finish time (same as completedAt, for clarity)

## 🧪 Testing the API

### 1. Register a Customer
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123",
    "phone": "1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "tenantId": "YOUR_TENANT_ID"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

### 3. Get Available Slots
```bash
curl -X GET "http://localhost:3000/api/customer/shops/SHOP_ID/slots?startDate=2024-01-01&endDate=2024-01-07" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛠️ Development

### Environment Variables
See `.env.example` for all available configuration options.

### Code Style
- Follow ES6+ JavaScript conventions
- Use async/await for asynchronous operations
- Proper error handling throughout
- Comprehensive comments

### Adding New Features
1. Create model in `src/models/`
2. Create service in `src/services/`
3. Create controller in `src/controllers/`
4. Add routes in `src/routes/`
5. Update middleware if needed

## 📝 Notes

- **Tenant Creation:** Platform super admin creates tenants and sets client admin credentials
- **Multi-Domain:** Each client admin can deploy frontend on their own domain
- **Demo Period:** New tenants get 3-day demo period automatically
- All API endpoints require tenant context (except platform admin)
- Slot capacity dynamically adjusts based on active staff count
- Bookings can be made up to 7 days in advance (configurable)
- No-show timeout is 5 minutes (configurable per shop)
- Price editing can be enabled/disabled per shop
- Maximum discount percentage can be configured per shop
- Subscription expiry is checked before allowing tenant operations
- Service start and finish times are tracked for performance metrics
- No payment gateway integration - payments are recorded manually by super admin
- Super admin can view all tenant details, shops, and expiry dates

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

### JWT Token Issues
- Check `JWT_SECRET` is set
- Verify token expiration time
- Ensure token is sent in Authorization header

### Slot Generation Issues
- Verify shop has active staff
- Check working hours configuration
- Ensure shop is active

## 📄 License

ISC

## 👥 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ for Beauty Parlour & Barber Shop Management**

