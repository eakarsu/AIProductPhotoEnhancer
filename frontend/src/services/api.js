import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  requestPasswordReset: (email) => api.post('/auth/password-reset/request', { email }),
  confirmPasswordReset: (token, password) => api.post('/auth/password-reset/confirm', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification'),
};

// Profile
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  changePassword: (currentPassword, newPassword) => api.put('/profile/password', { currentPassword, newPassword }),
  deleteAccount: (password) => api.delete('/profile', { data: { password } }),
};

// Upload
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Activity
export const activityAPI = {
  getRecent: (limit = 10) => api.get(`/activity/recent?limit=${limit}`),
  getStats: () => api.get('/activity/stats')
};

// Products
export const productsAPI = {
  getAll: () => api.get('/products'),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

// Background Removal
export const backgroundRemovalAPI = {
  getAll: () => api.get('/background-removal'),
  getOne: (id) => api.get(`/background-removal/${id}`),
  create: (data) => api.post('/background-removal', data),
  update: (id, data) => api.put(`/background-removal/${id}`, data),
  delete: (id) => api.delete(`/background-removal/${id}`),
  analyze: (id, data) => api.post(`/background-removal/${id}/analyze`, data)
};

// Enhancements
export const enhancementsAPI = {
  getAll: () => api.get('/enhancements'),
  getOne: (id) => api.get(`/enhancements/${id}`),
  create: (data) => api.post('/enhancements', data),
  update: (id, data) => api.put(`/enhancements/${id}`, data),
  delete: (id) => api.delete(`/enhancements/${id}`),
  analyze: (id, data) => api.post(`/enhancements/${id}/analyze`, data)
};

// Lifestyle Shots
export const lifestyleShotsAPI = {
  getAll: () => api.get('/lifestyle-shots'),
  getOne: (id) => api.get(`/lifestyle-shots/${id}`),
  create: (data) => api.post('/lifestyle-shots', data),
  update: (id, data) => api.put(`/lifestyle-shots/${id}`, data),
  delete: (id) => api.delete(`/lifestyle-shots/${id}`),
  regenerate: (id, data) => api.post(`/lifestyle-shots/${id}/regenerate`, data)
};

// Color Analysis
export const colorAnalysisAPI = {
  getAll: () => api.get('/color-analysis'),
  getOne: (id) => api.get(`/color-analysis/${id}`),
  create: (data) => api.post('/color-analysis', data),
  delete: (id) => api.delete(`/color-analysis/${id}`),
  analyze: (id, data) => api.post(`/color-analysis/${id}/analyze`, data)
};

// Quality Assessment
export const qualityAssessmentAPI = {
  getAll: () => api.get('/quality-assessment'),
  getOne: (id) => api.get(`/quality-assessment/${id}`),
  create: (data) => api.post('/quality-assessment', data),
  delete: (id) => api.delete(`/quality-assessment/${id}`),
  assess: (id, data) => api.post(`/quality-assessment/${id}/assess`, data)
};

// Product Descriptions
export const productDescriptionsAPI = {
  getAll: () => api.get('/product-descriptions'),
  getOne: (id) => api.get(`/product-descriptions/${id}`),
  create: (data) => api.post('/product-descriptions', data),
  delete: (id) => api.delete(`/product-descriptions/${id}`),
  regenerate: (id, data) => api.post(`/product-descriptions/${id}/regenerate`, data)
};

// Size Reference
export const sizeReferenceAPI = {
  getAll: () => api.get('/size-reference'),
  getOne: (id) => api.get(`/size-reference/${id}`),
  create: (data) => api.post('/size-reference', data),
  update: (id, data) => api.put(`/size-reference/${id}`, data),
  delete: (id) => api.delete(`/size-reference/${id}`),
  analyze: (id, data) => api.post(`/size-reference/${id}/analyze`, data)
};

// 360 View
export const view360API = {
  getAll: () => api.get('/view-360'),
  getOne: (id) => api.get(`/view-360/${id}`),
  create: (data) => api.post('/view-360', data),
  update: (id, data) => api.put(`/view-360/${id}`, data),
  delete: (id) => api.delete(`/view-360/${id}`),
  analyze: (id, data) => api.post(`/view-360/${id}/analyze`, data)
};

// Size Recommender
export const sizeRecommenderAPI = {
  getAll: () => api.get('/size-recommender'),
  getOne: (id) => api.get(`/size-recommender/${id}`),
  create: (data) => api.post('/size-recommender', data),
  update: (id, data) => api.put(`/size-recommender/${id}`, data),
  delete: (id) => api.delete(`/size-recommender/${id}`),
  analyze: (id, data) => api.post(`/size-recommender/${id}/analyze`, data)
};

// Gift Suggester
export const giftSuggesterAPI = {
  getAll: () => api.get('/gift-suggester'),
  getOne: (id) => api.get(`/gift-suggester/${id}`),
  create: (data) => api.post('/gift-suggester', data),
  update: (id, data) => api.put(`/gift-suggester/${id}`, data),
  delete: (id) => api.delete(`/gift-suggester/${id}`),
  analyze: (id, data) => api.post(`/gift-suggester/${id}/analyze`, data)
};

// Return Predictor
export const returnPredictorAPI = {
  getAll: () => api.get('/return-predictor'),
  getOne: (id) => api.get(`/return-predictor/${id}`),
  create: (data) => api.post('/return-predictor', data),
  update: (id, data) => api.put(`/return-predictor/${id}`, data),
  delete: (id) => api.delete(`/return-predictor/${id}`),
  analyze: (id, data) => api.post(`/return-predictor/${id}/analyze`, data)
};

export default api;
