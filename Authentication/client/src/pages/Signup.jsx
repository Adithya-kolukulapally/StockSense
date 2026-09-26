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

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'warehouse_staff'
    });
    const [error, setError] = useState('');
    const { signup, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            if (formData.password.length < 6) {
                return setError('Password must be at least 6 characters');
            }

            const result = await signup({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            if (result.success) {
                navigate('/login');
            } else {
                setError(result.message || 'Signup failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Signup failed. Please check inputs or server status.');
        }
    };

    return (
        <div className="auth-container">
            {/* Left Side: Compact No-Scroll Signup */}
            <div className="auth-left">
                <div className="auth-form-wrapper">
                    <Logo />
                    <span className="welcome-label">CREATE WORKSPACE</span>
                    <h1 className="auth-heading">Join StockSense.</h1>
                    <p className="auth-subheading">Enterprise inventory memory for high-velocity teams.</p>

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
                        {/* Row 1: Name and Role side-by-side */}
                        <div className="auth-grid-2">
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        placeholder="Alex Mercer"
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        required 
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Assigned Role</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                    <select 
                                        name="role" 
                                        value={formData.role} 
                                        onChange={handleChange}
                                    >
                                        <option value="warehouse_staff">Warehouse Staff</option>
                                        <option value="inventory_manager">Inventory Manager</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Email */}
                        <div className="input-group">
                            <label>Email address</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="alex@company.com"
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Row 3: Password and Confirm Password side-by-side */}
                        <div className="auth-grid-2">
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
                                        placeholder="Min 6 chars"
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                    <input 
                                        type="password" 
                                        name="confirmPassword" 
                                        placeholder="Repeat password"
                                        value={formData.confirmPassword} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '4px' }}>
                            {loading ? 'Creating Account...' : 'Create Account →'}
                        </button>
                    </form>

                    <div className="auth-footer-text">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </div>

                    <div className="auth-secure-text">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <h2 className="auth-right-heading">Scale logistics with instant clarity.</h2>
                    <p className="auth-right-subheading">
                        Join teams orchestrating multi-facility stock, automated ledger trails, and inventory safety thresholds.
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

export default Signup;

