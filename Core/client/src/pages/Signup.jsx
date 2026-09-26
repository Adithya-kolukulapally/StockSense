import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';

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
    const { addToast } = useToast();
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
                addToast('Account created successfully! Please sign in.');
                navigate('/login');
            } else {
                setError(result.message || 'Signup failed');
            }
        } catch (err) {
            setError(err.message || 'Signup failed');
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

                        <div className="input-group">
                            <label>Role</label>
                            <div className="input-wrapper">
                                <select 
                                    name="role" 
                                    value={formData.role} 
                                    onChange={handleChange}
                                >
                                    <option value="warehouse_staff">Warehouse Staff (Operate & Move)</option>
                                    <option value="inventory_manager">Inventory Manager (Full Control)</option>
                                </select>
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
                                    placeholder="Create a password"
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    required 
                                    minLength="6"
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
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    required 
                                    minLength="6"
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </form>

                    <div className="auth-footer-text">
                        Already have an account? <br/>
                        <Link to="/login" style={{ display: 'inline-block', marginTop: '8px' }}>Sign in instead</Link>
                    </div>

                    <div className="auth-secure-text">
                        Secure access powered by StockSense
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="auth-right">
                <div className="auth-right-content">
                    <Logo />
                    <h2 className="auth-right-heading">Scale your logistics with precision.</h2>
                    <p className="auth-right-subheading">
                        Join teams streamlining multi-warehouse operations with verified audit trails.
                    </p>
                    
                    <div className="badges">
                        <div className="badge-pill">
                            <strong>Live</strong> Node.js backend
                        </div>
                        <div className="badge-pill">
                            <strong>Secure</strong> JWT auth
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
