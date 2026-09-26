import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Logo = () => (
    <div className="auth-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>StockSense</span>
    </div>
);

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleQuickDemo = (role) => {
        const isManager = role === 'inventory_manager';
        setFormData({
            email: isManager ? 'adithya@stocksense.io' : 'staff@stocksense.io',
            password: 'Password123!'
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login(formData);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Invalid credentials or server unavailable.');
        }
    };

    return (
        <div className="auth-container">
            {/* Left Side: Compact No-Scroll Login */}
            <div className="auth-left">
                <div className="auth-form-wrapper">
                    <Logo />
                    <span className="welcome-label">WELCOME BACK</span>
                    <h1 className="auth-heading">Inventory memory, connected.</h1>
                    <p className="auth-subheading">Sign in to your StockSense workspace.</p>

                    {error && (
                        <div style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: '#fef2f2',
                            borderLeft: '3px solid #ef4444',
                            color: '#b91c1c',
                            marginBottom: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                        }}>
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email address</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="name@company.com"
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    required 
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                                <input 
                                    type="password" 
                                    name="password" 
                                    placeholder="••••••••"
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-group">
                                <input type="checkbox" defaultChecked /> Remember me
                            </label>
                            <Link to="/forgot-password">Forgot password?</Link>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In →'}
                        </button>
                    </form>

                    {/* Compact 1-Click Demo Credentials Strip */}
                    <div className="demo-strip">
                        <span className="demo-strip-label">Quick Demo:</span>
                        <div className="demo-chip-group">
                            <button 
                                type="button"
                                onClick={() => handleQuickDemo('inventory_manager')}
                                className="demo-chip"
                            >
                                👔 Manager
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleQuickDemo('warehouse_staff')}
                                className="demo-chip"
                            >
                                📦 Staff
                            </button>
                        </div>
                    </div>

                    <div className="auth-footer-text">
                        Don't have an account? <Link to="/signup">Create Account</Link>
                    </div>

                    <div className="auth-secure-text">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0110 0v4"></path>
                        </svg>
                        <span>Encrypted Session • StockSense v2.4</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Visual Brand & Live Telemetry */}
            <div className="auth-right">
                <div className="auth-right-content">
                    <Logo />
                    <h2 className="auth-right-heading">Intelligent Inventory Decision Control.</h2>
                    <p className="auth-right-subheading">
                        Track stock levels, multi-facility transfers, and warehouse audit trails in one unified console.
                    </p>

                    {/* Live Telemetry Preview Card */}
                    <div className="live-telemetry-card">
                        <div className="telemetry-row">
                            <span className="telemetry-label">Network Status</span>
                            <span className="telemetry-value">
                                <span className="pulse-dot"></span>
                                Live Sync Active
                            </span>
                        </div>
                        <div className="telemetry-row">
                            <span className="telemetry-label">Active Warehouses</span>
                            <span className="telemetry-value">4 Facilities</span>
                        </div>
                        <div className="telemetry-row">
                            <span className="telemetry-label">Tracked SKUs</span>
                            <span className="telemetry-value">34,920 Units</span>
                        </div>
                        <div className="telemetry-row">
                            <span className="telemetry-label">Security Protocol</span>
                            <span className="telemetry-value" style={{ color: '#a7f3d0' }}>JWT • RBAC Enabled</span>
                        </div>
                    </div>

                    <div className="badge-row">
                        <div className="badge-pill">
                            <strong>Audit</strong> Real-Time Ledger
                        </div>
                        <div className="badge-pill">
                            <strong>Multi-Site</strong> Stock Sync
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
