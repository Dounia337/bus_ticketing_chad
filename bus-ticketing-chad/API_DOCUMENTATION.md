# API Documentation

Base URL: `http://localhost:5000/api` (development)
Production: `https://api.buschad.td/api`

## Authentication

Most endpoints require JWT authentication via Bearer token in Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All responses follow this structure:

```json
{
  "messageKey": "SUCCESS",
  "message": "Opération réussie",
  "data": {...}
}
```

Error responses:

```json
{
  "messageKey": "ERROR_CODE",
  "message": "Message d'erreur en français",
  "error": "Détails techniques (dev uniquement)"
}
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "fullName": "Jean Dupont",
  "phoneNumber": "+23566666666",
  "email": "jean@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "messageKey": "AUTH_REGISTRATION_SUCCESS",
  "message": "Inscription réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "fullName": "Jean Dupont",
    "phoneNumber": "+23566666666",
    "email": "jean@example.com",
    "role": "USER"
  }
}
```

### Login

**POST** `/auth/login`

Login with phone number or email.

**Request Body:**
```json
{
  "phoneNumber": "+23566666666",
  "password": "password123"
}
```

**Response:**
```json
{
  "messageKey": "AUTH_LOGIN_SUCCESS",
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "fullName": "Jean Dupont",
    "phoneNumber": "+23566666666",
    "role": "USER"
  }
}
```

### Get Current User

**GET** `/auth/me`

Get authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "fullName": "Jean Dupont",
    "phoneNumber": "+23566666666",
    "email": "jean@example.com",
    "role": "USER",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Trip Endpoints

### Search Trips

**GET** `/trips/search`

Search available trips by route and date.

**Query Parameters:**
- `originCity` (required): Ville de départ
- `destinationCity` (required): Ville d'arrivée
- `departureDate` (required): Date au format YYYY-MM-DD
- `passengers` (optional): Nombre de passagers (défaut: 1)

**Example:**
```
GET /trips/search?originCity=N'Djamena&destinationCity=Moundou&departureDate=2024-02-15&passengers=2
```

**Response:**
```json
{
  "success": true,
  "trips": [
    {
      "id": "uuid",
      "departureDate": "2024-02-15T00:00:00.000Z",
      "departureTime": "06:00",
      "arrivalTime": "13:00",
      "availableSeats": 40,
      "status": "SCHEDULED",
      "route": {
        "id": "uuid",
        "originCity": "N'Djamena",
        "destinationCity": "Moundou",
        "basePrice": 15000,
        "distance": 466
      },
      "bus": {
        "id": "uuid",
        "busNumber": "BUS-001",
        "capacity": 45,
        "condition": "GOOD",
        "model": "Mercedes Benz O500R"
      }
    }
  ],
  "route": {...}
}
```

### Get Trip Details

**GET** `/trips/:id`

Get detailed information about a specific trip including seat map.

**Response:**
```json
{
  "success": true,
  "trip": {
    "id": "uuid",
    "departureDate": "2024-02-15T00:00:00.000Z",
    "departureTime": "06:00",
    "route": {...},
    "bus": {
      "id": "uuid",
      "busNumber": "BUS-001",
      "seats": [
        {
          "id": "uuid",
          "seatNumber": "A1",
          "isBooked": false
        },
        {
          "id": "uuid",
          "seatNumber": "A2",
          "isBooked": true
        }
      ]
    }
  }
}
```

---

## Booking Endpoints

### Create Booking

**POST** `/bookings`

Create a new booking. Can be done as guest or authenticated user.

