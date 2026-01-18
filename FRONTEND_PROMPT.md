# Frontend Development Prompt - BookACut MERN Stack

## Project Overview

Build a complete, production-ready **MERN Stack (MongoDB, Express, React, Node.js)** frontend application for a **Multi-Tenant SaaS Beauty Parlour & Barber Shop Management System**. The backend API is already built and running. Create a modern, responsive frontend that integrates with all backend APIs.

## Backend API Base URL

```
http://localhost:3000/api
```

All API endpoints are documented in the backend README.md. The backend includes:
- Multi-tenant architecture with tenant isolation
- JWT authentication
- Role-based access control (RBAC)
- Real-time Socket.IO for slot updates
- Subscription management with 3-day demo period
- Dynamic slot generation based on staff count

## Tech Stack Requirements

### Frontend
- **React 18+** with functional components and hooks
- **React Router v6** for navigation
- **Axios** for API calls
- **Socket.IO Client** for real-time updates
- **Tailwind CSS** for styling (modern, responsive design)
- **React Hook Form** for form handling
- **React Query (TanStack Query)** for data fetching and caching
- **Zustand** or **Context API** for state management
- **Date-fns** or **Moment.js** for date handling
- **React Toastify** for notifications
- **Recharts** or **Chart.js** for dashboard charts

### Project Structure
```
frontend/
├── public/
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/         # Buttons, Inputs, Modals, etc.
│   │   ├── layout/         # Header, Sidebar, Footer, etc.
│   │   └── features/       # Feature-specific components
│   ├── pages/              # Page components
│   │   ├── auth/           # Login, Register
│   │   ├── super-admin/    # Super admin pages
│   │   ├── client-admin/   # Client admin pages
│   │   ├── staff/          # Staff pages
│   │   └── customer/       # Customer pages
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service functions
│   ├── store/              # State management (Zustand/Context)
│   ├── utils/              # Utility functions
│   ├── constants/          # Constants and config
│   ├── contexts/           # React contexts
│   ├── App.jsx             # Main app component
│   └── index.jsx           # Entry point
├── package.json
└── README.md
```

## User Roles & Access

### 1. Platform Super Admin
- **Dashboard:** View all tenants, shop counts, subscription status, expiry dates
- **Tenant Management:** Create tenants, view details, update subscription expiry
- **Payment Management:** Record payments, view payment history
- **Analytics:** Platform-wide statistics and revenue

### 2. Client Admin (Shop Owner)
- **Dashboard:** Shop-wise statistics, bookings overview
- **Shop Management:** Create/edit shops, configure working hours, slot duration
- **Staff Management:** Add staff, set credentials, manage staff profiles
- **Service Management:** Create/edit services, set prices
- **Slot Management:** Generate slots, block/unblock slots, adjust capacity
- **Settings:** Configure shop settings (price editing, discounts, etc.)
- **Invoices:** View shop invoices and revenue

### 3. Staff
- **Bookings View:** See all bookings for assigned shop
- **Walk-in Booking:** Create walk-in customers
- **Service Management:** Mark arrived, start service, complete service
- **Price Editing:** Edit booking prices (if allowed)
- **Invoice Generation:** Generate and mark invoices as paid

### 4. Customer (Online)
- **Service Listing:** View available services
- **Slot Booking:** View available slots, book appointments
- **Booking History:** View past and upcoming bookings
- **Booking Management:** Cancel bookings

## Core Features to Implement

### Authentication & Authorization
- Login page with email/password
- JWT token management (store in localStorage/secure cookie)
- Protected routes based on user role
- Auto-logout on token expiry
- Role-based navigation menu
- User profile display

### Super Admin Features

#### Dashboard
- Platform statistics cards:
  - Total tenants
  - Active tenants
  - Expired tenants
  - Total shops
  - Expiring soon (7 days)
  - Recent revenue
- Tenant list table with:
  - Tenant name, email, phone
  - Shop count (active/total)
  - Subscription status (active/expired/demo)
  - Days until expiry
  - Admin user details
  - Quick actions (view, edit, record payment)
- Charts:
  - Revenue trend (last 30 days)
  - Tenant growth chart
  - Subscription status distribution

#### Tenant Management
- **Create Tenant Form:**
  - Tenant details (name, email, phone, address)
  - Client admin credentials (email, password, name, phone)
  - Subscription plan selection
  - Max shops limit
- **Tenant List:** Searchable, filterable table
- **Tenant Details Page:**
  - Complete tenant information
  - Admin user details
  - Shop list
  - Subscription timeline
  - Payment history
  - Actions: Update tenant, record payment, extend expiry

#### Payment Management
- **Record Payment Form:**
  - Amount, currency
  - Payment method (cash, bank_transfer, check, other)
  - Subscription period (months)
  - Receipt number
  - Notes
- **Payment History:** Table with filters (date range, status)

### Client Admin Features

#### Dashboard
- Shop selection dropdown (if multiple shops)
- Statistics cards:
  - Today's bookings
  - Pending bookings
  - Active staff count
  - Monthly revenue
- Upcoming bookings calendar view
- Recent activity feed

