import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Logo = () => (
    <div className="auth-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            setError(err.response?.data?.message || 'Signup failed');
        }
    };

    return (
        <div className="auth-container">
            {/* Left Side */}
            <div className="auth-left">
                <div className="auth-form-wrapper">
                    <Logo />
                    <span className="welcome-label">Join Us</span>
                    <h1 className="auth-heading">Create your account.</h1>
                    <p className="auth-subheading">Get started with your StockSense API account.</p>

                    {error && <div className="error-text">{error}</div>}
                    
                    <form onSubmit={handleSubmit}>
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
                                    placeholder="John Doe"
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Email address</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="you@company.com"
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    </svg>
                                    <input 
                                        type="password" 
                                        name="confirmPassword" 
                                        placeholder="••••••••"
                                        value={formData.confirmPassword} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Role</label>
                            <div className="input-wrapper">
                                <select 
                                    name="role" 
                                    value={formData.role} 
                                    onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        background: 'white',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    <option value="warehouse_staff">Warehouse Staff</option>
                                    <option value="inventory_manager">Inventory Manager</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Sign up to dashboard →'}
                        </button>
                    </form>

                    <div className="auth-footer-text">
                        Already have an account? <br/>
                        <Link to="/login" style={{ display: 'inline-block', marginTop: '8px' }}>Sign In</Link>
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="auth-right">
                <div className="auth-right-content">
                    <Logo />
                    <h2 className="auth-right-heading">Bring clarity to every inventory decision.</h2>
                    <p className="auth-right-subheading">
                        Turn your team's scattered data into an intelligent, searchable memory.
                    </p>
                    
                    <div className="badges">
                        <div className="badge">
                            <strong>Live</strong> Node.js backend
                        </div>
                        <div className="badge">
                            <strong>Secure</strong> JWT auth
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