**Headers (optional):** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "tripId": "uuid",
  "passengers": [
    {
      "fullName": "Jean Dupont",
      "seatId": "uuid-seat-1",
      "age": 30
    },
    {
      "fullName": "Marie Dupont",
      "seatId": "uuid-seat-2",
      "age": 28
    }
  ],
  "luggage": {
    "numberOfLuggage": 2,
    "estimatedWeight": 25
  },
  "paymentMethod": "MOMO",
  "phoneNumber": "+23566666666",
  "guestPhone": "+23566666666",
  "guestEmail": "jean@example.com",
  "payLater": false
}
```

**Response:**
```json
{
  "messageKey": "BOOKING_CREATED",
  "message": "Réservation créée avec succès",
  "booking": {
    "id": "uuid",
    "bookingCode": "BKG-ABC123",
    "tripId": "uuid",
    "totalPassengers": 2,
    "totalPrice": 32500,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "passengers": [...],
    "luggage": {
      "numberOfLuggage": 2,
      "estimatedWeight": 25,
      "extraFee": 2500
    },
    "trip": {...},
    "payment": {...}
  }
}
```

### Get Booking

**GET** `/bookings/:identifier`

Get booking by ID or booking code.

**Example:**
```
GET /bookings/BKG-ABC123
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "bookingCode": "BKG-ABC123",
    "totalPrice": 32500,
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "passengers": [...],
    "luggage": {...},
    "trip": {...},
    "payment": {...}
  }
}
```

### Get User Bookings

**GET** `/bookings`

Get all bookings for authenticated user (or all bookings if admin).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (défaut: 1)
- `limit` (optional): Items per page (défaut: 10)
- `status` (optional): Filter by status
- `tripId` (optional): Filter by trip

**Response:**
```json
{
  "success": true,
  "bookings": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Cancel Booking

**PUT** `/bookings/:id/cancel`

Cancel a booking. Only owner or admin can cancel.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "messageKey": "BOOKING_CANCELLED",
  "message": "Réservation annulée",
  "bookingId": "uuid"
}
```

---

## Payment Endpoints

### Get Payment Status

**GET** `/payments/:bookingId/status`

Check payment status for a booking.

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "status": "PAID",
    "amount": 32500,
    "method": "MOMO",
    "transactionReference": "MOMO-20240215-ABC123",
    "createdAt": "2024-02-15T10:00:00.000Z"
  }
}
```

### Confirm Payment (Admin Only)

**POST** `/payments/:bookingId/confirm`

Manually confirm payment. Critical for Chad where internet may be unstable.

**Headers:** `Authorization: Bearer <token>` (Admin role required)

**Response:**
```json
{
  "messageKey": "PAYMENT_CONFIRMED",
  "message": "Paiement confirmé",
  "payment": {...},
  "booking": {...}
}
```

### Initiate Payment

**POST** `/payments/:bookingId/initiate`

Initiate payment for a reserved booking.

**Request Body:**
```json
{
  "paymentMethod": "MOMO",
  "phoneNumber": "+23566666666"
}
```

**Response:**
```json
{
  "messageKey": "PAYMENT_INITIATED",
  "message": "Paiement initié",
  "transactionReference": "MOMO-20240215-XYZ789",
  "message": "Vérifiez votre téléphone pour confirmer le paiement"
}
```

---

## Admin Endpoints

All admin endpoints require authentication with ADMIN role.

### Routes Management

#### Get Routes

**GET** `/admin/routes`

**Query Parameters:**
- `page`, `limit`: Pagination
- `active`: Filter by active status

#### Create Route

**POST** `/admin/routes`

**Request Body:**
```json
{
  "originCity": "N'Djamena",
  "destinationCity": "Abéché",
  "basePrice": 20000,
  "distance": 850,
  "active": true
}
```

#### Update Route

**PUT** `/admin/routes/:id`

**Request Body:**
```json
{
  "basePrice": 22000,
  "active": true
}
```

#### Delete Route

**DELETE** `/admin/routes/:id`

### Buses Management

#### Get Buses

**GET** `/admin/buses`

#### Create Bus

**POST** `/admin/buses`

