import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    ArrowUpFromLine, 
    CheckCircle, 
    XCircle, 
    Trash2, 
    Eye, 
    RefreshCw,
    Search,
    Truck
} from 'lucide-react';
import { 
    getDeliveries, 
    createDelivery, 
    validateDelivery, 
    cancelDelivery, 
    getDeliveryById 
} from '../services/deliveryService';
import { getProducts } from '../services/productService';
import { getWarehouses, getLocations } from '../services/warehouseService';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const Deliveries = () => {
    const { addToast } = useToast();

    const [deliveries, setDeliveries] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    // Create form state
    const [formData, setFormData] = useState({
        customer: '',
        warehouseId: '',
        locationId: '',
        shippingAddress: '',
        items: [{ productId: '', quantity: 1 }]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dRes, pRes, wRes] = await Promise.all([
                getDeliveries({ search, status: statusFilter }),
                getProducts({ limit: 100 }),
                getWarehouses()
            ]);

            if (dRes.success) setDeliveries(dRes.data);
            if (pRes.success) setProducts(pRes.data);
            if (wRes.success) setWarehouses(wRes.data);
        } catch (err) {
            console.error(err);
            addToast('Error loading deliveries', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, statusFilter]);

    const handleWarehouseChange = async (whId) => {
        setFormData(prev => ({ ...prev, warehouseId: whId, locationId: '' }));
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

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', quantity: 1 }]
        }));
    };

    const handleRemoveItem = (index) => {
        if (formData.items.length === 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, idx) => idx !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleCreateDelivery = async (e) => {
        e.preventDefault();
        try {
            const res = await createDelivery(formData);
            if (res.success) {
                addToast(`Delivery Order ${res.data.deliveryNumber} created! Ready for validation.`);
                setIsCreateOpen(false);
                setFormData({
                    customer: '',
                    warehouseId: '',
                    locationId: '',
                    shippingAddress: '',
                    items: [{ productId: '', quantity: 1 }]
                });
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Error creating delivery', 'error');
        }
    };

    const handleValidate = async (id, deliveryNumber) => {
        if (!window.confirm(`Validate delivery ${deliveryNumber}? This will verify stock and decrease quantities immediately.`)) {
            return;
        }

        try {
            const res = await validateDelivery(id);
            if (res.success) {
                addToast(`Delivery ${deliveryNumber} validated! Stock dispatched and ledger updated.`);
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Failed to validate delivery order', 'error');
        }
    };

    const handleCancel = async (id, deliveryNumber) => {
        if (!window.confirm(`Cancel delivery order ${deliveryNumber}?`)) {
            return;
        }

        try {
            const res = await cancelDelivery(id);
            if (res.success) {
                addToast(`Delivery ${deliveryNumber} marked as canceled.`, 'success');
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Failed to cancel delivery', 'error');
        }
    };

    const handleViewDetail = async (id) => {
        try {
            const res = await getDeliveryById(id);
            if (res.success) {
                setSelectedDelivery(res.data);
                setIsDetailOpen(true);
            }
        } catch (err) {
            addToast('Could not load details', 'error');
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Outgoing Stock (Delivery Orders)</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Customer fulfillment, picking, stock availability validation, and automatic stock deduction
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="btn btn-primary"
                    id="btn-create-delivery"
                >
                    <Plus size={16} />
                    <span>Create Delivery</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-box">
                    <Search size={16} color="var(--text-muted)" />
                    <input 
                        type="text"
                        placeholder="Search Delivery No. or Customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select"
                        style={{ padding: '8px 14px' }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Ready">Ready</option>
                        <option value="Done">Done</option>
                        <option value="Canceled">Canceled</option>
                    </select>

                    <button onClick={fetchData} className="btn btn-secondary btn-sm" title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Deliveries Table (Section 33) */}
            <div className="table-container">
                <table className="data-table" id="table-deliveries">
                    <thead>
                        <tr>
                            <th>Delivery No.</th>
                            <th>Customer</th>
                            <th>Dispatch Warehouse / Location</th>
                            <th>Items Count</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deliveries.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    {loading ? 'Fetching delivery orders...' : 'No delivery orders found.'}
                                </td>
                            </tr>
                        ) : (
                            deliveries.map(d => (
                                <tr key={d._id}>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--success)' }}>
                                            {d.deliveryNumber}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>{d.customer}</strong>
                                    </td>
                                    <td>
                                        <div>{d.warehouseId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.locationId?.name}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{d.items?.length || 0}</span> item(s)
                                    </td>
                                    <td>
                                        <StatusBadge status={d.status} />
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {new Date(d.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => handleViewDetail(d._id)}
                                                className="btn btn-secondary btn-sm"
                                                title="View items"
                                            >
                                                <Eye size={14} />
                                            </button>

                                            {['Draft', 'Waiting', 'Ready'].includes(d.status) && (
                                                <>
                                                    <button 
                                                        onClick={() => handleValidate(d._id, d.deliveryNumber)}
                                                        className="btn btn-success btn-sm"
                                                        title="Validate delivery and dispatch stock"
                                                    >
                                                        <CheckCircle size={14} />
                                                        <span>Validate</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCancel(d._id, d.deliveryNumber)}
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ color: 'var(--danger)' }}
                                                        title="Cancel order"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Delivery Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Outgoing Delivery Order"
                maxWidth={700}
            >
                <form onSubmit={handleCreateDelivery}>
                    <div className="form-group">
                        <label className="form-label">Client / Customer *</label>
                        <input 
                            type="text" 
                            required 
                            className="form-control"
                            placeholder="e.g. Acme Corp / Build Team"
                            value={formData.customer}
                            onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Source Warehouse *</label>
                            <select 
                                required
                                className="form-select"
                                value={formData.warehouseId}
                                onChange={(e) => handleWarehouseChange(e.target.value)}
                            >
                                <option value="">Select Warehouse</option>
                                {warehouses.map(w => (
                                    <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Source Location *</label>
                            <select 
                                required
                                className="form-select"
                                value={formData.locationId}
                                onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                            >
                                <option value="">Select Location</option>
                                {locations.map(l => (
                                    <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic line items */}
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Requested Products & Quantities *</label>
                            <button 
                                type="button" 
                                onClick={handleAddItem}
                                className="btn btn-secondary btn-sm"
                            >
                                <Plus size={13} />
                                <span>Add Line Item</span>
                            </button>
                        </div>

                        {formData.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 40px', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                                <select 
                                    required
                                    className="form-select"
                                    value={item.productId}
                                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                                >
                                    <option value="">Select Product to Pick</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} ({p.sku}) — Avail: {p.totalStock} {p.unitOfMeasure}
                                        </option>
                                    ))}
                                </select>

                                <input 
                                    type="number" 
                                    required
                                    min="1"
                                    className="form-control"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                />

                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveItem(idx)}
                                    disabled={formData.items.length === 1}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '8px', opacity: formData.items.length === 1 ? 0.3 : 1 }}
                                >
                                    <Trash2 size={14} color="var(--danger)" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Shipping / Delivery Address</label>
                        <textarea 
                            rows="2" 
                            className="form-control"
                            placeholder="Destination shipping address..."
                            value={formData.shippingAddress}
                            onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                        />
                    </div>

                    <div className="modal-footer" style={{ padding: 0, paddingTop: 16 }}>
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" id="btn-submit-delivery">
                            Create Delivery Order
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Delivery Order: ${selectedDelivery?.deliveryNumber || ''}`}
            >
                {selectedDelivery && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                            <div className="glass-card" style={{ padding: 14 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer</div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedDelivery.customer}</div>
                                <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                                <StatusBadge status={selectedDelivery.status} />
                            </div>

                            <div className="glass-card" style={{ padding: 14 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispatch Location</div>
                                <div style={{ fontWeight: 600 }}>{selectedDelivery.warehouseId?.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Rack/Bay: {selectedDelivery.locationId?.name}</div>
                                {selectedDelivery.validatedAt && (
                                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--success)' }}>
                                        Dispatched on {new Date(selectedDelivery.validatedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.9rem', marginBottom: 10 }}>Delivered Items</h4>
                        <div className="table-container" style={{ marginBottom: 20 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Quantity Dispatched</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDelivery.items?.map((it, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 600 }}>{it.productId?.name}</td>
                                            <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{it.productId?.sku}</td>
                                            <td><strong>{it.quantity}</strong> {it.productId?.unitOfMeasure || 'Units'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-footer" style={{ padding: 0 }}>
                            <button onClick={() => setIsDetailOpen(false)} className="btn btn-secondary">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Deliveries;
