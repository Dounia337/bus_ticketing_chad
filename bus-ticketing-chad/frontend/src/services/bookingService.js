import api from '../lib/api';

export const bookingService = {
  createBooking: (data) => api.post('/bookings', data),
  getBooking: (id) => api.get(`/bookings/${id}`),
  getMyBookings: () => api.get('/bookings/my/list'),
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  getTicket: (id, format = 'text') => api.get(`/bookings/${id}/ticket`, { params: { format } }),
};
