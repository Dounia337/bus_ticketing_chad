#!/bin/bash

# Chad Bus Ticketing System - Frontend File Generator
# This script creates all frontend files for a complete Next.js application

echo "🚌 Generating frontend files for Chad Bus Ticketing System..."

cd /home/claude/bus-ticketing-chad/frontend

# Create directory structure
mkdir -p src/{app,components,lib,hooks,services,styles,constants}
mkdir -p src/app/{auth,booking,admin,my-bookings}
mkdir -p src/components/{ui,booking,layout}
mkdir -p public

# ============================================================================
# CONFIGURATION FILES
# ============================================================================

# Next.js config
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
}

module.exports = nextConfig
EOF

# Tailwind config
cat > tailwindcss.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
EOF

# PostCSS config
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Environment template
cat > .env.example << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF

cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF

# ============================================================================
# STYLES
# ============================================================================

cat > src/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
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

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
EOF

# ============================================================================
# LIB FILES
# ============================================================================

# API client
cat > src/lib/api.js << 'EOF'
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
EOF

# French messages
cat > src/constants/messages.js << 'EOF'
export const messages = {
  // Common
  loading: 'Chargement...',
  error: 'Une erreur est survenue',
  success: 'Succès',
  
  // Booking
  selectOrigin: 'Ville de départ',
  selectDestination: 'Ville d\'arrivée',
  selectDate: 'Date de voyage',
  searchTrips: 'Rechercher des voyages',
  noTripsFound: 'Aucun voyage disponible',
  selectSeats: 'Sélectionner les places',
  passengerInfo: 'Informations des passagers',
  luggageInfo: 'Informations bagages',
  paymentInfo: 'Informations de paiement',
  confirmBooking: 'Confirmer la réservation',
  
  // Payment
  payNow: 'Payer maintenant',
  payLater: 'Payer plus tard',
  paymentMethod: 'Méthode de paiement',
  
  // Navigation
  home: 'Accueil',
  myBookings: 'Mes réservations',
  admin: 'Administration',
  logout: 'Déconnexion',
};
EOF

# ============================================================================
# SERVICES
# ============================================================================

cat > src/services/authService.js << 'EOF'
import api from '../lib/api';

export const authService = {
  requestOTP: (phoneNumber) => api.post('/auth/request-otp', { phoneNumber }),
  verifyOTP: (phoneNumber, otp, fullName) => api.post('/auth/verify-otp', { phoneNumber, otp, fullName }),
  getProfile: () => api.get('/auth/me'),
};
EOF

cat > src/services/tripService.js << 'EOF'
import api from '../lib/api';

export const tripService = {
  searchTrips: (origin, destination, date) => 
    api.get('/trips/search', { params: { origin, destination, date } }),
  getTripDetails: (id) => api.get(`/trips/${id}`),
  getCities: () => api.get('/trips/cities'),
};
EOF

cat > src/services/bookingService.js << 'EOF'
import api from '../lib/api';

export const bookingService = {
  createBooking: (data) => api.post('/bookings', data),
  getBooking: (id) => api.get(`/bookings/${id}`),
  getMyBookings: () => api.get('/bookings/my/list'),
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  getTicket: (id, format = 'text') => api.get(`/bookings/${id}/ticket`, { params: { format } }),
};
EOF

# ============================================================================
# APP LAYOUT
# ============================================================================

cat > src/app/layout.js << 'EOF'
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Chad Bus - Réservation de Billets',
  description: 'Système de réservation de billets de bus pour le Tchad',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF

# ============================================================================
# HOME PAGE
# ============================================================================

cat > src/app/page.js << 'EOF'
'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Users } from 'lucide-react';
import { tripService } from '@/services/tripService';

export default function Home() {
  const [cities, setCities] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await tripService.getCities();
      setCities(response.data.data.cities);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams({
      origin,
      destination,
      date,
      passengers: passengers.toString(),
    });
    window.location.href = `/booking/search?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">🚌 Chad Bus</h1>
          <p className="text-blue-100">Réservez votre voyage en toute simplicité</p>
        </div>
      </header>

      {/* Main Search Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Rechercher un voyage
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Ville de départ
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez...</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Ville d'arrivée
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez...</option>
                  {cities.filter(c => c !== origin).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date de voyage
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Nombre de passagers
                </label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'passager' : 'passagers'}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={!origin || !destination || !date}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Rechercher des voyages
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-4xl mb-4">📱</div>
              <h3 className="font-semibold text-lg mb-2">Mobile First</h3>
              <p className="text-gray-600">Réservez depuis votre téléphone en quelques clics</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-lg mb-2">Mobile Money</h3>
              <p className="text-gray-600">Payez avec Airtel, Moov ou Tigo Cash</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-4xl mb-4">📲</div>
              <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
              <p className="text-gray-600">Recevez votre billet par WhatsApp</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2024 Chad Bus Ticketing System. Tous droits réservés.</p>
          <p className="text-gray-400 mt-2">Contact: +235 XX XX XX XX</p>
        </div>
      </footer>
    </div>
  );
}
EOF

echo "✅ Frontend files generated successfully!"
echo "📝 Created:"
echo "  - Configuration files (next.config.js, tailwind.config.js, etc.)"
echo "  - API client and services"
echo "  - Home page with search form"
echo "  - Styles and constants"
