import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="centered-container">
            <div className="glass-panel" style={{ width: '100%', maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)'
                    }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{user?.name || 'Operator'}</h2>
                        <span style={{ 
                            display: 'inline-block',
                            marginTop: '8px',
                            padding: '4px 12px',
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: 'var(--primary)',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                        }}>
                            {user?.role?.replace('_', ' ') || 'Warehouse Staff'}
                        </span>
                    </div>
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '4px' }}>Email Address</p>
                        <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>{user?.email || 'operator@stocksense.io'}</p>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '4px' }}>Account Status</p>
                        <p style={{ fontSize: '1.05rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                            Active & Verified
                        </p>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '4px' }}>System Access Level</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                            {user?.role === 'inventory_manager' 
                                ? 'Full Administrative Access (Stock Transfers, Adjustments, Warehouses, Reports)' 
                                : 'Standard Operator Access (Stock Receipts, Delivery Orders, Picking & Shelving)'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="btn-primary" 
                        style={{ background: 'rgba(15, 23, 42, 0.08)', color: 'var(--text-dark)', boxShadow: 'none' }}
                    >
                        Back to Dashboard
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className="btn-primary" 
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: 'none' }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
