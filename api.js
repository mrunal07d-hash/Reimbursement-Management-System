import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// Users
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getManagers: () => api.get('/users/managers/list'),
};

// Expenses
export const expensesAPI = {
  submit: (data) => api.post('/expenses', data),
  getMy: (params) => api.get('/expenses/my', { params }),
  getAll: (params) => api.get('/expenses/all', { params }),
  getTeam: (params) => api.get('/expenses/team', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  getPending: () => api.get('/expenses/pending-approvals'),
  getDashboard: () => api.get('/expenses/dashboard'),
  uploadReceipt: (formData) => api.post('/expenses/upload-receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Approvals
export const approvalsAPI = {
  approve: (id, data) => api.post(`/approvals/${id}/approve`, data),
  reject: (id, data) => api.post(`/approvals/${id}/reject`, data),
  override: (id, data) => api.post(`/approvals/${id}/override`, data),
};

// Company
export const companyAPI = {
  get: () => api.get('/company'),
  update: (data) => api.put('/company', data),
  getRules: () => api.get('/company/rules'),
  createRule: (data) => api.post('/company/rules', data),
  updateRule: (ruleId, data) => api.put(`/company/rules/${ruleId}`, data),
  deleteRule: (ruleId) => api.delete(`/company/rules/${ruleId}`),
};

// Currency
export const currencyAPI = {
  getAll: () => api.get('/currency/all'),
  convert: (params) => api.get('/currency/convert', { params }),
};

export default api;
