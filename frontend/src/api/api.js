import axios from 'axios';

// For deployment: set VITE_API_URL to your backend URL (e.g. https://api.yourdomain.com)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = API_BASE_URL;

const API = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 30000,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (err) => Promise.reject(err));

API.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            // Don't redirect when 401 is from auth attempts (sign-in, sign-up, etc.)
            // User should stay on the form to see the error message
            const authEndpoints = ['/auth/student/signin', '/auth/student/signup', '/auth/student/verify-otp', '/auth/student/resend-otp', '/auth/admin/relogin', '/auth/forgot-password'];
            const isAuthAttempt = authEndpoints.some(ep => err.config?.url?.includes(ep));
            if (!isAuthAttempt) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        }
        return Promise.reject(err);
    }
);

// Student Auth
export const studentSignUp = (data) => API.post('/auth/student/signup', data);
export const verifyOtp = (data) => API.post('/auth/student/verify-otp', data);
export const resendOtp = (data) => API.post('/auth/student/resend-otp', data);
export const studentSignIn = (data) => API.post('/auth/student/signin', data);

// Admin Auth — first-time registration (multipart - ID card upload)
export const adminLogin = (formData) => API.post('/auth/admin/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Admin Auth — returning admin re-login (email + password)
export const adminReLogin = (data) => API.post('/auth/admin/relogin', data);

// Admin reset password (authenticated)
export const adminResetPassword = (data) => API.post('/auth/admin/reset-password', data);

// User
export const getMe = () => API.get('/auth/me');

// Forgot Password
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);

// Clubs (for admin dropdown)
export const getActiveClubs = () => API.get('/clubs');

// Events
export const getAllEvents = () => API.get('/events');
export const getEventById = (id) => API.get(`/events/${id}`);
export const createEvent = (formData) => API.post('/events', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateEvent = (id, formData) => API.put(`/events/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteEvent = (id) => API.delete(`/events/${id}`);

// Payments & Registration
export const createPaymentOrder = (data) => API.post('/payments/create-order', data);
export const verifyPayment = (data) => API.post('/payments/verify', data);
export const registerFreeEvent = (data) => API.post('/payments/register-free', data);
export const getMyRegistrations = () => API.get('/payments/my-registrations');
export const getEventRegistrations = (eventId) => API.get(`/payments/event/${eventId}/registrations`);

export default API;
