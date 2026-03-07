# API Documentation - Chad Bus Ticketing System

Base URL: `http://localhost:5000/api`

All responses are in JSON format with the following structure:

```json
{
  "success": true|false,
  "messageKey": "MESSAGE_KEY",
  "message": "Message in French",
  "data": { ... }
}
```

## Authentication

### Request OTP
Send OTP code to phone number for authentication.

**Endpoint:** `POST /auth/request-otp`

**Request Body:**
```json
{
  "phoneNumber": "+23566778899"
}
```

**Response:**
```json
{
  "success": true,
  "messageKey": "AUTH_OTP_SENT",
  "message": "Code de vérification envoyé à votre numéro",
  "data": {
    "phoneNumber": "+23566778899",
    "expiresIn": 10
  }
}
```

### Verify OTP
Verify OTP code and receive JWT token.

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "phoneNumber": "+23566778899",
  "otp": "123456",
  "fullName": "Jean Dupont" // Optional, for new users
}
```

**Response:**
```json
{
  "success": true,
  "messageKey": "AUTH_SUCCESS",
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "fullName": "Jean Dupont",
      "phoneNumber": "+23566778899",
      "role": "USER"
    }
  }
}
```

### Get Profile
Get current user profile (requires authentication).

**Endpoint:** `GET /auth/me`

**Headers:** 
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "Jean Dupont",
      "phoneNumber": "+23566778899",
      "email": "jean@example.com",
      "role": "USER",
      "createdAt": "2024-03-15T10:00:00.000Z"
    }
  }
}
```

## Trips

### Get Cities
Get list of all available cities.

**Endpoint:** `GET /trips/cities`

**Response:**
```json
{
  "success": true,
  "data": {
    "cities": ["N'Djamena", "Moundou", "Sarh", "Abéché"]
  }
}
```

### Search Trips
Search for available trips.

**Endpoint:** `GET /trips/search`

**Query Parameters:**
- `origin` (required): Origin city name
- `destination` (required): Destination city name
- `date` (required): Travel date (YYYY-MM-DD)

**Example:** `/trips/search?origin=N'Djamena&destination=Moundou&date=2024-03-15`

**Response:**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "uuid",
        "route": {
          "originCity": "N'Djamena",
          "destinationCity": "Moundou",
          "basePrice": 15000,
          "distance": 475
        },
        "departureDate": "2024-03-15T00:00:00.000Z",
        "departureTime": "08:00",
        "arrivalTime": "16:00",
        "currentPrice": 15000,
        "availableSeats": 25,
        "availabilityPercentage": 62,
        "status": "SCHEDULED",
        "bus": {
          "busNumber": "BUS001",
          "capacity": 40,
          "condition": "GOOD"
        }
      }
    ],
    "count": 1
  }
}
```

### Get Trip Details
Get detailed trip information including seat availability.

**Endpoint:** `GET /trips/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "trip": {
      "id": "uuid",
      "route": { ... },
      "departureDate": "2024-03-15T00:00:00.000Z",
      "departureTime": "08:00",
      "currentPrice": 15000,
      "availableSeats": 25,
      "seats": [
        {
          "id": "seat-uuid",
          "seatNumber": 1,
          "isBooked": false,
          "isActive": true
        },
        // ... more seats
      ]
    }
  }
}
```

## Bookings

### Create Booking
Create a new booking (guest or authenticated user).

**Endpoint:** `POST /bookings`

**Headers (optional):**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "tripId": "uuid",
  "passengers": [
    {
      "fullName": "Jean Dupont",
      "seatId": "seat-uuid",
      "age": 30,
      "idNumber": "TC123456"
    }
  ],
  "luggage": {
    "numberOfBags": 2,
    "estimatedWeight": 25
  },
  "contactName": "Jean Dupont",
  "contactPhone": "+23566778899",
  "contactEmail": "jean@example.com",
  "paymentMethod": "MOMO_AIRTEL"
}
```

