import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Logo = () => (
    <div className="auth-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>StockSense</span>
    </div>
);

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const result = await authService.sendOTP(email);
            if (result.success) {
                navigate('/verify-otp', { state: { email } });
            } else {
                setError(result.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Left Side */}
            <div className="auth-left">
                <div className="auth-form-wrapper">
                    <Logo />
                    <span className="welcome-label">Recovery</span>
                    <h1 className="auth-heading">Reset your password.</h1>
                    <p className="auth-subheading">Enter your registered email address and we'll send you a verification code.</p>

                    {error && <div className="error-text">{error}</div>}
                    {message && (
                        <div style={{ color: '#059669', fontSize: '0.875rem', marginBottom: '16px', padding: '10px', background: '#d1fae5', borderLeft: '4px solid #059669', borderRadius: '4px' }}>
                            {message}
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
                                    placeholder="you@company.com" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Sending Code...' : 'Send Verification Code →'}
                        </button>
                    </form>

                    <div className="auth-footer-text">
                        <Link to="/login">Back to Sign In</Link>
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

export default ForgotPassword;
