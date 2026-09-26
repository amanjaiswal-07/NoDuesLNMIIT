import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

// ── Request interceptor: attach JWT from localStorage to every outgoing request ──
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor: PASS-THROUGH ONLY ──
// DO NOT auto-redirect or clear tokens here.
// Auth decisions (navigate to '/') are made explicitly per-component.
// Doing it globally causes the Refresh button to log out the user on any transient error.
api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

export default api;
