import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/';

const signup = async (userData) => {
    const response = await axios.post(API_URL + 'signup', userData);
    return response.data;
};

const login = async (userData) => {
    const response = await axios.post(API_URL + 'login', userData);
    if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

const logout = async () => {
    localStorage.removeItem('user');
    const response = await axios.post(API_URL + 'logout');
    return response.data;
};

const getCurrentUser = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) return null;

    const config = {
        headers: {
            Authorization: `Bearer ${user.token}`,
        },
    };

    const response = await axios.get(API_URL + 'me', config);
    return response.data;
};

const sendOTP = async (email) => {
    const response = await axios.post(API_URL + 'send-otp', { email });
    return response.data;
};

const verifyOTP = async (data) => {
    const response = await axios.post(API_URL + 'verify-otp', data);
    return response.data;
};

const resetPassword = async (data) => {
    const response = await axios.post(API_URL + 'reset-password', data);
    return response.data;
};

const authService = {
    signup,
    login,
    logout,
    getCurrentUser,
    sendOTP,
    verifyOTP,
    resetPassword
};

export default authService;
