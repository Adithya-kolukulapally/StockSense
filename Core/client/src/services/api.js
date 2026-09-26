import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to attach JWT token and user info
api.interceptors.request.use(
    (config) => {
        const storedUser = localStorage.getItem('stocksense_user') || localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed.token) {
                    config.headers.Authorization = `Bearer ${parsed.token}`;
                }
                config.headers['x-dev-user'] = JSON.stringify(parsed);
            } catch (e) {
                // ignore
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const errorData = error.response?.data || {
            success: false,
            message: error.message || 'Network error occurred',
            code: 'NETWORK_ERROR'
        };
        return Promise.reject(errorData);
    }
);

export default api;
