import axios from 'axios';
import { PUBLIC_AUTH_ENABLED } from './features';

import { resolveApiURL } from './apiConfig.js';

const API = axios.create({
  baseURL: resolveApiURL(import.meta.env.VITE_API_URL, window.location.hostname),
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request Interceptor: Attach the JWT Token to the Authorization Header
API.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo);
        if (parsedUserInfo.token) {
          config.headers.Authorization = `Bearer ${parsedUserInfo.token}`;
        }
      } catch (error) {
        console.error('Error parsing userInfo:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor: Global Error Handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    console.error('API Error Response:', message);
    
    // If status is 401 Unauthorized, logout the user and redirect to Login
    if (error.response?.status === 401 && !['/users/google', '/users/auth', '/users/admin/auth', '/users', '/users/send-otp'].includes(error.config?.url)) {
      localStorage.removeItem('userInfo');
      const loginPath = PUBLIC_AUTH_ENABLED ? '/login' : '/admin/login';
      if (window.location.pathname !== loginPath) {
        window.location.href = `${loginPath}?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
    }
    
    error.message = message;
    return Promise.reject(error);
  }
);

export default API;
