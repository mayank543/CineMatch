import axios from 'axios';

// Log the API base URL to verify it's loaded correctly
console.log("🧪 API Base URL:", import.meta.env.VITE_API_BASE_URL);

// Create a configured axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // In production, withCredentials might be needed if your API uses cookies/sessions
  withCredentials: false
});

// Add request interceptor to log requests in development
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`🔄 API Request to: ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;