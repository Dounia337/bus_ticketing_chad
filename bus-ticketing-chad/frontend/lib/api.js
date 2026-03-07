/**
 * API Client
 * Centralized HTTP client for all API requests
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class APIClient {
  constructor() {
    this.baseURL = API_URL;
  }

  /**
   * Get auth token from localStorage
   */
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  /**
   * Set auth token
   */
  setToken(token) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  }

  /**
   * Remove auth token
   */
  removeToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  }

  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(phoneNumber, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  logout() {
    this.removeToken();
  }

  // Trip endpoints
  async searchTrips(params) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trips/search?${queryString}`);
  }

  async getTrip(id) {
    return this.request(`/trips/${id}`);
  }

  // Booking endpoints
  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getBooking(identifier) {
    return this.request(`/bookings/${identifier}`);
  }

  async getBookings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/bookings?${queryString}`);
  }

  async cancelBooking(id) {
    return this.request(`/bookings/${id}/cancel`, {
      method: 'PUT',
    });
  }

  // Payment endpoints
  async getPaymentStatus(bookingId) {
    return this.request(`/payments/${bookingId}/status`);
  }

  async initiatePayment(bookingId, paymentData) {
    return this.request(`/payments/${bookingId}/initiate`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Admin endpoints
  async getRoutes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/routes?${queryString}`);
  }

  async createRoute(routeData) {
    return this.request('/admin/routes', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  }

  async getBuses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/buses?${queryString}`);
  }

  async createBus(busData) {
    return this.request('/admin/buses', {
      method: 'POST',
      body: JSON.stringify(busData),
    });
  }

  async createTrip(tripData) {
    return this.request('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  }

  async getDashboardStats() {
    return this.request('/admin/dashboard');
  }

  async confirmPayment(bookingId) {
    return this.request(`/payments/${bookingId}/confirm`, {
      method: 'POST',
    });
  }
}

export const api = new APIClient();
