import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Boxes, 
    ArrowDownToLine, 
    ArrowUpFromLine, 
    ArrowLeftRight, 
    SlidersHorizontal, 
    History, 
    Warehouse, 
    Tags,
    Shield
} from 'lucide-react';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-badge">S</div>
                <div>
                    <div className="logo-text">StockSense</div>
                    <div className="logo-sub">Core Platform</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink 
                    to="/dashboard" 
                    id="nav-dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <LayoutDashboard />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink 
                    to="/products" 
                    id="nav-products"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Boxes />
                    <span>Products</span>
                </NavLink>

                <div className="nav-section-title">Operations</div>

                <NavLink 
                    to="/operations/receipts" 
                    id="nav-receipts"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <ArrowDownToLine />
                    <span>Receipts</span>
                </NavLink>

                <NavLink 
                    to="/operations/deliveries" 
                    id="nav-deliveries"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <ArrowUpFromLine />
                    <span>Delivery Orders</span>
                </NavLink>

                <NavLink 
                    to="/operations/transfers" 
                    id="nav-transfers"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <ArrowLeftRight />
                    <span>Internal Transfers</span>
                </NavLink>

                <NavLink 
                    to="/operations/adjustments" 
                    id="nav-adjustments"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <SlidersHorizontal />
                    <span>Stock Adjustments</span>
                </NavLink>

                <NavLink 
                    to="/operations/history" 
                    id="nav-history"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <History />
                    <span>Move History</span>
                </NavLink>

                <div className="nav-section-title">Settings</div>

                <NavLink 
                    to="/settings/warehouses" 
                    id="nav-warehouses"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Warehouse />
                    <span>Warehouses & Locations</span>
                </NavLink>

                <NavLink 
                    to="/settings/categories" 
                    id="nav-categories"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Tags />
                    <span>Categories</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Shield size={16} color="var(--primary)" />
                    <span>Stock Ledger Audit Active</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
