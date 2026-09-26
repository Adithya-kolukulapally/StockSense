import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div>
            <nav className="nav-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px', 
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                    }}>
                        S
                    </div>
                    <h2 style={{ margin: 0, fontWeight: '700' }}>StockSense</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontWeight: '600' }}>{user?.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            {user?.role.replace('_', ' ')}
                        </span>
                    </div>
                    <Link to="/profile" style={{ 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        background: 'rgba(255,255,255,0.1)',
                        fontWeight: '500'
                    }}>
                        Profile
                    </Link>
                    <button onClick={handleLogout} style={{ 
                        padding: '8px 16px', 
                        background: 'rgba(239, 68, 68, 0.2)', 
                        color: 'var(--error)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                        borderRadius: '20px', 
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    >
                        Sign Out
                    </button>
                </div>
            </nav>
            
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Dashboard Overview</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Welcome back to your inventory control center.</p>
                
                <div className="dashboard-grid">
                    <div className="card">
                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '1.5rem' }}>
                            📦
                        </div>
                        <h3 style={{ marginBottom: '10px', fontSize: '1.3rem' }}>Products</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>Manage your inventory items, check stock levels, and update catalog details.</p>
                        <button className="btn-primary">View Products</button>
                    </div>
                    
                    <div className="card">
                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '1.5rem' }}>
                            🔄
                        </div>
                        <h3 style={{ marginBottom: '10px', fontSize: '1.3rem' }}>Operations</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>Track transfers, picking, shelving, and monitor daily warehouse activities.</p>
                        <button className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--success), #16a34a)' }}>View Operations</button>
                    </div>

                    {user?.role === 'inventory_manager' && (
                        <div className="card">
                            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.2)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '1.5rem' }}>
                                📊
                            </div>
                            <h3 style={{ marginBottom: '10px', fontSize: '1.3rem' }}>Reports</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>Generate inventory reports, analyze trends, and view stock valuations.</p>
                            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--secondary), #be185d)' }}>View Reports</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
