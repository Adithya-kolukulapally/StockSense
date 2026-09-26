import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, LogOut, ShieldCheck } from 'lucide-react';
import { useToast } from './Toast';

const Navbar = () => {
    const { user, switchRole, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleLogout = () => {
        logout();
        addToast('Signed out successfully');
        navigate('/login');
    };

    const handleSwitchRole = () => {
        switchRole();
        const nextRole = user?.role === 'inventory_manager' ? 'Warehouse Staff' : 'Inventory Manager';
        addToast(`Switched active view to: ${nextRole}`);
    };

    return (
        <header className="navbar">
            <div className="navbar-left">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Enterprise IMS &bull; Multi-Warehouse Synchronization
                </span>
            </div>

            <div className="navbar-right">
                {/* 1-Click Role Switcher */}
                <button 
                    onClick={handleSwitchRole}
                    id="btn-switch-role"
                    className="role-switcher-btn"
                    title="Click to toggle between Inventory Manager and Warehouse Staff"
                >
                    <RefreshCw size={14} />
                    <span>Role: <strong>{user?.role === 'inventory_manager' ? 'Manager' : 'Staff'}</strong></span>
                </button>

                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#fff'
                    }}>
                        {user?.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || 'Operator'}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {user?.role?.replace('_', ' ') || 'Staff'}
                        </span>
                    </div>
                </div>

                {/* Profile Link matching Authentication */}
                <button 
                    onClick={() => navigate('/profile')} 
                    id="btn-nav-profile"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 14px', borderRadius: '20px', fontWeight: 500 }}
                >
                    Profile
                </button>

                {/* Logout Button */}
                <button 
                    onClick={handleLogout}
                    id="btn-logout"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6, borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}
                    title="Sign Out"
                >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                </button>
            </div>
        </header>
    );
};

export default Navbar;
