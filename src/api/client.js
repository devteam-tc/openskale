const API_BASE = 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// ============ Auth API ============
export const authAPI = {
  signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// ============ Payment Methods API ============
export const paymentAPI = {
  getAll: () => request('/payment-methods'),
  add: (data) => request('/payment-methods', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id) => request(`/payment-methods/${id}`, { method: 'DELETE' }),
  setDefault: (id) => request(`/payment-methods/${id}/default`, { method: 'PUT' }),
};

// ============ Passengers API ============
export const passengerAPI = {
  getAll: () => request('/passengers'),
  add: (data) => request('/passengers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/passengers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/passengers/${id}`, { method: 'DELETE' }),
};

// ============ Trains API ============
export const trainAPI = {
  search: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/trains/search?${query}`);
  },
  getStations: () => request('/trains/stations'),
  getAvailability: (trainId, params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/trains/${trainId}/availability?${query}`);
  },
};

// ============ Bookings API ============
export const bookingAPI = {
  create: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => request('/bookings'),
  getById: (id) => request(`/bookings/${id}`),
  cancel: (id) => request(`/bookings/${id}/cancel`, { method: 'PUT' }),
};

// ============ Admin API ============
export const adminAPI = {
  addTrain: (data) => request('/admin/trains', { method: 'POST', body: JSON.stringify(data) }),
  getTrains: () => request('/admin/trains'),
  addStation: (data) => request('/admin/stations', { method: 'POST', body: JSON.stringify(data) }),
  getDashboard: () => request('/admin/dashboard'),
};
