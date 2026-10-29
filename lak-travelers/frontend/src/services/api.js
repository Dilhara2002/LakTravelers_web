import axios from 'axios';

/**
 * 🚀 Automatically determine the Base API URL
 */
const getBaseURL = () => {
  // 1. Use VITE_API_URL if it exists in the .env file
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  
  // 2. Default to localhost port 5001 if working locally
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://localhost:5001/api";
  }

  // 3. Same-origin fallback for deployments that proxy /api to the backend.
  return "/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
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
    if (error.response?.status === 401) {
      localStorage.removeItem('userInfo');
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
    }
    
    error.message = message;
    return Promise.reject(error);
  }
);

export default API;
