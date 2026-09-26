import api from './api';

export const login = async (credentials) => {
    const data = await api.post('/auth/login', credentials);
    if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
};

export const signup = async (userData) => {
    return api.post('/auth/signup', userData);
};

export const getCurrentUser = async () => {
    return api.get('/auth/me');
};

export const logout = async () => {
    localStorage.removeItem('user');
    return api.post('/auth/logout');
};

export const sendOTP = async (email) => {
    return api.post('/auth/send-otp', { email });
};

export const verifyOTP = async (data) => {
    return api.post('/auth/verify-otp', data);
};

export const resetPassword = async (data) => {
    return api.post('/auth/reset-password', data);
};

const authService = {
    login,
    signup,
    getCurrentUser,
    logout,
    sendOTP,
    verifyOTP,
    resetPassword
};

export default authService;
