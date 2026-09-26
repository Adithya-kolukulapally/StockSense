import React, { useState, useEffect } from 'react';
import { 
    History, 
    Filter, 
    Calendar, 
    Search, 
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Shield
} from 'lucide-react';
import { getLedger } from '../services/ledgerService';
import { getProducts } from '../services/productService';
import { getWarehouses } from '../services/warehouseService';
import { useToast } from '../components/Toast';

const MoveHistory = () => {
    const { addToast } = useToast();

    const [records, setRecords] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [operationType, setOperationType] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState('all');
    const [selectedWarehouse, setSelectedWarehouse] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [lRes, pRes, wRes] = await Promise.all([
                getLedger({
                    search,
                    operationType,
                    productId: selectedProduct,
                    warehouseId: selectedWarehouse,
                    dateFrom,
                    dateTo,
                    limit: 50
                }),
                getProducts({ limit: 100 }),
                getWarehouses()
            ]);

            if (lRes.success) setRecords(lRes.data);
            if (pRes.success) setProducts(pRes.data);
            if (wRes.success) setWarehouses(wRes.data);
        } catch (err) {
            console.error(err);
            addToast('Error fetching ledger history', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, operationType, selectedProduct, selectedWarehouse, dateFrom, dateTo]);

    const getOperationBadge = (type) => {
        switch (type) {
            case 'RECEIPT':
                return <span className="badge badge-done">RECEIPT (+)</span>;
            case 'DELIVERY':
                return <span className="badge badge-canceled">DELIVERY (-)</span>;
            case 'TRANSFER_IN':
                return <span className="badge badge-ready">TRANSFER IN (+)</span>;
            case 'TRANSFER_OUT':
                return <span className="badge badge-waiting">TRANSFER OUT (-)</span>;
            case 'ADJUSTMENT':
                return <span className="badge badge-low-stock">ADJUSTMENT (&plusmn;)</span>;
            case 'INITIAL_STOCK':
                return <span className="badge badge-in-stock">INITIAL STOCK</span>;
            default:
                return <span className="badge">{type}</span>;
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Stock Ledger & Move History</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Immutable audit trail of all historical inventory transactions, movements, and quantity balances
                    </p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary" title="Refresh Audit Log">
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    <span>Sync Ledger</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-box">
                    <Search size={16} color="var(--text-muted)" />
                    <input 
                        type="text"
                        placeholder="Search Reference No..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    {/* Operation Type Filter */}
                    <select 
                        value={operationType}
                        onChange={(e) => setOperationType(e.target.value)}
                        className="form-select"
                        style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                    >
                        <option value="all">All Operations</option>
                        <option value="RECEIPT">Receipt</option>
                        <option value="DELIVERY">Delivery</option>
                        <option value="TRANSFER_IN">Transfer In</option>
                        <option value="TRANSFER_OUT">Transfer Out</option>
                        <option value="ADJUSTMENT">Adjustment</option>
                        <option value="INITIAL_STOCK">Initial Stock</option>
                    </select>

                    {/* Product Filter */}
                    <select 
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="form-select"
                        style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                    >
                        <option value="all">All Products</option>
                        {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>

                    {/* Warehouse Filter */}
                    <select 
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="form-select"
                        style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                    >
                        <option value="all">All Warehouses</option>
                        {warehouses.map(w => (
                            <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Ledger Table (Section 21, 36) */}
            <div className="table-container">
                <table className="data-table" id="table-move-history">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Product</th>
                            <th>Operation</th>
                            <th>Reference Document</th>
                            <th>Warehouse & Location</th>
                            <th>Before</th>
                            <th>Change</th>
                            <th>After Balance</th>
                            <th>Operator</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    {loading ? 'Reading audit trail...' : 'No ledger movements found.'}
                                </td>
                            </tr>
                        ) : (
                            records.map(rec => (
                                <tr key={rec._id}>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        <div>{new Date(rec.createdAt).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {new Date(rec.createdAt).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{rec.productId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                            {rec.productId?.sku}
                                        </div>
                                    </td>
                                    <td>
                                        {getOperationBadge(rec.operationType)}
                                    </td>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                                            {rec.referenceNumber || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <div>{rec.warehouseId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.locationId?.name}</div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {rec.quantityBefore}
                                    </td>
                                    <td>
                                        <span style={{ 
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            color: rec.quantityChange > 0 ? 'var(--success)' : (rec.quantityChange < 0 ? 'var(--danger)' : 'var(--text-muted)')
                                        }}>
                                            {rec.quantityChange > 0 ? '+' : ''}{rec.quantityChange}
                                        </span>
                                    </td>
                                    <td>
                                        <strong style={{ fontSize: '0.95rem' }}>{rec.quantityAfter}</strong>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {rec.createdByName || rec.createdBy?.name || 'System Operator'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MoveHistory;
