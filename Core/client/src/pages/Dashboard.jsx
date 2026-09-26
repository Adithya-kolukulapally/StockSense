import React, { useState, useEffect, useContext } from 'react';
import { 
    Boxes, 
    AlertTriangle, 
    ArrowDownToLine, 
    ArrowUpFromLine, 
    ArrowLeftRight, 
    SlidersHorizontal,
    Plus,
    Filter,
    Calendar,
    Warehouse as WhIcon,
    RefreshCw
} from 'lucide-react';
import { getDashboardSummary, getDashboardOperations } from '../services/dashboardService';
import { getWarehouses, getLocations } from '../services/warehouseService';
import StatusBadge from '../components/StatusBadge';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [summary, setSummary] = useState({
        totalProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        pendingReceipts: 0,
        pendingDeliveries: 0,
        scheduledTransfers: 0
    });

    const [operations, setOperations] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states (Section 27)
    const [filters, setFilters] = useState({
        documentType: 'all',
        status: 'all',
        warehouse: 'all',
        location: 'all'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sumRes, opRes, whRes] = await Promise.all([
                getDashboardSummary(),
                getDashboardOperations(filters),
                getWarehouses()
            ]);

            if (sumRes.success) setSummary(sumRes.data);
            if (opRes.success) setOperations(opRes.data);
            if (whRes.success) setWarehouses(whRes.data);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    // Handle warehouse change for dynamic locations
    const handleWarehouseChange = async (e) => {
        const whId = e.target.value;
        setFilters(prev => ({ ...prev, warehouse: whId, location: 'all' }));
        if (whId !== 'all') {
            try {
                const res = await getLocations({ warehouseId: whId });
                if (res.success) setLocations(res.data);
            } catch (err) {
                console.error(err);
            }
        } else {
            setLocations([]);
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Inventory Command Center</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Real-time stock ledger synchronization and operational oversight
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                        onClick={fetchData} 
                        className="btn btn-secondary" 
                        title="Refresh data"
                        id="btn-refresh-dashboard"
                    >
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                        <span>Sync</span>
                    </button>
                    {user?.role === 'inventory_manager' && (
                        <button 
                            onClick={() => navigate('/products')} 
                            className="btn btn-primary"
                            id="btn-add-product-quick"
                        >
                            <Plus size={16} />
                            <span>New Product</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Low stock alert banner */}
            {(summary.lowStockItems > 0 || summary.outOfStockItems > 0) && (
                <div className="alert-banner alert-banner-warning">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <AlertTriangle size={20} color="var(--warning)" />
                        <div>
                            <strong>Attention Required:</strong> You have{' '}
                            <strong>{summary.lowStockItems} low stock</strong> and{' '}
                            <strong>{summary.outOfStockItems} out-of-stock</strong> items requiring reorder action.
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/products?status=low_stock')}
                        className="btn btn-sm btn-secondary"
                        style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
                    >
                        Inspect Items
                    </button>
                </div>
            )}

            {/* 5 KPI Metric Cards (Section 23, 24) */}
            <div className="kpi-grid">
                {/* 1. Total Products in Stock */}
                <div className="kpi-card" id="kpi-total-products">
                    <div className="kpi-icon-wrap" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        <Boxes size={22} />
                    </div>
                    <div className="kpi-title">Total Products</div>
                    <div className="kpi-value">{summary.totalProducts}</div>
                    <div className="kpi-meta">Catalog inventory SKUs</div>
                </div>

                {/* 2. Low Stock / Out of Stock */}
                <div className="kpi-card" id="kpi-low-stock">
                    <div className="kpi-icon-wrap" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                        <AlertTriangle size={22} />
                    </div>
                    <div className="kpi-title">Low / Out of Stock</div>
                    <div className="kpi-value" style={{ color: summary.lowStockItems > 0 ? 'var(--warning)' : '#fff' }}>
                        {summary.lowStockItems} / {summary.outOfStockItems}
                    </div>
                    <div className="kpi-meta">Below reorder threshold</div>
                </div>

                {/* 3. Pending Receipts */}
                <div className="kpi-card" id="kpi-pending-receipts">
                    <div className="kpi-icon-wrap" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                        <ArrowDownToLine size={22} />
                    </div>
                    <div className="kpi-title">Pending Receipts</div>
                    <div className="kpi-value">{summary.pendingReceipts}</div>
                    <div className="kpi-meta">Incoming vendor stock</div>
                </div>

                {/* 4. Pending Deliveries */}
                <div className="kpi-card" id="kpi-pending-deliveries">
                    <div className="kpi-icon-wrap" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                        <ArrowUpFromLine size={22} />
                    </div>
                    <div className="kpi-title">Pending Deliveries</div>
                    <div className="kpi-value">{summary.pendingDeliveries}</div>
                    <div className="kpi-meta">Outgoing customer orders</div>
                </div>

                {/* 5. Internal Transfers Scheduled */}
                <div className="kpi-card" id="kpi-transfers">
                    <div className="kpi-icon-wrap" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                        <ArrowLeftRight size={22} />
                    </div>
                    <div className="kpi-title">Scheduled Transfers</div>
                    <div className="kpi-value">{summary.scheduledTransfers}</div>
                    <div className="kpi-meta">Inter-warehouse movements</div>
                </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                <button 
                    onClick={() => navigate('/operations/receipts')}
                    className="glass-card" 
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                >
                    <div style={{ padding: 8, borderRadius: 8, background: 'var(--info-light)', color: 'var(--info)' }}>
                        <ArrowDownToLine size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Receive Goods</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Incoming shipment</div>
                    </div>
                </button>

                <button 
                    onClick={() => navigate('/operations/deliveries')}
                    className="glass-card" 
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                >
                    <div style={{ padding: 8, borderRadius: 8, background: 'var(--success-light)', color: 'var(--success)' }}>
                        <ArrowUpFromLine size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Delivery Order</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer dispatch</div>
                    </div>
                </button>

                <button 
                    onClick={() => navigate('/operations/transfers')}
                    className="glass-card" 
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                >
                    <div style={{ padding: 8, borderRadius: 8, background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                        <ArrowLeftRight size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Internal Move</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Move between racks</div>
                    </div>
                </button>

                <button 
                    onClick={() => navigate('/operations/adjustments')}
                    className="glass-card" 
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                >
                    <div style={{ padding: 8, borderRadius: 8, background: 'var(--warning-light)', color: 'var(--warning)' }}>
                        <SlidersHorizontal size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Physical Count</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cycle adjustment</div>
                    </div>
                </button>
            </div>

            {/* Smart Dynamic Filters (Section 27) */}
            <div className="filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <Filter size={16} />
                    <span style={{ fontWeight: 600 }}>Filter Operations:</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {/* Document Type Filter */}
                    <select 
                        value={filters.documentType} 
                        onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                        className="form-select"
                        id="filter-doc-type"
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                        <option value="all">All Documents</option>
                        <option value="Receipts">Receipts</option>
                        <option value="Delivery">Delivery Orders</option>
                        <option value="Internal">Internal Transfers</option>
                        <option value="Adjustments">Stock Adjustments</option>
                    </select>

                    {/* Status Filter */}
                    <select 
                        value={filters.status} 
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="form-select"
                        id="filter-status"
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Ready">Ready</option>
                        <option value="Done">Done</option>
                        <option value="Canceled">Canceled</option>
                    </select>

                    {/* Warehouse Filter */}
                    <select 
                        value={filters.warehouse} 
                        onChange={handleWarehouseChange}
                        className="form-select"
                        id="filter-warehouse"
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                        <option value="all">All Warehouses</option>
                        {warehouses.map(w => (
                            <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                        ))}
                    </select>

                    {/* Location Filter */}
                    {locations.length > 0 && (
                        <select 
                            value={filters.location} 
                            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                            className="form-select"
                            id="filter-location"
                            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                        >
                            <option value="all">All Locations</option>
                            {locations.map(l => (
                                <option key={l._id} value={l._id}>{l.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Recent Operations Table (Section 46, 53) */}
            <div className="table-container">
                <table className="data-table" id="table-dashboard-operations">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Reference</th>
                            <th>Party / Reason</th>
                            <th>Warehouse / Location</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Operator</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operations.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    {loading ? 'Synchronizing operations...' : 'No inventory operations match the selected filters.'}
                                </td>
                            </tr>
                        ) : (
                            operations.map(op => (
                                <tr key={op.id}>
                                    <td>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{op.type}</span>
                                    </td>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>
                                            {op.reference}
                                        </span>
                                    </td>
                                    <td>{op.party}</td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>{op.warehouse}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{op.location}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{op.itemsCount}</span> item(s)
                                    </td>
                                    <td>
                                        <StatusBadge status={op.status} />
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {new Date(op.date).toLocaleDateString()} {new Date(op.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>{op.user}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
