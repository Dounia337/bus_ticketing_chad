# 🚀 Quick Start Guide - Chad Bus Ticketing System

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed and running
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed (optional)

## ⚡ 5-Minute Setup

### 1. Install Dependencies

```bash
# From project root
cd bus-ticketing-chad

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup Database

```bash
# Create PostgreSQL database
createdb bus_ticketing_chad

# Or using psql
psql -U postgres
CREATE DATABASE bus_ticketing_chad;
\q
```

### 3. Configure Environment

```bash
# Backend - Copy and edit .env
cd backend
cp .env.example .env
nano .env  # Edit with your settings
```

**Minimum .env configuration:**
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/bus_ticketing_chad"
JWT_SECRET=change-this-to-a-random-secret-key
FRONTEND_URL=http://localhost:3000
```

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

### 5. Seed Database (Optional)

```bash
npm run seed
```

This creates:
- Admin user: `+23566778899` (OTP will be logged)
- Sample routes (N'Djamena → Moundou, etc.)
- Sample buses with seats

### 6. Start Development Servers

**Option A: Run Both (Recommended)**
```bash
# From project root
npm run dev
```

**Option B: Run Separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Prisma Studio**: `cd backend && npm run studio`

## 🎯 First Steps

### Test the System

1. **Open Frontend**: http://localhost:3000
2. **Search for a Trip**:
   - Origin: N'Djamena
   - Destination: Moundou
   - Date: Tomorrow
   - Click "Rechercher"

3. **Create a Booking** (Guest mode):
   - Select a trip
   - Choose seats
   - Enter passenger details
   - Complete booking

4. **Access Admin Panel**:
   - Login with admin phone: `+23566778899`
   - Request OTP (check backend console logs)
   - Access admin dashboard

## 📱 Mobile Testing

```bash
# Get your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update frontend .env.local
NEXT_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api

# Access from phone
http://YOUR_LOCAL_IP:3000
```

## 🔧 Common Issues & Solutions

### Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (Ubuntu/Debian)
sudo systemctl start postgresql

# Start PostgreSQL (Mac)
brew services start postgresql
```

### Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**:
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Or change port in backend/.env
PORT=5001
```

### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd backend
npx prisma generate
```

### Frontend Can't Connect to API

**Solution**:
1. Verify backend is running: http://localhost:5000/health
2. Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
3. Check CORS settings in `backend/src/index.js`

## 🧪 Testing Key Features

### 1. OTP Authentication

```bash
# Request OTP
curl -X POST http://localhost:5000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+23566778899"}'

# Check backend logs for OTP code

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+23566778899",
    "otp": "YOUR_OTP_CODE",
    "fullName": "Test User"
  }'
```

### 2. Search Trips

```bash
curl "http://localhost:5000/api/trips/search?origin=N'Djamena&destination=Moundou&date=2024-03-15"
```

### 3. Create Booking

```bash
# First get a trip ID from search above
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "YOUR_TRIP_ID",
    "contactName": "Jean Dupont",
    "contactPhone": "+23566123456",
    "passengers": [{
      "fullName": "Jean Dupont",
      "seatId": "YOUR_SEAT_ID"
    }]
  }'
```

## 🌍 WhatsApp & SMS Setup (Production)

### Twilio Configuration

1. Create account at https://www.twilio.com
2. Get WhatsApp sandbox number
3. Add to backend/.env:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Test WhatsApp

```javascript
// In backend, notifications will auto-send
// Check logs for WhatsApp message status
```

## 📊 Database Management

### View Data in Prisma Studio

```bash
cd backend
npm run studio
# Opens at http://localhost:5555
```

### Reset Database

```bash
cd backend
npx prisma migrate reset
npm run seed
```

### Backup Database

```bash
pg_dump bus_ticketing_chad > backup.sql

# Restore
psql bus_ticketing_chad < backup.sql
```

## 🚀 Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure production SMTP
- [ ] Set up Twilio for production
- [ ] Configure proper CORS
- [ ] Set up monitoring (PM2, logs)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up backups
- [ ] Enable rate limiting
- [ ] Configure firewall

## 📞 Support & Resources

- **Documentation**: See README.md
- **API Docs**: See backend/docs/api.md (if created)
- **Database Schema**: backend/prisma/schema.prisma
- **GitHub Issues**: Create issues for bugs

## 🎓 Learning Resources

### Key Files to Understand

1. **Backend Entry**: `backend/src/index.js`
2. **Database Schema**: `backend/prisma/schema.prisma`
3. **API Routes**: `backend/src/routes/`
4. **Controllers**: `backend/src/controllers/`
5. **Frontend Home**: `frontend/src/app/page.js`
6. **API Client**: `frontend/src/lib/api.js`

### Understanding the Flow

```
User Action (Frontend)
    ↓
API Request (axios)
    ↓
Express Route (backend/src/routes/)
    ↓
Controller (backend/src/controllers/)
    ↓
Service (business logic)
    ↓
Prisma (database)
    ↓
Response (JSON with French messages)
    ↓
Frontend Update
```

## ✅ Verification Steps

Run these to verify everything works:

```bash
# 1. Database connection
cd backend
npx prisma db pull

# 2. Backend health
curl http://localhost:5000/health

# 3. Get cities
curl http://localhost:5000/api/trips/cities

# 4. Frontend build
cd ../frontend
npm run build

# 5. Run tests (if implemented)
npm test
```

---

**🎉 Congratulations! Your Chad Bus Ticketing System is ready!**

For production deployment, see the main README.md for detailed instructions.