**Request Body:**
```json
{
  "busNumber": "BUS-006",
  "capacity": 45,
  "plateNumber": "TD-1234",
  "model": "Mercedes Benz O500R",
  "year": 2023,
  "status": "AVAILABLE",
  "condition": "GOOD"
}
```

#### Update Bus

**PUT** `/admin/buses/:id`

#### Delete Bus

**DELETE** `/admin/buses/:id`

### Trips Management

#### Create Trip

**POST** `/trips`

**Request Body:**
```json
{
  "routeId": "uuid",
  "busId": "uuid",
  "departureDate": "2024-02-20",
  "departureTime": "06:00",
  "arrivalTime": "13:00"
}
```

#### Update Trip

**PUT** `/trips/:id`

**Request Body:**
```json
{
  "status": "DEPARTED",
  "departureTime": "06:15"
}
```

#### Get Trip Manifest

**GET** `/trips/:id/manifest`

Get passenger list and statistics for a trip.

**Response:**
```json
{
  "success": true,
  "manifest": {
    "trip": {
      "id": "uuid",
      "route": "N'Djamena → Moundou",
      "departureDate": "2024-02-15T00:00:00.000Z",
      "departureTime": "06:00",
      "busNumber": "BUS-001",
      "capacity": 45
    },
    "statistics": {
      "totalBookings": 15,
      "confirmedBookings": 12,
      "totalPassengers": 38,
      "availableSeats": 7,
      "totalRevenue": 570000
    },
    "bookings": [...]
  }
}
```

### Dashboard

#### Get Dashboard Statistics

**GET** `/admin/dashboard`

**Response:**
```json
{
  "success": true,
  "stats": {
    "bookings": {
      "total": 1250,
      "today": 15
    },
    "revenue": {
      "total": 18750000,
      "today": 225000
    },
    "activeTrips": 8,
    "totalUsers": 450
  }
}
```

### System Configuration

#### Get Configuration

**GET** `/admin/config`

**Response:**
```json
{
  "success": true,
  "config": [
    {
      "key": "DEFAULT_FREE_LUGGAGE_KG",
      "value": "20",
      "description": "Poids gratuit des bagages par défaut (kg)"
    },
    {
      "key": "EXTRA_LUGGAGE_FEE_PER_KG",
      "value": "500",
      "description": "Frais supplémentaires par kg de bagage (FCFA)"
    }
  ]
}
```

#### Update Configuration

**PUT** `/admin/config/:key`

**Request Body:**
```json
{
  "value": "25",
  "description": "Poids gratuit des bagages par défaut (kg)"
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Identifiants invalides | Wrong username/password |
| `AUTH_UNAUTHORIZED` | Non autorisé | No/invalid token |
| `BOOKING_NOT_FOUND` | Réservation introuvable | Booking doesn't exist |
| `TRIP_NOT_FOUND` | Trajet introuvable | Trip doesn't exist |
| `SEAT_ALREADY_BOOKED` | Siège déjà réservé | Seat unavailable |
| `PAYMENT_FAILED` | Paiement échoué | Payment failed |
| `SERVER_ERROR` | Erreur serveur | Internal server error |
| `VALIDATION_ERROR` | Erreur de validation | Invalid input |

---

## Rate Limiting

API is rate-limited to 100 requests per 15 minutes per IP address.

When limit exceeded:
```json
{
  "messageKey": "RATE_LIMIT_EXCEEDED",
  "message": "Trop de requêtes, veuillez réessayer plus tard"
}
```

---

## Testing

Use tools like Postman or curl:

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phoneNumber": "+23577777777",
    "password": "test123"
  }'

# Search trips
curl -X GET "http://localhost:5000/api/trips/search?originCity=N%27Djamena&destinationCity=Moundou&departureDate=2024-02-20"

# Create booking (with token)
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tripId": "uuid",
    "passengers": [...],
    "paymentMethod": "MOMO"
  }'
```

---

This API is designed for reliability in Chad's infrastructure, with support for manual overrides and offline-friendly operations.
