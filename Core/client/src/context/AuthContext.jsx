import React, { createContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('stocksense_user') || localStorage.getItem('user');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null; // Start unauthenticated so user can see and test the Login page!
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            localStorage.setItem('stocksense_user', JSON.stringify(user));
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('stocksense_user');
            localStorage.removeItem('user');
        }
    }, [user]);

    const login = async (credentials) => {
        setLoading(true);
        try {
            const res = await authService.login(credentials);
            if (res.success && res.user) {
                setUser(res.user);
                return res;
            }
            throw new Error(res.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        setLoading(true);
        try {
            const res = await authService.signup(userData);
            if (res.success && res.user) {
                setUser(res.user);
            }
            return res;
        } finally {
            setLoading(false);
        }
    };

    const demoLogin = (role = 'inventory_manager') => {
        const isManager = role === 'inventory_manager';
        const demoUser = {
            id: isManager ? '660000000000000000000001' : '660000000000000000000002',
            _id: isManager ? '660000000000000000000001' : '660000000000000000000002',
            name: isManager ? 'Adithya Kolukulapally' : 'Warehouse Operator',
            email: isManager ? 'adithya@stocksense.io' : 'staff@stocksense.io',
            role: role,
            token: `mock_jwt_token_${role}`
        };
        setUser(demoUser);
        return demoUser;
    };

    const switchRole = () => {
        if (!user) return;
        const newRole = user.role === 'inventory_manager' ? 'warehouse_staff' : 'inventory_manager';
        const newName = newRole === 'inventory_manager' ? 'Adithya Kolukulapally' : 'Warehouse Operator';
        const updated = {
            ...user,
            name: newName,
            role: newRole,
            token: `mock_jwt_token_${newRole}`
        };
        setUser(updated);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('stocksense_user');
        localStorage.removeItem('user');
        try {
            authService.logout();
        } catch (e) {
            // ignore
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            role: user?.role, 
            isAuthenticated: !!user,
            login, 
            signup, 
            logout, 
            switchRole, 
            demoLogin,
            loading 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
