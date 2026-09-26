import React, { useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const INITIAL_INVENTORY = [
    { id: 1, sku: 'STM32-MCU-F4', name: 'STM32 Cortex-M4 Microcontroller', category: 'Electronics', warehouse: 'Central Hub', location: 'Rack B-01', stock: 42, minThreshold: 50, unitCost: 14.50, status: 'low' },
    { id: 2, sku: 'RES-10K-0805', name: '10kΩ SMD Resistors (Reel of 5000)', category: 'Electronics', warehouse: 'Central Hub', location: 'Aisle A-12', stock: 12400, minThreshold: 2000, unitCost: 0.02, status: 'in_stock' },
    { id: 3, sku: 'ALU-6061-ROD', name: 'Aluminum 6061 Extruded Rod (2m)', category: 'Raw Materials', warehouse: 'East Annex', location: 'Bay R-04', stock: 320, minThreshold: 100, unitCost: 38.00, status: 'in_stock' },
    { id: 4, sku: 'M4-SS-BOLT', name: 'M4 Stainless Steel Hex Bolts (Pack of 100)', category: 'Hardware', warehouse: 'West Facility', location: 'Bin W-08', stock: 5600, minThreshold: 1500, unitCost: 4.80, status: 'in_stock' },
    { id: 5, sku: 'BOX-COR-M', name: 'Heavy-Duty Corrugated Box Medium', category: 'Packaging', warehouse: 'East Annex', location: 'Zone P-02', stock: 1150, minThreshold: 300, unitCost: 1.25, status: 'in_stock' },
    { id: 6, sku: 'LIPO-2200-3S', name: '3S 2200mAh High-Discharge LiPo Pack', category: 'Electronics', warehouse: 'Central Hub', location: 'Hazmat-03', stock: 14, minThreshold: 40, unitCost: 28.50, status: 'critical' },
    { id: 7, sku: 'BRASS-NPT-12', name: '1/2" NPT Industrial Brass Fitting', category: 'Hardware', warehouse: 'West Facility', location: 'Bin W-14', stock: 890, minThreshold: 250, unitCost: 6.70, status: 'in_stock' },
    { id: 8, sku: 'BUBBLE-ROLL-L', name: 'Anti-Static Bubble Wrap Roll (100m)', category: 'Packaging', warehouse: 'East Annex', location: 'Zone P-05', stock: 85, minThreshold: 20, unitCost: 18.00, status: 'in_stock' }
];

const NOTIFICATIONS = [
    { id: 1, title: 'Low Stock Alert', desc: 'LIPO-2200-3S reached critical level (14 units remaining).', time: '10m ago', type: 'error' },
    { id: 2, title: 'Inbound PO Received', desc: 'PO-2026-8812 verified at East Annex (320 units).', time: '1h ago', type: 'success' },
    { id: 3, title: 'Warehouse Transfer', desc: 'Transfer #TR-409 completed from Central to West Facility.', time: '3h ago', type: 'info' }
];

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Inventory & Filter States
    const [inventory, setInventory] = useState(INITIAL_INVENTORY);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedWarehouse, setSelectedWarehouse] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');

    // UI Interactive States
    const [currentRole, setCurrentRole] = useState(user?.role || 'inventory_manager');
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showNotifDrawer, setShowNotifDrawer] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // Form States
    const [receiveForm, setReceiveForm] = useState({ sku: 'STM32-MCU-F4', qty: 50, warehouse: 'Central Hub', ref: 'PO-9021' });
    const [transferForm, setTransferForm] = useState({ sku: 'RES-10K-0805', qty: 1000, from: 'Central Hub', to: 'West Facility' });

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleRole = () => {
        const nextRole = currentRole === 'inventory_manager' ? 'warehouse_staff' : 'inventory_manager';
        setCurrentRole(nextRole);
        showToast(`Role switched to ${nextRole === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}`);
    };

    // Filter Logic
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            const matchesWarehouse = selectedWarehouse === 'All' || item.warehouse === selectedWarehouse;
            const matchesStatus = 
                selectedStatus === 'All' || 
                (selectedStatus === 'low' && (item.status === 'low' || item.status === 'critical')) ||
                item.status === selectedStatus;

            return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
        });
    }, [inventory, searchTerm, selectedCategory, selectedWarehouse, selectedStatus]);

    // Computed KPI Metrics
    const totalUnits = useMemo(() => inventory.reduce((acc, curr) => acc + curr.stock, 0), [inventory]);
    const totalValuation = useMemo(() => inventory.reduce((acc, curr) => acc + (curr.stock * curr.unitCost), 0), [inventory]);
    const lowStockCount = useMemo(() => inventory.filter(i => i.status === 'low' || i.status === 'critical').length, [inventory]);

    // Handlers for Stock Receiving and Transfer
    const handleReceiveSubmit = (e) => {
        e.preventDefault();
        const qty = parseInt(receiveForm.qty, 10) || 0;
        setInventory(prev => prev.map(item => {
            if (item.sku === receiveForm.sku) {
                const newStock = item.stock + qty;
                const newStatus = newStock <= item.minThreshold ? (newStock <= item.minThreshold / 2 ? 'critical' : 'low') : 'in_stock';
                return { ...item, stock: newStock, status: newStatus };
            }
            return item;
        }));
        setShowReceiveModal(false);
        showToast(`✅ Successfully received +${qty} units of ${receiveForm.sku} at ${receiveForm.warehouse}`);
    };

    const handleTransferSubmit = (e) => {
        e.preventDefault();
        const qty = parseInt(transferForm.qty, 10) || 0;
        showToast(`⇄ Transfer confirmed: ${qty} units of ${transferForm.sku} routed to ${transferForm.to}`);
        setShowTransferModal(false);
    };

    const handleExportCSV = () => {
        const headers = 'SKU,Name,Category,Warehouse,Location,Stock,UnitCost,Status\n';
        const rows = inventory.map(i => `"${i.sku}","${i.name}","${i.category}","${i.warehouse}","${i.location}",${i.stock},${i.unitCost},"${i.status}"`).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `StockSense_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        showToast('📥 Inventory CSV exported successfully');
    };

    return (
        <div className="dashboard-wrapper">
            {/* Top Navigation Bar */}
            <nav className="dash-navbar">
                <div className="dash-brand">
                    <div className="dash-logo-icon">S</div>
                    <div>
                        <span className="dash-brand-name">StockSense</span>
                    </div>
                    <span className="dash-brand-badge">Control Hub</span>
                </div>

                {/* Global Search Bar */}
                <div className="dash-search-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="M21 21l-4.35-4.35"></path>
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Search SKU, item, bin location..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="dash-search-shortcut">⌘K</span>
                </div>

                {/* Actions & Profile */}
                <div className="dash-nav-actions">
                    <button onClick={toggleRole} className="role-switcher-btn" title="Toggle current role permissions">
                        <span>Role:</span>
                        <strong style={{ color: currentRole === 'inventory_manager' ? 'var(--primary)' : 'var(--success)' }}>
                            {currentRole === 'inventory_manager' ? 'Manager' : 'Staff'}
                        </strong>
                        <span style={{ fontSize: '0.7rem' }}>⇄</span>
                    </button>

                    <div style={{ position: 'relative' }}>
                        <button 
                            className="notification-btn" 
                            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                            title="View Alerts"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <span className="notif-badge">3</span>
                        </button>

                        {/* Interactive Notification Popover */}
                        {showNotifDrawer && (
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '48px',
                                width: '320px',
                                background: '#ffffff',
                                borderRadius: '12px',
                                boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                                border: '1px solid var(--border-color)',
                                zIndex: 150,
                                padding: '16px',
                                animation: 'slideUpFade 0.2s ease-out'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a' }}>System Notifications</h4>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>Mark all read</span>
                                </div>
                                {NOTIFICATIONS.map(n => (
                                    <div key={n.id} style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        background: '#f8fafc',
                                        marginBottom: '8px',
                                        borderLeft: `3px solid ${n.type === 'error' ? 'var(--error)' : n.type === 'success' ? 'var(--success)' : 'var(--primary)'}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>
                                            <span>{n.title}</span>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>{n.time}</span>
                                        </div>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#64748b' }}>{n.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="user-profile-btn" onClick={() => navigate('/profile')}>
                        <div className="user-avatar">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.name || 'Adithya Kolukulapally'}</span>
                            <span className="user-role-tag">{currentRole.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="signout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content Dashboard */}
            <main className="dash-content">
                {/* Header Welcome Banner */}
                <div className="dash-header-banner">
                    <div>
                        <h1 className="header-greeting">Welcome back, {user?.name ? user.name.split(' ')[0] : 'Adithya'}</h1>
                        <div className="header-subtitle">
                            <span className="pulse-dot"></span>
                            <span>Live Multi-Warehouse Operations • 4 Facilities Connected</span>
                        </div>
                    </div>

                    <div className="dash-quick-actions">
                        <button onClick={() => setShowReceiveModal(true)} className="action-btn action-btn-primary">
                            <span>+ Receive Inbound</span>
                        </button>

                        <button onClick={() => setShowTransferModal(true)} className="action-btn action-btn-secondary">
                            <span>⇄ Internal Transfer</span>
                        </button>

                        <button onClick={handleExportCSV} className="action-btn action-btn-secondary" title="Export CSV Data">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-header">
                            <span className="kpi-title">Active Catalog SKUs</span>
                            <div className="kpi-icon-wrapper" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                📦
                            </div>
                        </div>
                        <div className="kpi-value">{inventory.length} SKUs</div>
                        <div className="kpi-footer">
                            <span className="trend-badge-up">↑ +14.2%</span>
                            <span style={{ color: 'var(--text-gray)' }}>across 4 categories</span>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-header">
                            <span className="kpi-title">Total Units In Stock</span>
                            <div className="kpi-icon-wrapper" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                                📊
                            </div>
                        </div>
                        <div className="kpi-value">{totalUnits.toLocaleString()}</div>
                        <div className="kpi-footer">
                            <span className="trend-badge-up">98.4%</span>
                            <span style={{ color: 'var(--text-gray)' }}>storage capacity utilized</span>
                        </div>
                    </div>

                    <div className="kpi-card">
                        <div className="kpi-header">
                            <span className="kpi-title">Total Valuation (USD)</span>
                            <div className="kpi-icon-wrapper" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                                💰
                            </div>
                        </div>
                        <div className="kpi-value">
                            {currentRole === 'inventory_manager' ? `$${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Protected (Manager)'}
                        </div>
                        <div className="kpi-footer">
                            <span className="trend-badge-up">↑ +8.4%</span>
                            <span style={{ color: 'var(--text-gray)' }}>vs previous month</span>
                        </div>
                    </div>

                    <div 
                        className="kpi-card" 
                        style={{ cursor: 'pointer', borderColor: lowStockCount > 0 ? '#fca5a5' : 'var(--border-color)' }}
                        onClick={() => setSelectedStatus(selectedStatus === 'low' ? 'All' : 'low')}
                        title="Click to filter low stock items"
                    >
                        <div className="kpi-header">
                            <span className="kpi-title">Stock Attention Alerts</span>
                            <div className="kpi-icon-wrapper" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
                                ⚠️
                            </div>
                        </div>
                        <div className="kpi-value" style={{ color: lowStockCount > 0 ? 'var(--error)' : '#0f172a' }}>
                            {lowStockCount} Needs Reorder
                        </div>
                        <div className="kpi-footer">
                            <span className="trend-badge-warn">Click to isolate alerts</span>
                        </div>
                    </div>
                </div>

                {/* Filter and Category Controls Bar */}
                <div className="controls-bar">
                    <div className="category-filter-chips">
                        {['All', 'Electronics', 'Raw Materials', 'Hardware', 'Packaging'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="table-filter-group">
                        <select 
                            className="select-filter" 
                            value={selectedWarehouse} 
                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                        >
                            <option value="All">All Warehouses</option>
                            <option value="Central Hub">Central Hub</option>
                            <option value="East Annex">East Annex</option>
                            <option value="West Facility">West Facility</option>
                        </select>

                        <select 
                            className="select-filter" 
                            value={selectedStatus} 
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="All">All Stock Levels</option>
                            <option value="in_stock">Healthy Stock</option>
                            <option value="low">Low & Critical Stock</option>
                        </select>
                    </div>
                </div>

                {/* Inventory Master Table */}
                <div className="data-card">
                    <div className="data-card-header">
                        <div className="data-card-title">
                            Inventory Items ({filteredInventory.length})
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Showing matching physical stock across facilities
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="inventory-table">
                            <thead>
                                <tr>
                                    <th>SKU Identifier</th>
                                    <th>Item Description</th>
                                    <th>Category</th>
                                    <th>Warehouse Facility</th>
                                    <th>Bin / Shelf</th>
                                    <th>On Hand</th>
                                    {currentRole === 'inventory_manager' && <th>Unit Cost</th>}
                                    <th>Health Status</th>
                                    <th style={{ textAlign: 'right' }}>Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <span className="sku-badge">{item.sku}</span>
                                        </td>
                                        <td>
                                            <strong style={{ color: '#0f172a' }}>{item.name}</strong>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.8rem', color: '#475569' }}>{item.category}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 500 }}>{item.warehouse}</span>
                                        </td>
                                        <td>
                                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.location}</span>
                                        </td>
                                        <td>
                                            <strong style={{ fontSize: '0.95rem', color: item.status === 'critical' ? 'var(--error)' : '#0f172a' }}>
                                                {item.stock.toLocaleString()}
                                            </strong>
                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '4px' }}>units</span>
                                        </td>
                                        {currentRole === 'inventory_manager' && (
                                            <td>${item.unitCost.toFixed(2)}</td>
                                        )}
                                        <td>
                                            {item.status === 'in_stock' && (
                                                <span className="status-pill status-instock">
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                                                    Optimal
                                                </span>
                                            )}
                                            {item.status === 'low' && (
                                                <span className="status-pill status-lowstock">
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }}></span>
                                                    Low Stock
                                                </span>
                                            )}
                                            {item.status === 'critical' && (
                                                <span className="status-pill status-critical">
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--error)' }}></span>
                                                    Critical
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button 
                                                onClick={() => {
                                                    setReceiveForm(prev => ({ ...prev, sku: item.sku, warehouse: item.warehouse }));
                                                    setShowReceiveModal(true);
                                                }}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color)',
                                                    background: '#ffffff',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    color: 'var(--primary)',
                                                    marginRight: '6px'
                                                }}
                                            >
                                                + Add
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setTransferForm(prev => ({ ...prev, sku: item.sku, from: item.warehouse }));
                                                    setShowTransferModal(true);
                                                }}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color)',
                                                    background: '#ffffff',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    color: '#334155'
                                                }}
                                            >
                                                Move
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal: Receive Inbound Stock */}
            {showReceiveModal && (
                <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Receive Inbound Stock</h3>
                            <button className="modal-close-btn" onClick={() => setShowReceiveModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleReceiveSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label>Select Item SKU</label>
                                    <div className="input-wrapper">
                                        <select 
                                            value={receiveForm.sku}
                                            onChange={e => setReceiveForm({ ...receiveForm, sku: e.target.value })}
                                        >
                                            {inventory.map(i => (
                                                <option key={i.id} value={i.sku}>{i.sku} — {i.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Quantity to Receive</label>
                                    <div className="input-wrapper">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={receiveForm.qty}
                                            onChange={e => setReceiveForm({ ...receiveForm, qty: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Destination Warehouse Facility</label>
                                    <div className="input-wrapper">
                                        <select 
                                            value={receiveForm.warehouse}
                                            onChange={e => setReceiveForm({ ...receiveForm, warehouse: e.target.value })}
                                        >
                                            <option value="Central Hub">Central Hub</option>
                                            <option value="East Annex">East Annex</option>
                                            <option value="West Facility">West Facility</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Purchase Order / Supplier Reference</label>
                                    <div className="input-wrapper">
                                        <input 
                                            type="text" 
                                            value={receiveForm.ref}
                                            onChange={e => setReceiveForm({ ...receiveForm, ref: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowReceiveModal(false)} className="action-btn action-btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="action-btn action-btn-primary">
                                    Confirm Receipt & Update Stock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Internal Transfer */}
            {showTransferModal && (
                <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Internal Stock Transfer</h3>
                            <button className="modal-close-btn" onClick={() => setShowTransferModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleTransferSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label>Select Item to Transfer</label>
                                    <div className="input-wrapper">
                                        <select 
                                            value={transferForm.sku}
                                            onChange={e => setTransferForm({ ...transferForm, sku: e.target.value })}
                                        >
                                            {inventory.map(i => (
                                                <option key={i.id} value={i.sku}>{i.sku} — {i.name} ({i.stock} in {i.warehouse})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="input-group">
                                        <label>Source Facility</label>
                                        <div className="input-wrapper">
                                            <select 
                                                value={transferForm.from}
                                                onChange={e => setTransferForm({ ...transferForm, from: e.target.value })}
                                            >
                                                <option value="Central Hub">Central Hub</option>
                                                <option value="East Annex">East Annex</option>
                                                <option value="West Facility">West Facility</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label>Target Facility</label>
                                        <div className="input-wrapper">
                                            <select 
                                                value={transferForm.to}
                                                onChange={e => setTransferForm({ ...transferForm, to: e.target.value })}
                                            >
                                                <option value="West Facility">West Facility</option>
                                                <option value="East Annex">East Annex</option>
                                                <option value="Central Hub">Central Hub</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Quantity to Relocate</label>
                                    <div className="input-wrapper">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={transferForm.qty}
                                            onChange={e => setTransferForm({ ...transferForm, qty: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowTransferModal(false)} className="action-btn action-btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="action-btn action-btn-primary">
                                    Execute Relocation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Toast Notification */}
            {toastMessage && (
                <div className="toast-notice">
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
