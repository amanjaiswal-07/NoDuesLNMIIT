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

// ── Response interceptor ──
// Transient failures (network, 5xx) are passed through untouched so a Refresh never logs
// anyone out. Only a 401 — the session itself is no longer valid (expired token, or an
// admin removed this person's access) — clears the session and returns to the login page.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && localStorage.getItem('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/') {
                sessionStorage.setItem('loginNotice', error.response.data?.error || 'Your session has ended. Please sign in again.');
                window.location.assign('/');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