#### Shop Management
- **Shop List:** All shops with status
- **Create/Edit Shop Form:**
  - Basic info (name, address, phone, email)
  - Working hours (per day: start, end, isOpen)
  - Slot duration
  - Shop status
- **Shop Details:** Full shop information with edit capability

#### Staff Management
- **Staff List:** All staff for selected shop
- **Add Staff Form:**
  - Email (username)
  - Password
  - Personal info (name, phone)
  - Specialization (multi-select)
  - Hourly rate, commission rate
- **Edit Staff:** Update credentials, specialization, rates
- **Remove Staff:** Deactivate staff (with confirmation)

#### Service Management
- **Service List:** All services with category, duration, price
- **Create/Edit Service Form:**
  - Name, description
  - Category (haircut, facial, massage, etc.)
  - Duration (minutes)
  - Price
  - Active status

#### Slot Management
- **Slot Calendar View:** Monthly/weekly calendar showing slots
- **Generate Slots:** Date range picker, generate button
- **Slot Actions:**
  - Block slot (with reason)
  - Unblock slot
  - Reduce capacity
  - View slot details (bookings, capacity)
- **Real-time Updates:** Slots update automatically via Socket.IO

#### Settings
- **Shop Settings Form:**
  - Allow price editing (toggle)
  - Max discount percentage
  - Auto-confirm booking
  - No-show timeout minutes
  - Booking advance days
  - Tax rate
  - Currency

#### Invoices
- **Invoice List:** Filterable by date, status
- **Invoice Details:** Full invoice view with payment status

### Staff Features

#### Bookings Dashboard
- **Today's Bookings:** List view with status filters
- **Booking Cards:** Show customer, service, time, status
- **Quick Actions:** Mark arrived, start service, complete, no-show

#### Walk-in Booking
- **Create Walk-in Form:**
  - Customer details (name, phone, email)
  - Service selection
  - Slot selection
  - Price (editable if allowed)
- **Customer Search:** Search existing customers

#### Service Management
- **Booking Actions:**
  - Mark arrived (with timestamp)
  - Start service (with timestamp)
  - Complete service (auto-generates invoice)
  - Mark no-show
- **Price Editing:** Edit booking price (if allowed, with reason)

#### Invoice Management
- **Generate Invoice:** From completed booking
- **Mark Paid:** Update payment method and status

### Customer Features

#### Service Listing
- **Service Cards:** Display services with price, duration, category
- **Filter/Sort:** By category, price range

#### Slot Booking
- **Date Picker:** Select date (up to 7 days ahead)
- **Time Slots:** Grid view showing available slots
- **Slot Status:** Visual indicators (available, full, blocked)
- **Booking Form:**
  - Service selection
  - Slot selection
  - Confirmation

#### Booking History
- **Booking List:** Past and upcoming bookings
- **Booking Details:** Full booking information
- **Cancel Booking:** With reason (if allowed)

## Real-time Features (Socket.IO)

### Implementation
- Connect to Socket.IO server on app load
- Join shop room when viewing shop-specific data
- Listen for events:
  - `slot-updates`: Real-time slot availability changes
  - `booking-updated`: Booking status changes
- Update UI automatically when events received
- Show notification for important updates

### Use Cases
- Slot availability updates when bookings are made
- Booking status changes (arrived, in-progress, completed)
- Slot capacity changes when staff added/removed

## UI/UX Requirements

### Design Principles
- **Modern & Clean:** Professional appearance
- **Responsive:** Mobile-first design, works on all devices
- **Accessible:** WCAG 2.1 AA compliance
- **Intuitive:** Clear navigation, obvious actions
- **Fast:** Optimistic updates, loading states

### Color Scheme
- Primary: Professional blue/purple
- Success: Green
- Warning: Orange
- Error: Red
- Neutral: Gray scale

### Components Needed
- **Layout:**
  - Header with user info and logout
  - Sidebar navigation (collapsible on mobile)
  - Main content area
  - Footer (optional)

- **Common Components:**
  - Buttons (primary, secondary, danger)
  - Input fields (text, email, password, number, date, time)
  - Select dropdowns
  - Modals/Dialogs
  - Tables (sortable, filterable, paginated)
  - Cards
  - Badges (status indicators)
  - Loading spinners
  - Toast notifications
  - Date/Time pickers
  - Calendar component

- **Feature Components:**
  - Booking card
  - Slot grid
  - Service card
  - Staff card
  - Invoice card
  - Dashboard stats cards
  - Charts (revenue, bookings, etc.)

## API Integration

### Service Layer Structure
```javascript
// services/api.js - Base API configuration
// services/authService.js - Authentication APIs
// services/superAdminService.js - Super admin APIs
// services/clientAdminService.js - Client admin APIs
// services/staffService.js - Staff APIs
// services/customerService.js - Customer APIs
```

### API Call Pattern
- Use Axios interceptors for:
  - Adding JWT token to headers
  - Handling 401 errors (auto-logout)
  - Error handling and transformation
- Use React Query for:
  - Data fetching
  - Caching
  - Automatic refetching
  - Optimistic updates

### Error Handling
- Display user-friendly error messages
- Handle network errors gracefully
- Show loading states during API calls
- Validate forms before submission

