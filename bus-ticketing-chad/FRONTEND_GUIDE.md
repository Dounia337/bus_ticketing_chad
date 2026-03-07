# Frontend Implementation Guide

## Structure Overview

```
frontend/
├── app/                      # Next.js 14 App Router
│   ├── layout.js            # Root layout
│   ├── page.js              # Home page (search)
│   ├── search/              # Search results
│   ├── booking/             # Booking flow
│   ├── confirmation/        # Booking confirmation
│   ├── my-bookings/         # User bookings
│   └── admin/               # Admin panel
├── components/              # Reusable components
│   ├── BookingFlow/
│   ├── SearchForm/
│   ├── TripCard/
│   ├── SeatSelector/
│   └── shared/
├── lib/                     # Utilities
│   ├── api.js              # API client (created)
│   ├── messages.js         # French messages
│   └── utils.js            # Helper functions
├── styles/
│   └── globals.css         # Global styles
└── public/                 # Static assets
```

## Key Implementation Files

### 1. app/layout.js - Root Layout

```javascript
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Bus Tchad - Réservation de Billets',
  description: 'Réservez vos billets de bus en ligne au Tchad',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <nav className="bg-primary-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🚌</span>
                <h1 className="text-xl font-bold">Bus Tchad</h1>
              </div>
              <div className="flex space-x-4">
                <a href="/" className="hover:text-primary-200">Accueil</a>
                <a href="/my-bookings" className="hover:text-primary-200">Mes Réservations</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p>© 2024 Bus Tchad - Votre partenaire de confiance</p>
            <p className="text-sm text-gray-400 mt-2">
              Support: +235 XX XX XX XX | Email: support@buschad.com
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
```

