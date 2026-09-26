import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const Logo = () => (
    <div className="auth-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>StockSense</span>
    </div>
);

const VerifyOTP = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';
    const demoOtp = location.state?.demoOtp || '';

    const [otp, setOtp] = useState(demoOtp || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState('');

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await authService.verifyOTP({ email, otp });
            if (result.success) {
                navigate('/reset-password', { state: { email, otp } });
            } else {
                setError(result.message || 'Invalid OTP');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setResendLoading(true);
        setResendSuccess('');
        try {
            const res = await authService.sendOTP(email);
            if (res.demoOtp) {
                setOtp(res.demoOtp);
            }
            setResendSuccess('OTP resent successfully!');
        } catch (err) {
            setError('Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Left Side */}
            <div className="auth-left">
                <div className="auth-form-wrapper">
                    <Logo />
                    <span className="welcome-label">Security Check</span>
                    <h1 className="auth-heading">Enter verification code.</h1>
                    <p className="auth-subheading">
                        We sent a 6-digit verification code to <strong>{email}</strong>
                    </p>

                    {error && <div className="error-text">{error}</div>}
                    {resendSuccess && (
                        <div style={{ color: '#059669', fontSize: '0.875rem', marginBottom: '16px', padding: '10px', background: '#d1fae5', borderLeft: '4px solid #059669', borderRadius: '4px' }}>
                            {resendSuccess}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>6-Digit Code</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                <input 
                                    type="text" 
                                    placeholder="Enter OTP (e.g. 123456)" 
                                    value={otp} 
                                    maxLength="6"
                                    onChange={(e) => setOtp(e.target.value)} 
                                    required 
                                    style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center' }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Code →'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>Didn't receive the code? </span>
                        <button 
                            type="button"
                            onClick={handleResend} 
                            disabled={resendLoading}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--primary)', 
                                fontWeight: '600', 
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                padding: 0
                            }}
                        >
                            {resendLoading ? 'Sending...' : 'Resend Code'}
                        </button>
                    </div>

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

export default VerifyOTP;
