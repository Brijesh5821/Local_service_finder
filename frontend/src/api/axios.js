import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
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

// Response interceptor for API calls to normalize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data && error.response.data.detail) {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        error.response.data.detail = detail
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item && item.msg) {
              const field = item.loc && item.loc.length > 0 ? item.loc[item.loc.length - 1] : '';
              return field ? `${field}: ${item.msg}` : item.msg;
            }
            return JSON.stringify(item);
          })
          .join(' | ');
      } else if (typeof detail === 'object' && detail !== null) {
        error.response.data.detail = detail.msg || detail.message || JSON.stringify(detail);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