**Response:**
```json
{
  "success": true,
  "messageKey": "BOOKING_CREATED",
  "message": "Réservation créée avec succès",
  "data": {
    "booking": {
      "id": "uuid",
      "bookingCode": "ABC123",
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "totalPrice": 15500,
      "luggagePrice": 500,
      "trip": { ... },
      "passengers": [ ... ]
    }
  }
}
```

### Get Booking
Get booking details by code or ID.

**Endpoint:** `GET /bookings/:identifier`

`:identifier` can be booking code (e.g., "ABC123") or UUID.

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "uuid",
      "bookingCode": "ABC123",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "totalPrice": 15500,
      "trip": { ... },
      "passengers": [ ... ],
      "payments": [ ... ]
    }
  }
}
```

### Get My Bookings
Get all bookings for authenticated user.

**Endpoint:** `GET /bookings/my/list`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [ ... ]
  }
}
```

### Cancel Booking
Cancel an existing booking.

**Endpoint:** `PUT /bookings/:id/cancel`

**Request Body:**
```json
{
  "reason": "Changement de plans"
}
```

**Response:**
```json
{
  "success": true,
  "messageKey": "BOOKING_CANCELLED",
  "message": "Réservation annulée",
  "data": {
    "booking": { ... }
  }
}
```

### Get Ticket
Get ticket in text or PDF format.

**Endpoint:** `GET /bookings/:id/ticket?format=text|pdf`

**For text format:**
```json
{
  "success": true,
  "data": {
    "ticket": "🎫 BILLET DE VOYAGE...",
    "booking": { ... }
  }
}
```

**For PDF format:** Returns PDF file for download.

## Payments

### Initiate Payment
Start payment process.

**Endpoint:** `POST /payments/:bookingId/initiate`

**Request Body:**
```json
{
  "amount": 15500,
  "method": "MOMO_AIRTEL",
  "phoneNumber": "+23566778899"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "transactionReference": "TXN-ABC123",
    "amount": 15500,
    "method": "MOMO_AIRTEL",
    "instructions": "1. Composez *130#...",
    "status": "PENDING"
  }
}
```

### Verify Payment
Check Mobile Money payment status.

**Endpoint:** `GET /payments/:transactionRef/verify`

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionReference": "TXN-ABC123",
    "status": "PENDING",
    "amount": 15500,
    "message": "Paiement en attente de confirmation"
  }
}
```

## Admin Endpoints

All admin endpoints require authentication with `ADMIN` or `AGENT` role.

**Headers:**
```
Authorization: Bearer {admin_token}
```

### Dashboard Stats

**Endpoint:** `GET /admin/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBookings": 150,
    "todayBookings": 12,
    "totalRevenue": 2250000,
    "activeTrips": 5
  }
}
```

### Confirm Payment (Manual)

**Endpoint:** `PUT /admin/payments/:id/confirm`

**Response:**
```json
{
  "success": true,
  "messageKey": "PAYMENT_CONFIRMED",
  "message": "Paiement confirmé par l'administrateur",
  "data": {
    "payment": { ... },
    "booking": { ... }
  }
}
```

### Get Trip Manifest

**Endpoint:** `GET /admin/trips/:id/manifest`

**Response:**
```json
{
  "success": true,
  "data": {
    "passengers": [
      {
        "fullName": "Jean Dupont",
        "seatNumber": 5,
        "booking": {
          "bookingCode": "ABC123",
          "paymentStatus": "PAID"
        }
      }
    ]
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "messageKey": "ERROR_KEY",
  "message": "Message d'erreur en français",
  "details": { ... } // Only in development
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Not currently implemented. Recommended for production:
- Public endpoints: 100 requests/15 minutes
- Authenticated endpoints: 1000 requests/15 minutes
- Admin endpoints: No limit

## Pagination

For endpoints returning lists, add these query parameters:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

Example: `/admin/bookings?page=2&limit=50`

## Date Formats

- Dates: ISO 8601 format (`2024-03-15`)
- DateTimes: ISO 8601 with timezone (`2024-03-15T10:00:00.000Z`)
- Times: 24-hour format (`14:30`)

## Currency

All amounts are in **FCFA** (Franc CFA).

---

For more details, see the source code in `backend/src/controllers/` and `backend/src/routes/`.
