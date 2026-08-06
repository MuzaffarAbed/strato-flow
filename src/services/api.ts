import axios, { type AxiosResponse } from 'axios';
import type { ApiResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            token: localStorage.getItem('token'),
            refreshToken,
          });
          if (data.success && data.data) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            error.config.headers.Authorization = `Bearer ${data.data.token}`;
            return api(error.config);
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message || 'Request failed');
  }
  return response.data.data;
}
