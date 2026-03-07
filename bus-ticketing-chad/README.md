# 🚌 Chad Bus Ticketing System

A production-ready, mobile-first bus ticketing web application built specifically for Chad's transportation infrastructure, optimized for unstable internet connections and mobile money payments.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Admin Panel](#admin-panel)
- [Production Deployment](#production-deployment)
- [Future Extensions](#future-extensions)

## ✨ Features

### For Passengers
- 📱 Mobile-first responsive design
- 🔐 OTP-based phone authentication (no password required)
- 🎫 Easy booking flow: select route → choose seats → enter details → pay
- 💰 Multiple payment options: Mobile Money (Airtel, Moov, Tigo) or pay later
- 📦 Luggage weight calculator with automatic fee calculation
- 📲 WhatsApp ticket delivery (with SMS/email fallback)
- 🔍 Real-time seat availability
- 👥 Guest booking (no registration required)

### For Administrators
- 🗺️ Complete route management
- 🚌 Bus fleet management with capacity tracking
- 📅 Trip scheduling and management
- 💳 Manual payment confirmation (critical for Chad)
- 📊 Booking and revenue reports
- 👨‍✈️ Passenger manifests per trip
- ⚙️ System configuration (luggage rules, pricing)
- 🔔 Send notifications to passengers

### System Capabilities
- 🌐 Works on unstable internet (optimized API calls)
- 📴 PWA-ready for offline capability
- 🇫🇷 All user-facing text in French
- 🔄 Manual override for all critical operations
- 📧 Multi-channel notifications (WhatsApp → SMS → Email)
- 🎟️ PDF and text ticket generation
- 📝 Complete audit trail

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Authentication**: JWT + OTP
- **Notifications**: Twilio (WhatsApp/SMS)
- **Email**: Nodemailer (SMTP)
- **PDF Generation**: PDFKit
- **Validation**: Express-validator

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Internationalization**: next-i18next
- **Icons**: Lucide React
- **Forms**: React Hook Form

## 📦 Prerequisites

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **npm**: 9.x or higher

### Optional Services
- **Twilio Account**: For WhatsApp and SMS notifications
- **SMTP Server**: For email notifications (Gmail, SendGrid, etc.)
- **Mobile Money API Access**: For production payment integration

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bus-ticketing-chad
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. Copy environment template:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bus_ticketing_chad"

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Twilio (WhatsApp/SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

1. Create `.env.local`:
```bash
cd frontend
cp .env.example .env.local
```

2. Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
createdb bus_ticketing_chad
```

Or using psql:
```sql
CREATE DATABASE bus_ticketing_chad;
```

### 2. Run Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

### 3. Seed Database (Optional)

```bash
npm run seed
```

This creates:
- Sample routes (N'Djamena → Moundou, etc.)
- Sample buses with seats
- Admin user
- System configuration

**Default Admin Credentials:**
- Phone: +23566778899
- OTP will be logged to console

## 🏃 Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
# From root directory
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Prisma Studio**: `cd backend && npm run studio`

### Production Mode

```bash
# Build
npm run build

# Start
cd backend && npm start
cd frontend && npm start
```

## 📡 API Documentation

### Authentication Endpoints

#### Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phoneNumber": "+23566778899"
}
```

#### Verify OTP & Login
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+23566778899",
  "otp": "123456",
  "fullName": "Jean Dupont" // Optional, for new users
}
```

### Booking Endpoints

#### Search Trips
```http
GET /api/trips/search?origin=N'Djamena&destination=Moundou&date=2024-03-15
```

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "tripId": "uuid",
  "passengers": [
    {
      "fullName": "Jean Dupont",
      "seatId": "uuid"
    }
  ],
  "luggage": {
    "numberOfBags": 2,
    "estimatedWeight": 25
  },
  "contactPhone": "+23566778899",
  "contactEmail": "jean@example.com"
}
```

### Admin Endpoints

All admin endpoints require `Authorization: Bearer {admin_token}`

#### Confirm Payment
```http
POST /api/admin/payments/{paymentId}/confirm
```

#### Get Passenger Manifest
```http
GET /api/admin/trips/{tripId}/manifest
```

See full API documentation in `/backend/docs/api.md`

## 👨‍💼 Admin Panel

### Accessing Admin Panel

1. Login with admin credentials
2. Navigate to `/admin` route
3. Admin dashboard provides:
   - Route management
   - Bus management
   - Trip scheduling
   - Booking management
   - Payment confirmation
   - Reports and analytics

### Creating Trips

1. Go to "Trips" → "Create New Trip"
2. Select route
3. Select bus
4. Set departure date and time
5. Set price (defaults to route base price)
6. Save - seats automatically become available

### Confirming Payments

1. Go to "Payments" or "Bookings"
2. Find pending payment
3. Click "Confirm Payment"
4. Booking auto-updates to CONFIRMED
5. Notification sent to passenger

## 🚀 Production Deployment

### Environment Preparation

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production database
4. Set up proper SSL certificates
5. Configure production SMTP and Twilio
6. Set CORS to production frontend URL

### Database Migration

```bash
cd backend
npx prisma migrate deploy
```

### Recommended Stack

- **Hosting**: VPS (DigitalOcean, Linode) or PaaS (Render, Railway)
- **Database**: Managed PostgreSQL (AWS RDS, DigitalOcean)
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2
- **SSL**: Let's Encrypt (Certbot)

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/index.js --name bus-ticketing-api

# Start frontend
cd frontend
pm2 start npm --name bus-ticketing-web -- start

# Save PM2 config
pm2 save
pm2 startup
```

## 🔮 Future Extensions

The system is designed to support future enhancements:

### Flutter Mobile App
- API is ready for mobile consumption
- JWT authentication works cross-platform
- Endpoints return JSON for easy mobile parsing

### GPS Tracking
- Add `latitude`, `longitude` fields to Trip model
- Create WebSocket endpoint for real-time updates
- Frontend map integration

### Agent Mobile App
- Use existing AGENT role
- Create dedicated agent endpoints
- Allow ticket sales on-the-go

### Multi-Company Support
- Add Company model
- Link buses and routes to companies
- Multi-tenant architecture

## 🔒 Security Considerations

- ✅ JWT with expiration
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Rate limiting (implement for production)
- ✅ Audit logging

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
cd backend
npx prisma db pull
```

### Twilio Not Sending Messages
- Verify account SID and auth token
- Check WhatsApp number format
- Ensure Twilio account is active
- Check logs for error messages

### Frontend Not Connecting to Backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS configuration in backend
- Ensure backend is running on correct port

## 📞 Support

For issues and questions:
- Check existing issues on GitHub
- Create new issue with detailed description
- Include error logs and environment details

## 📄 License

MIT License - See LICENSE file for details

---

**Built for Chad's transportation needs with ❤️**

*Optimized for mobile-first access, unstable internet, and manual operations*
