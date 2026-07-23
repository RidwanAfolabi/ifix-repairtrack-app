import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'repairtrack_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }

    const data = error.response?.data;
    if (data?.error && data?.code) {
      return Promise.reject(data);
    }

    return Promise.reject({
      error: error.message || 'Network error — please check your connection',
      code: 'NETWORK_ERROR',
    });
  },
);
