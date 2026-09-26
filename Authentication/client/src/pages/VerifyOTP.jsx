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

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

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
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setResendLoading(true);
        try {
            await authService.sendOTP(email);
            alert('OTP resent successfully');
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
                    <span className="welcome-label">Verify</span>
                    <h1 className="auth-heading">Check your email.</h1>
                    <p className="auth-subheading">
                        We sent a 6-digit verification code to <strong>{email}</strong>.
                    </p>

                    {error && <div className="error-text">{error}</div>}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Verification Code</label>
                            <input 
                                type="text" 
                                maxLength="6"
                                placeholder="000000" 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                                required 
                                style={{ 
                                    width: '100%', 
                                    padding: '16px', 
                                    textAlign: 'center', 
                                    letterSpacing: '8px', 
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    color: 'var(--text-dark)'
                                }} 
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify Code →'}
                        </button>
                    </form>

                    <div className="auth-footer-text">
                        Didn't receive it?{' '}
                        <button 
                            onClick={handleResend} 
                            disabled={resendLoading} 
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--primary)', 
                                cursor: 'pointer', 
                                fontWeight: '600',
                                fontSize: 'inherit',
                                textDecoration: 'underline'
                            }}
                        >
                            {resendLoading ? 'Resending...' : 'Resend OTP'}
                        </button>
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
