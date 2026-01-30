# Environment Variables Setup Guide

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your configuration.

3. **Required changes before running:**
   - `MONGODB_URI` - Your MongoDB connection string.
   - `JWT_SECRET` - A strong random secret (min 32 characters).
   - `SMTP_USER` & `SMTP_PASSWORD` - For email notifications.

## Environment Variables Reference

### Core Configuration

| Variable | Default | Description |
|:---|:---|:---|
| `PORT` | `3000` | Server port number. |
| `NODE_ENV` | `development` | Environment mode: `development`, `production`, `test`. |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (e.g., `https://example.com`). |
| `LOG_LEVEL` | `info` | Logging level: `error`, `warn`, `info`, `debug`. |

### Database Configuration (Multi-tenant)

| Variable | Default | Description |
|:---|:---|:---|
| `MONGODB_URI` | (required) | MongoDB cluster connection string. |

> [!IMPORTANT]
> The system uses a multi-database architecture. `MONGODB_URI` should point to the cluster. The application will automatically manage:
> - `platform_db`: For super admin and client metadata.
> - `client_*_db`: Individual databases for each tenant.

### Authentication & Security

| Variable | Default | Description |
|:---|:---|:---|
| `JWT_SECRET` | (required) | Secret key for JWT (min 32 characters). |
| `JWT_EXPIRE` | `7d` | Token expiration (e.g., `7d`, `24h`, `1h`). |

**Generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Email (SMTP) Configuration

Required for sending invoices and registration OTPs.

| Variable | Default | Description |
|:---|:---|:---|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname. |
| `SMTP_PORT` | `587` | SMTP server port. |
| `SMTP_SECURE` | `false` | Use TLS (`true` for port 465). |
| `SMTP_USER` | (required) | SMTP username/email. |
| `SMTP_PASSWORD` | (required) | SMTP password or app-specific password. |

### Business Logic Defaults

| Variable | Default | Description |
|:---|:---|:---|
| `DEFAULT_SLOT_DURATION_MINUTES` | `30` | Default duration for booking slots. |
| `BOOKING_ADVANCE_DAYS` | `7` | How many days ahead customers can book. |
| `NO_SHOW_TIMEOUT_MINUTES` | `5` | Minutes before a booking is marked as no-show. |
| `DEFAULT_WORKING_HOURS_START` | `09:00` | Default shop opening time. |
| `DEFAULT_WORKING_HOURS_END` | `18:00` | Default shop closing time. |

### Seed & Development

| Variable | Default | Description |
|:---|:---|:---|
| `PLATFORM_ADMIN_EMAIL` | `admin@bookacut.com` | Initial super admin email. |
| `PLATFORM_ADMIN_PASSWORD` | `ChangeThisPassword123!` | Initial super admin password. |
| `CREATE_SAMPLE_CLIENT` | `false` | Set `true` to create a sample client during seeding. |

### Rate Limiting

| Variable | Default | Description |
|:---|:---|:---|
| `RATE_LIMIT_WINDOW_MS` | `900000` | Window size in ms (15 mins default). |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per IP per window. |

## Complete `.env` Example

```env
# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
LOG_LEVEL=debug

# Database
MONGODB_URI=mongodb://localhost:27017/platform_db

# Auth
JWT_SECRET=your_super_secret_random_string_here
JWT_EXPIRE=7d

# SMTP (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Business Logic
DEFAULT_SLOT_DURATION_MINUTES=30
BOOKING_ADVANCE_DAYS=7
NO_SHOW_TIMEOUT_MINUTES=15
DEFAULT_WORKING_HOURS_START=09:00
DEFAULT_WORKING_HOURS_END=19:00

# Seeding
PLATFORM_ADMIN_EMAIL=admin@yourdomain.com
PLATFORM_ADMIN_PASSWORD=StrongSecurePassword123!
CREATE_SAMPLE_CLIENT=true

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Notes

1. **Never commit `.env` file** - It is included in `.gitignore`.
2. **Production:** Always use unique, strong secrets and restricted `CORS_ORIGIN`.
3. **SMTP:** Use app-specific passwords if using Gmail.
4. **MongoDB:** Use URI with authentication for production clusters.

