import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { useToast } from '../components/Toast';

const Logo = () => (
    <div className="auth-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>StockSense</span>
    </div>
);

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login, demoLogin, loading } = useContext(AuthContext);
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login(formData);
            if (result.success) {
                addToast(`Welcome back, ${result.user.name}!`);
                navigate(from, { replace: true });
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    const handleQuickDemo = (role) => {
        const demo = demoLogin(role);
        addToast(`Signed in as ${demo.name} (${role === 'inventory_manager' ? 'Manager' : 'Staff'})`);
        navigate(from, { replace: true });
    };

    return (
        <div className="auth-container">
            {/* Left Side */}
            <div className="auth-left">
                <div className="auth-form-wrapper">
                    <Logo />
                    <span className="welcome-label">WELCOME BACK</span>
                    <h1 className="auth-heading">Your inventory memory, connected.</h1>
                    <p className="auth-subheading">Sign in with your StockSense API account.</p>

                    {error && <div className="error-text">{error}</div>}
                    
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
                                    placeholder="you@company.com"
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    required 
                                    id="login-email-input"
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
                                    placeholder="Enter your password"
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    required 
                                    id="login-password-input"
                                />
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-group">
                                <input type="checkbox" defaultChecked /> Remember me
                            </label>
                            <Link to="/forgot-password">Forgot password?</Link>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} id="btn-login-submit">
                            {loading ? 'Signing in...' : 'Sign in to dashboard →'}
                        </button>
                    </form>

                    {/* Quick 1-Click Demo Login options */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                            Instant Demo Login:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button 
                                type="button"
                                onClick={() => handleQuickDemo('inventory_manager')}
                                className="btn btn-secondary btn-sm"
                                id="btn-demo-manager"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 10px' }}
                            >
                                <ShieldCheck size={14} color="var(--primary)" />
                                <span>Manager Role</span>
                            </button>

                            <button 
                                type="button"
                                onClick={() => handleQuickDemo('warehouse_staff')}
                                className="btn btn-secondary btn-sm"
                                id="btn-demo-staff"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 10px' }}
                            >
                                <UserCheck size={14} color="var(--success)" />
                                <span>Staff Role</span>
                            </button>
                        </div>
                    </div>

                    <div className="auth-footer-text">
                        Don't have an account? <br/>
                        <Link to="/signup" style={{ display: 'inline-block', marginTop: '8px' }}>Create Account</Link>
                    </div>

                    <div className="auth-secure-text">
                        Secure access powered by StockSense
                    </div>
                </div>
            </div>

            {/* Right Side - Exactly matching screenshot */}
            <div className="auth-right">
                <div className="auth-right-content">
                    <Logo />
                    <h2 className="auth-right-heading">Bring clarity to every inventory decision.</h2>
                    <p className="auth-right-subheading">
                        Turn your team's scattered data into an intelligent, searchable memory.
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

export default Login;
