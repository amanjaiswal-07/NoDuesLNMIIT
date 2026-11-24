/**
 * client.js — the shared axios instance for all API calls.
 * Adds the saved JWT to every request. Only a 401 (session no longer valid — expired or access
 * removed) logs the user out and returns to the login page with the reason; network errors and
 * 5xx responses are left to each page so a hiccup never signs anyone out.
 *
 * TEMPORARY (live demo): the login is kept in sessionStorage instead of localStorage, so every
 * browser tab has its own login and different roles can be open side by side. Revert the commit
 * "temp: per-tab login for live demo" to go back to the shared localStorage login.
 */

import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

// ── Request interceptor: attach JWT from sessionStorage to every outgoing request ──
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
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
        if (error.response?.status === 401 && sessionStorage.getItem('token')) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            if (window.location.pathname !== '/') {
                sessionStorage.setItem('loginNotice', error.response.data?.error || 'Your session has ended. Please sign in again.');
                window.location.assign('/');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
