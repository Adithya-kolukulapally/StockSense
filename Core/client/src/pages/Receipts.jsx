import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    ArrowDownToLine, 
    CheckCircle, 
    XCircle, 
    Trash2, 
    Eye, 
    RefreshCw,
    Search
} from 'lucide-react';
import { 
    getReceipts, 
    createReceipt, 
    validateReceipt, 
    cancelReceipt, 
    getReceiptById 
} from '../services/receiptService';
import { getProducts } from '../services/productService';
import { getWarehouses, getLocations } from '../services/warehouseService';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const Receipts = () => {
    const { addToast } = useToast();

    const [receipts, setReceipts] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    // Create form state
    const [formData, setFormData] = useState({
        supplier: '',
        warehouseId: '',
        locationId: '',
        notes: '',
        items: [{ productId: '', quantity: 1, unitOfMeasure: 'Units' }]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rRes, pRes, wRes] = await Promise.all([
                getReceipts({ search, status: statusFilter }),
                getProducts({ limit: 100 }),
                getWarehouses()
            ]);

            if (rRes.success) setReceipts(rRes.data);
            if (pRes.success) setProducts(pRes.data);
            if (wRes.success) setWarehouses(wRes.data);
        } catch (err) {
            console.error(err);
            addToast('Error loading receipts', 'error');
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
            items: [...prev.items, { productId: '', quantity: 1, unitOfMeasure: 'Units' }]
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

        // Auto-populate unit of measure when product is chosen
        if (field === 'productId') {
            const prod = products.find(p => p._id === value);
            if (prod) {
                newItems[index].unitOfMeasure = prod.unitOfMeasure;
            }
        }

        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleCreateReceipt = async (e) => {
        e.preventDefault();
        try {
            const res = await createReceipt(formData);
            if (res.success) {
                addToast(`Receipt ${res.data.receiptNumber} created! Ready for validation.`);
                setIsCreateOpen(false);
                setFormData({
                    supplier: '',
                    warehouseId: '',
                    locationId: '',
                    notes: '',
                    items: [{ productId: '', quantity: 1, unitOfMeasure: 'Units' }]
                });
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Error creating receipt', 'error');
        }
    };

    const handleValidate = async (id, receiptNumber) => {
        if (!window.confirm(`Validate receipt ${receiptNumber}? This will immediately increment physical inventory and record Stock Ledger entries.`)) {
            return;
        }

        try {
            const res = await validateReceipt(id);
            if (res.success) {
                addToast(`Receipt ${receiptNumber} validated! Inventory successfully updated.`);
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Failed to validate receipt', 'error');
        }
    };

    const handleCancel = async (id, receiptNumber) => {
        if (!window.confirm(`Are you sure you want to cancel receipt ${receiptNumber}?`)) {
            return;
        }

        try {
            const res = await cancelReceipt(id);
            if (res.success) {
                addToast(`Receipt ${receiptNumber} marked as canceled.`, 'success');
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Failed to cancel receipt', 'error');
        }
    };

    const handleViewDetail = async (id) => {
        try {
            const res = await getReceiptById(id);
            if (res.success) {
                setSelectedReceipt(res.data);
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
                    <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Incoming Stock (Receipts)</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Process incoming vendor deliveries, verify items, and validate automatic stock increases
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="btn btn-primary"
                    id="btn-create-receipt"
                >
                    <Plus size={16} />
                    <span>Create Receipt</span>
                </button>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="search-box">
                    <Search size={16} color="var(--text-muted)" />
                    <input 
                        type="text"
                        placeholder="Search Receipt No. or Supplier..."
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

            {/* Receipts Table (Section 32) */}
            <div className="table-container">
                <table className="data-table" id="table-receipts">
                    <thead>
                        <tr>
                            <th>Receipt No.</th>
                            <th>Supplier</th>
                            <th>Destination Warehouse / Location</th>
                            <th>Items Count</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receipts.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    {loading ? 'Fetching receipts...' : 'No receipts found.'}
                                </td>
                            </tr>
                        ) : (
                            receipts.map(r => (
                                <tr key={r._id}>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--info)' }}>
                                            {r.receiptNumber}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>{r.supplier}</strong>
                                    </td>
                                    <td>
                                        <div>{r.warehouseId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.locationId?.name}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{r.items?.length || 0}</span> item(s)
                                    </td>
                                    <td>
                                        <StatusBadge status={r.status} />
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => handleViewDetail(r._id)}
                                                className="btn btn-secondary btn-sm"
                                                title="View items"
                                            >
                                                <Eye size={14} />
                                            </button>

                                            {['Draft', 'Waiting', 'Ready'].includes(r.status) && (
                                                <>
                                                    <button 
                                                        onClick={() => handleValidate(r._id, r.receiptNumber)}
                                                        className="btn btn-success btn-sm"
                                                        title="Validate receipt and increase stock"
                                                    >
                                                        <CheckCircle size={14} />
                                                        <span>Validate</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCancel(r._id, r.receiptNumber)}
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ color: 'var(--danger)' }}
                                                        title="Cancel receipt"
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

            {/* Create Receipt Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Incoming Goods Receipt"
                maxWidth={700}
            >
                <form onSubmit={handleCreateReceipt}>
                    <div className="form-group">
                        <label className="form-label">Vendor / Supplier *</label>
                        <input 
                            type="text" 
                            required 
                            className="form-control"
                            placeholder="e.g. Apex Industrial Supplies"
                            value={formData.supplier}
                            onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Destination Warehouse *</label>
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
                            <label className="form-label">Destination Location *</label>
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
                            <label className="form-label" style={{ marginBottom: 0 }}>Products & Quantities *</label>
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
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                                <select 
                                    required
                                    className="form-select"
                                    value={item.productId}
                                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                                >
                                    <option value="">Select Product</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
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

                                <input 
                                    type="text" 
                                    className="form-control"
                                    placeholder="Unit"
                                    value={item.unitOfMeasure}
                                    onChange={(e) => handleItemChange(idx, 'unitOfMeasure', e.target.value)}
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
                        <label className="form-label">Notes / Purchase Order Ref</label>
                        <textarea 
                            rows="2" 
                            className="form-control"
                            placeholder="Optional shipping notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    <div className="modal-footer" style={{ padding: 0, paddingTop: 16 }}>
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" id="btn-submit-receipt">
                            Create Draft Receipt
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Receipt Details: ${selectedReceipt?.receiptNumber || ''}`}
            >
                {selectedReceipt && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                            <div className="glass-card" style={{ padding: 14 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supplier</div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedReceipt.supplier}</div>
                                <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                                <StatusBadge status={selectedReceipt.status} />
                            </div>

                            <div className="glass-card" style={{ padding: 14 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Destination Warehouse</div>
                                <div style={{ fontWeight: 600 }}>{selectedReceipt.warehouseId?.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Location: {selectedReceipt.locationId?.name}</div>
                                {selectedReceipt.validatedAt && (
                                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--success)' }}>
                                        Validated on {new Date(selectedReceipt.validatedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.9rem', marginBottom: 10 }}>Received Products Line Items</h4>
                        <div className="table-container" style={{ marginBottom: 20 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Quantity Received</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedReceipt.items?.map((it, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 600 }}>{it.productId?.name}</td>
                                            <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{it.productId?.sku}</td>
                                            <td><strong>{it.quantity}</strong> {it.unitOfMeasure || 'Units'}</td>
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

export default Receipts;
