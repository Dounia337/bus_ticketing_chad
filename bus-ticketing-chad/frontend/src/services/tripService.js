import api from '../lib/api';

export const tripService = {
  searchTrips: (origin, destination, date) => 
    api.get('/trips/search', { params: { origin, destination, date } }),
  getTripDetails: (id) => api.get(`/trips/${id}`),
  getCities: () => api.get('/trips/cities'),
};
