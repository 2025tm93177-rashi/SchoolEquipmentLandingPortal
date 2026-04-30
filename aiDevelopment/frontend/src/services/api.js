import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add JWT token
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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear localStorage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  setupPassword: (data) => api.post('/auth/setup-password', data)
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
  changePassword: (data) => api.put('/users/change-password', data)
};

// Equipment API
export const equipmentAPI = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  getStats: () => api.get('/equipment/stats'),
  getCategories: () => api.get('/equipment/categories')
};

// Requests API
export const requestsAPI = {
  create: (data) => api.post('/requests', data),
  getMyRequests: (params) => api.get('/requests/my-requests', { params }),
  getAll: (params) => api.get('/requests/all', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  approve: (id, data) => api.put(`/requests/${id}/approve`, data),
  deny: (id, data) => api.put(`/requests/${id}/deny`, data),
  cancel: (id) => api.delete(`/requests/${id}`),
  getStats: () => api.get('/requests/statistics')
};

export default api;
