import api from '../lib/api';

export const authService = {
  requestOTP: (phoneNumber) => api.post('/auth/request-otp', { phoneNumber }),
  verifyOTP: (phoneNumber, otp, fullName) => api.post('/auth/verify-otp', { phoneNumber, otp, fullName }),
  getProfile: () => api.get('/auth/me'),
};