### 2. app/page.js - Home Page (Search Form)

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const cities = [
  "N'Djamena", "Moundou", "Abéché", "Sarh", "Bongor", "Bol"
];

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    originCity: '',
    destinationCity: '',
    departureDate: '',
    passengers: 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(formData).toString();
    router.push(`/search?${params}`);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Réservez Votre Trajet
          </h1>
          <p className="text-gray-600">
            Simple, rapide et sécurisé
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Origin City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville de départ
              </label>
              <select
                required
                value={formData.originCity}
                onChange={(e) => setFormData({...formData, originCity: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionnez une ville</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Destination City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville d'arrivée
              </label>
              <select
                required
                value={formData.destinationCity}
                onChange={(e) => setFormData({...formData, destinationCity: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionnez une ville</option>
                {cities.filter(c => c !== formData.originCity).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de départ
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.departureDate}
                onChange={(e) => setFormData({...formData, departureDate: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de passagers
              </label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={formData.passengers}
                onChange={(e) => setFormData({...formData, passengers: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-lg transition-colors"
            >
              Rechercher des trajets
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="font-semibold mb-2">Mobile-First</h3>
            <p className="text-sm text-gray-600">Optimisé pour votre téléphone</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-semibold mb-2">Mobile Money</h3>
            <p className="text-sm text-gray-600">Paiement facile et sécurisé</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <div className="text-4xl mb-3">📲</div>
            <h3 className="font-semibold mb-2">WhatsApp</h3>
            <p className="text-sm text-gray-600">Billets par WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. components/TripCard.js

```javascript
'use client';

import { useRouter } from 'next/navigation';

export default function TripCard({ trip, passengers }) {
  const router = useRouter();

  const handleSelect = () => {
    router.push(`/booking?tripId=${trip.id}&passengers=${passengers}`);
  };

  const formatTime = (time) => {
    return time;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {trip.route.originCity} → {trip.route.destinationCity}
          </h3>
          <p className="text-sm text-gray-600">{formatDate(trip.departureDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-600">
            {trip.route.basePrice.toLocaleString('fr-FR')} FCFA
          </p>
          <p className="text-sm text-gray-600">par personne</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Départ</p>
          <p className="font-semibold text-lg">{formatTime(trip.departureTime)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Arrivée</p>
          <p className="font-semibold text-lg">
            {trip.arrivalTime || 'À déterminer'}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-gray-600">Bus</p>
          <p className="font-medium">{trip.bus.busNumber}</p>
          <p className="text-xs text-gray-500">{trip.bus.model}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Places disponibles</p>
          <p className={`font-bold text-lg ${
            trip.availableSeats < 10 ? 'text-red-600' : 'text-green-600'
          }`}>
            {trip.availableSeats} / {trip.bus.capacity}
          </p>
        </div>
      </div>

      <button
        onClick={handleSelect}
        disabled={trip.availableSeats < passengers}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          trip.availableSeats < passengers
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        }`}
      >
        {trip.availableSeats < passengers
          ? 'Pas assez de places'
          : 'Réserver ce trajet'}
      </button>
    </div>
  );
}
```

### 4. styles/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 249, 250, 251;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

/* Loading spinner */
.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-left-color: #e96f23;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Seat grid */
.seat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.seat {
  aspect-ratio: 1;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-center;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.seat:hover:not(.seat-booked) {
  border-color: #e96f23;
  transform: scale(1.05);
}

.seat-available {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.seat-selected {
  background-color: #e96f23;
  border-color: #da5419;
  color: white;
}

.seat-booked {
  background-color: #e5e7eb;
  border-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
```

## Additional Pages to Implement

### app/search/page.js
- Fetch and display trip results
- Show loading state
- Handle empty results
- Filter and sort options

### app/booking/page.js
- Multi-step booking form:
  1. Seat selection
  2. Passenger information
  3. Luggage details
  4. Payment method
  5. Review and confirm

### app/confirmation/page.js
- Show booking details
- Display booking code
- WhatsApp sharing option
- Print ticket option

### app/my-bookings/page.js
- List user's bookings
- Filter by status
- View booking details
- Cancel booking option

### app/admin/
- Login page
- Dashboard with stats
- Routes management
- Buses management
- Trips creation
- Bookings overview
- Payment confirmation

## State Management Pattern

Use React hooks for local state and consider Zustand for global state:

```javascript
// lib/store.js
import { create } from 'zustand';

export const useBookingStore = create((set) => ({
  bookingData: null,
  setBookingData: (data) => set({ bookingData: data }),
  clearBookingData: () => set({ bookingData: null }),
}));

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

## Mobile Responsiveness

All components should be mobile-first with these breakpoints:
- sm: 640px (phone landscape)
- md: 768px (tablet)
- lg: 1024px (desktop)

## PWA Configuration

Create public/manifest.json:

```json
{
  "name": "Bus Tchad",
  "short_name": "Bus Tchad",
  "description": "Réservation de billets de bus au Tchad",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#e96f23",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Error Handling Pattern

```javascript
// lib/utils.js
export function handleAPIError(error) {
  if (error.response) {
    // Server responded with error
    return error.response.data.message || 'Une erreur est survenue';
  } else if (error.request) {
    // No response from server
    return 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
  } else {
    return error.message || 'Une erreur inattendue est survenue';
  }
}
```

## Testing Checklist

- [ ] Search form validation
- [ ] Trip selection flow
- [ ] Seat selection (max passengers)
- [ ] Passenger form validation
- [ ] Luggage calculation
- [ ] Payment method selection
- [ ] Booking confirmation
- [ ] WhatsApp notification mock
- [ ] Admin login
- [ ] Admin CRUD operations
- [ ] Mobile responsiveness (all breakpoints)
- [ ] Offline behavior
- [ ] Error states
- [ ] Loading states

## Deployment

For production deployment:

1. Build the app: `npm run build`
2. Set environment variables in production
3. Deploy to Vercel, Netlify, or similar
4. Configure custom domain
5. Enable HTTPS
6. Set up monitoring

## Performance Optimization

- Use Next.js Image component for images
- Implement lazy loading for routes
- Cache API responses where appropriate
- Minimize bundle size
- Use server-side rendering for SEO

This guide provides the complete frontend structure and implementation patterns for the Bus Tchad ticketing system.
