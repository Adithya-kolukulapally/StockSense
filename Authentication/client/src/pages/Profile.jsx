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
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
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
                        fontWeight: 'bold'
                    }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{user?.name}</h2>
                        <span style={{ 
                            display: 'inline-block',
                            marginTop: '8px',
                            padding: '4px 12px',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: 'var(--primary)',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                        }}>
                            {user?.role.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Email Address</p>
                        <p style={{ fontSize: '1.1rem' }}>{user?.email}</p>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Account Status</p>
                        <p style={{ fontSize: '1.1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                            Active
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="btn-primary" 
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                    >
                        Back to Dashboard
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className="btn-primary" 
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)' }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
