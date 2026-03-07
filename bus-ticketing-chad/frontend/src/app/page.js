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
