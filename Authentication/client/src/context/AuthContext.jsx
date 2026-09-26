import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const data = await authService.getCurrentUser();
                if (data && data.success) {
                    // Update user with token from local storage to keep it active
                    const storedUser = JSON.parse(localStorage.getItem('user'));
                    setUser({ ...data.user, token: storedUser.token });
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Failed to load user', error);
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (userData) => {
        setLoading(true);
        try {
            const data = await authService.login(userData);
            setUser(data.user);
            setIsAuthenticated(true);
            return data;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        setLoading(true);
        try {
            const data = await authService.signup(userData);
            return data;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