## State Management

### Global State
- **Auth State:** Current user, token, role
- **Tenant State:** Current tenant (for client admin)
- **Shop State:** Selected shop (for client admin/staff)
- **UI State:** Sidebar open/closed, theme, notifications

### Local State
- Form data (React Hook Form)
- Component-specific state (useState)
- Server state (React Query)

## Routing Structure

```
/                          → Landing/Login page
/login                     → Login page
/register                 → Customer registration

/super-admin/
  ├── /dashboard          → Platform dashboard
  ├── /tenants            → Tenant list
  ├── /tenants/:id        → Tenant details
  ├── /tenants/:id/payment → Record payment
  └── /settings            → Platform settings

/client-admin/
  ├── /dashboard          → Shop dashboard
  ├── /shops               → Shop list
  ├── /shops/:id           → Shop details
  ├── /shops/:id/staff     → Staff management
  ├── /shops/:id/services  → Service management
  ├── /shops/:id/slots     → Slot management
  ├── /shops/:id/settings  → Shop settings
  └── /invoices            → Invoice list

/staff/
  ├── /dashboard           → Staff dashboard
  ├── /bookings            → Bookings list
  ├── /walkin              → Create walk-in
  └── /invoices            → Invoice management

/customer/
  ├── /services            → Service listing
  ├── /book                → Book slot
  └── /bookings            → Booking history
```

## Form Validation

- Client-side validation using React Hook Form
- Show validation errors inline
- Validate before API submission
- Match backend validation rules

## Responsive Design

- **Mobile (< 768px):** Single column, collapsible sidebar, touch-friendly
- **Tablet (768px - 1024px):** Two columns, optimized layout
- **Desktop (> 1024px):** Full layout with sidebar

## Performance Optimization

- Code splitting (React.lazy)
- Image optimization
- API response caching (React Query)
- Debounce search inputs
- Virtual scrolling for long lists
- Lazy load charts and heavy components

## Security Considerations

- Store JWT securely (httpOnly cookie preferred, or localStorage with XSS protection)
- Sanitize user inputs
- Validate all API responses
- Handle token expiry gracefully
- Protect routes based on roles
- Don't expose sensitive data in client-side code

## Testing Requirements

- Unit tests for utility functions
- Component tests for critical components
- Integration tests for API calls
- E2E tests for critical user flows

## Additional Features

### Notifications
- Toast notifications for actions (success, error, warning)
- In-app notification center (optional)
- Email notifications (handled by backend)

### Export/Print
- Export invoices as PDF
- Print booking confirmations
- Export reports (CSV/PDF)

### Search & Filters
- Search tenants, shops, staff, services
- Filter bookings by status, date, staff
- Filter invoices by date, status

### Calendar Views
- Monthly calendar for bookings
- Weekly calendar for slots
- Day view for staff schedule

## Deliverables

1. **Complete React Application** with all features
2. **README.md** with:
   - Setup instructions
   - Environment variables
   - Running instructions
   - API integration guide
3. **package.json** with all dependencies
4. **.env.example** file
5. **Clean, commented code**
6. **Responsive design** working on all devices
7. **Error handling** throughout
8. **Loading states** for all async operations

## Backend API Endpoints Reference

All endpoints are documented in the backend README.md. Key endpoints:

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Super Admin
- `GET /api/super-admin/dashboard`
- `GET /api/super-admin/tenants`
- `POST /api/super-admin/tenants`
- `POST /api/super-admin/tenants/:tenantId/payments`

### Client Admin
- `GET /api/admin/shops`
- `POST /api/admin/shops`
- `POST /api/admin/shops/:shopId/staff`
- `POST /api/admin/shops/:shopId/slots/generate`

### Staff
- `GET /api/staff/shops/:shopId/bookings`
- `POST /api/staff/shops/:shopId/bookings/walkin`
- `POST /api/staff/shops/:shopId/bookings/:bookingId/complete`

### Customer
- `GET /api/customer/shops/:shopId/services`
- `GET /api/customer/shops/:shopId/slots`
- `POST /api/customer/shops/:shopId/bookings`

## Socket.IO Events

### Client → Server
- `join-shop`: `{ tenantId, shopId }`
- `leave-shop`: `{ tenantId, shopId }`

### Server → Client
- `slot-updates`: `{ success, slots, timestamp }`
- `booking-updated`: `{ success, booking, timestamp }`

## Important Notes

1. **Multi-tenant:** Each client admin sees only their data
2. **Demo Period:** New tenants get 3-day demo automatically
3. **Subscription:** Access blocked if subscription expired
4. **Real-time:** Slots update automatically via Socket.IO
5. **Role-based:** Different UI/features per role
6. **Responsive:** Must work on mobile, tablet, desktop
7. **Production-ready:** Error handling, loading states, validation

## Success Criteria

- All API endpoints integrated
- All user roles functional
- Real-time updates working
- Responsive design implemented
- Error handling comprehensive
- Code is clean and maintainable
- Performance optimized
- Ready for production deployment

---

**Generate a complete, production-ready MERN stack frontend application following this specification.**

