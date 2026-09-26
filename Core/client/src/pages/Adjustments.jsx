import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    SlidersHorizontal, 
    AlertCircle, 
    RefreshCw,
    Search,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import { 
    getAdjustments, 
    createAdjustment 
} from '../services/adjustmentService';
import { getProducts } from '../services/productService';
import { getWarehouses, getLocations } from '../services/warehouseService';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import api from '../services/api';

const Adjustments = () => {
    const { addToast } = useToast();

    const [adjustments, setAdjustments] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [fetchingSystemQty, setFetchingSystemQty] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        productId: '',
        warehouseId: '',
        locationId: '',
        systemQuantity: 0,
        countedQuantity: 0,
        reason: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [aRes, pRes, wRes] = await Promise.all([
                getAdjustments(),
                getProducts({ limit: 100 }),
                getWarehouses()
            ]);

            if (aRes.success) setAdjustments(aRes.data);
            if (pRes.success) setProducts(pRes.data);
            if (wRes.success) setWarehouses(wRes.data);
        } catch (err) {
            console.error(err);
            addToast('Error loading adjustments', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleWarehouseChange = async (whId) => {
        setFormData(prev => ({ ...prev, warehouseId: whId, locationId: '', systemQuantity: 0 }));
        if (whId) {
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

    // When Product, Warehouse, and Location are selected, fetch current system quantity
    const fetchCurrentSystemQuantity = async (productId, warehouseId, locationId) => {
        if (!productId || !warehouseId || !locationId) return;
        setFetchingSystemQty(true);
        try {
            const res = await api.get('/inventory', {
                params: { productId, warehouseId, locationId }
            });
            if (res.success && res.data.length > 0) {
                const currentQty = res.data[0].quantity;
                setFormData(prev => ({ 
                    ...prev, 
                    systemQuantity: currentQty,
                    countedQuantity: currentQty 
                }));
            } else {
                setFormData(prev => ({ ...prev, systemQuantity: 0, countedQuantity: 0 }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingSystemQty(false);
        }
    };

    const handleLocationChange = (locId) => {
        setFormData(prev => ({ ...prev, locationId: locId }));
        fetchCurrentSystemQuantity(formData.productId, formData.warehouseId, locId);
    };

    const handleProductChange = (prodId) => {
        setFormData(prev => ({ ...prev, productId: prodId }));
        fetchCurrentSystemQuantity(prodId, formData.warehouseId, formData.locationId);
    };

    const difference = Number(formData.countedQuantity) - Number(formData.systemQuantity);

    const handleCreateAdjustment = async (e) => {
        e.preventDefault();
        try {
            const res = await createAdjustment(formData);
            if (res.success) {
                addToast(res.message || 'Stock adjustment recorded successfully!');
                setIsCreateOpen(false);
                setFormData({
                    productId: '',
                    warehouseId: '',
                    locationId: '',
                    systemQuantity: 0,
                    countedQuantity: 0,
                    reason: ''
                });
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Error recording adjustment', 'error');
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Stock Adjustments (Physical Counts)</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Reconcile discrepancies between recorded system inventory and physical warehouse counts
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="btn btn-primary"
                    id="btn-create-adjustment"
                >
                    <Plus size={16} />
                    <span>New Adjustment</span>
                </button>
            </div>

            {/* Adjustments Table (Section 35) */}
            <div className="table-container">
                <table className="data-table" id="table-adjustments">
                    <thead>
                        <tr>
                            <th>Adjustment No.</th>
                            <th>Product</th>
                            <th>Warehouse / Location</th>
                            <th>System Qty</th>
                            <th>Physical Count</th>
                            <th>Difference</th>
                            <th>Reason</th>
                            <th>Logged Date</th>
                            <th>Operator</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adjustments.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    {loading ? 'Fetching adjustments...' : 'No stock adjustments recorded.'}
                                </td>
                            </tr>
                        ) : (
                            adjustments.map(a => (
                                <tr key={a._id}>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--warning)' }}>
                                            {a.adjustmentNumber}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{a.productId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                            {a.productId?.sku}
                                        </div>
                                    </td>
                                    <td>
                                        <div>{a.warehouseId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.locationId?.name}</div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {a.systemQuantity}
                                    </td>
                                    <td>
                                        <strong>{a.countedQuantity}</strong>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: 4, 
                                            fontWeight: 700,
                                            color: a.difference > 0 ? 'var(--success)' : (a.difference < 0 ? 'var(--danger)' : 'var(--text-muted)')
                                        }}>
                                            {a.difference > 0 ? <TrendingUp size={14} /> : (a.difference < 0 ? <TrendingDown size={14} /> : null)}
                                            {a.difference > 0 ? `+${a.difference}` : a.difference}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: 220, fontSize: '0.85rem' }}>
                                        {a.reason}
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {new Date(a.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {a.createdBy?.name || 'Staff'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Adjustment Modal (Section 19, 20) */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Perform Physical Inventory Adjustment"
                maxWidth={620}
            >
                <form onSubmit={handleCreateAdjustment}>
                    <div className="form-group">
                        <label className="form-label">Product to Adjust *</label>
                        <select 
                            required
                            className="form-select"
                            value={formData.productId}
                            onChange={(e) => handleProductChange(e.target.value)}
                        >
                            <option value="">Select Inventory Product</option>
                            {products.map(p => (
                                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Warehouse *</label>
                            <select 
                                required
                                className="form-select"
                                value={formData.warehouseId}
                                onChange={(e) => handleWarehouseChange(e.target.value)}
                            >
                                <option value="">Select Warehouse</option>
                                {warehouses.map(w => (
                                    <option key={w._id} value={w._id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Location / Rack *</label>
                            <select 
                                required
                                className="form-select"
                                value={formData.locationId}
                                onChange={(e) => handleLocationChange(e.target.value)}
                            >
                                <option value="">Select Location</option>
                                {locations.map(l => (
                                    <option key={l._id} value={l._id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stock Reconciliation Card (Section 20) */}
                    <div style={{ 
                        padding: 16, 
                        background: 'var(--bg-glass-strong)', 
                        border: '1px solid var(--border-subtle)', 
                        borderRadius: 'var(--radius-sm)', 
                        marginBottom: 16 
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>System Recorded</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                    {fetchingSystemQty ? '...' : formData.systemQuantity}
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ marginBottom: 4 }}>Physical Count</label>
                                <input 
                                    type="number"
                                    required
                                    min="0"
                                    className="form-control"
                                    style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem' }}
                                    value={formData.countedQuantity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, countedQuantity: e.target.value }))}
                                />
                            </div>

                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Difference</div>
                                <div style={{ 
                                    fontSize: '1.4rem', 
                                    fontWeight: 800,
                                    color: difference > 0 ? 'var(--success)' : (difference < 0 ? 'var(--danger)' : 'var(--text-muted)')
                                }}>
                                    {difference > 0 ? `+${difference}` : difference}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Reason for Discrepancy *</label>
                        <textarea 
                            rows="2"
                            required
                            className="form-control"
                            placeholder="e.g. 3 damaged units removed after inspection, annual physical count adjustment..."
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        />
                    </div>

                    <div className="modal-footer" style={{ padding: 0, paddingTop: 16 }}>
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" id="btn-submit-adjustment">
                            Record Adjustment
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Adjustments;
