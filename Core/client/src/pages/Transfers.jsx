import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    ArrowLeftRight, 
    CheckCircle, 
    XCircle, 
    Trash2, 
    Eye, 
    RefreshCw,
    Search,
    ArrowRight
} from 'lucide-react';
import { 
    getTransfers, 
    createTransfer, 
    validateTransfer, 
    cancelTransfer, 
    getTransferById 
} from '../services/transferService';
import { getProducts } from '../services/productService';
import { getWarehouses, getLocations } from '../services/warehouseService';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const Transfers = () => {
    const { addToast } = useToast();

    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    
    // Separate location lists for source & destination
    const [sourceLocations, setSourceLocations] = useState([]);
    const [destLocations, setDestLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        sourceWarehouseId: '',
        sourceLocationId: '',
        destinationWarehouseId: '',
        destinationLocationId: '',
        reason: '',
        items: [{ productId: '', quantity: 1 }]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, pRes, wRes] = await Promise.all([
                getTransfers({ search, status: statusFilter }),
                getProducts({ limit: 100 }),
                getWarehouses()
            ]);

            if (tRes.success) setTransfers(tRes.data);
            if (pRes.success) setProducts(pRes.data);
            if (wRes.success) setWarehouses(wRes.data);
        } catch (err) {
            console.error(err);
            addToast('Error loading transfers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, statusFilter]);

    const handleSourceWarehouseChange = async (whId) => {
        setFormData(prev => ({ ...prev, sourceWarehouseId: whId, sourceLocationId: '' }));
        if (whId) {
            try {
                const res = await getLocations({ warehouseId: whId });
                if (res.success) setSourceLocations(res.data);
            } catch (err) {
                console.error(err);
            }
        } else {
            setSourceLocations([]);
        }
    };

    const handleDestWarehouseChange = async (whId) => {
        setFormData(prev => ({ ...prev, destinationWarehouseId: whId, destinationLocationId: '' }));
        if (whId) {
            try {
                const res = await getLocations({ warehouseId: whId });
                if (res.success) setDestLocations(res.data);
            } catch (err) {
                console.error(err);
            }
        } else {
            setDestLocations([]);
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

    const handleCreateTransfer = async (e) => {
        e.preventDefault();

        // Client-side prevention of same source and destination
        if (formData.sourceWarehouseId === formData.destinationWarehouseId &&
            formData.sourceLocationId === formData.destinationLocationId) {
            return addToast('Source and destination location cannot be identical', 'error');
        }

        try {
            const res = await createTransfer(formData);
            if (res.success) {
                addToast(`Internal Transfer ${res.data.transferNumber} scheduled! Ready for execution.`);
                setIsCreateOpen(false);
                setFormData({
                    sourceWarehouseId: '',
                    sourceLocationId: '',
                    destinationWarehouseId: '',
                    destinationLocationId: '',
                    reason: '',
                    items: [{ productId: '', quantity: 1 }]
                });
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Error creating transfer', 'error');
        }
    };

    const handleValidate = async (id, transferNumber) => {
        if (!window.confirm(`Execute transfer ${transferNumber}? This will move inventory between locations and record audit entries.`)) {
            return;
        }

        try {
            const res = await validateTransfer(id);
            if (res.success) {
                addToast(`Transfer ${transferNumber} completed! Stock relocated.`);
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Failed to complete transfer', 'error');
        }
    };

    const handleCancel = async (id, transferNumber) => {
        if (!window.confirm(`Cancel internal transfer ${transferNumber}?`)) {
            return;
        }

        try {
            const res = await cancelTransfer(id);
            if (res.success) {
                addToast(`Transfer ${transferNumber} marked as canceled.`, 'success');
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Failed to cancel transfer', 'error');
        }
    };

    const handleViewDetail = async (id) => {
        try {
            const res = await getTransferById(id);
            if (res.success) {
                setSelectedTransfer(res.data);
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
                    <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Internal Stock Transfers</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Relocate products between racks, floors, and warehouses while preserving overall company stock
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="btn btn-primary"
                    id="btn-create-transfer"
                >
                    <Plus size={16} />
                    <span>Create Transfer</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-box">
                    <Search size={16} color="var(--text-muted)" />
                    <input 
                        type="text"
                        placeholder="Search Transfer No..."
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
                        <option value="Ready">Ready</option>
                        <option value="Done">Done</option>
                        <option value="Canceled">Canceled</option>
                    </select>

                    <button onClick={fetchData} className="btn btn-secondary btn-sm" title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Transfers Table (Section 34) */}
            <div className="table-container">
                <table className="data-table" id="table-transfers">
                    <thead>
                        <tr>
                            <th>Transfer No.</th>
                            <th>Origin (Source)</th>
                            <th></th>
                            <th>Destination</th>
                            <th>Items Count</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    {loading ? 'Fetching transfer orders...' : 'No internal transfers found.'}
                                </td>
                            </tr>
                        ) : (
                            transfers.map(t => (
                                <tr key={t._id}>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--secondary)' }}>
                                            {t.transferNumber}
                                        </span>
                                    </td>
                                    <td>
                                        <div>{t.sourceWarehouseId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.sourceLocationId?.name}</div>
                                    </td>
                                    <td>
                                        <ArrowRight size={16} color="var(--primary)" />
                                    </td>
                                    <td>
                                        <div>{t.destinationWarehouseId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.destinationLocationId?.name}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{t.items?.length || 0}</span> item(s)
                                    </td>
                                    <td>
                                        <StatusBadge status={t.status} />
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => handleViewDetail(t._id)}
                                                className="btn btn-secondary btn-sm"
                                                title="View items"
                                            >
                                                <Eye size={14} />
                                            </button>

                                            {['Draft', 'Ready'].includes(t.status) && (
                                                <>
                                                    <button 
                                                        onClick={() => handleValidate(t._id, t.transferNumber)}
                                                        className="btn btn-success btn-sm"
                                                        title="Execute and relocate stock"
                                                    >
                                                        <CheckCircle size={14} />
                                                        <span>Validate</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCancel(t._id, t.transferNumber)}
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ color: 'var(--danger)' }}
                                                        title="Cancel transfer"
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

            {/* Create Transfer Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Internal Stock Transfer"
                maxWidth={700}
            >
                <form onSubmit={handleCreateTransfer}>
                    {/* Origin & Destination Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div style={{ padding: 14, background: 'var(--bg-glass-strong)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--warning)', marginBottom: 10 }}>
                                1. Source (Origin)
                            </div>
                            <div className="form-group">
                                <label className="form-label">Source Warehouse *</label>
                                <select 
                                    required
                                    className="form-select"
                                    value={formData.sourceWarehouseId}
                                    onChange={(e) => handleSourceWarehouseChange(e.target.value)}
                                >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map(w => (
                                        <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Source Location *</label>
                                <select 
                                    required
                                    className="form-select"
                                    value={formData.sourceLocationId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sourceLocationId: e.target.value }))}
                                >
                                    <option value="">Select Location</option>
                                    {sourceLocations.map(l => (
                                        <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ padding: 14, background: 'var(--bg-glass-strong)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--success)', marginBottom: 10 }}>
                                2. Destination (Target)
                            </div>
                            <div className="form-group">
                                <label className="form-label">Target Warehouse *</label>
                                <select 
                                    required
                                    className="form-select"
                                    value={formData.destinationWarehouseId}
                                    onChange={(e) => handleDestWarehouseChange(e.target.value)}
                                >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map(w => (
                                        <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Target Location *</label>
                                <select 
                                    required
                                    className="form-select"
                                    value={formData.destinationLocationId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, destinationLocationId: e.target.value }))}
                                >
                                    <option value="">Select Location</option>
                                    {destLocations.map(l => (
                                        <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Products line items */}
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Items to Relocate *</label>
                            <button 
                                type="button" 
                                onClick={handleAddItem}
                                className="btn btn-secondary btn-sm"
                            >
                                <Plus size={13} />
                                <span>Add Item</span>
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
                                    <option value="">Select Product</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} ({p.sku})
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
                        <label className="form-label">Transfer Reason / Request Ref</label>
                        <input 
                            type="text" 
                            className="form-control"
                            placeholder="e.g. Replenishing Rack B from general storage..."
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        />
                    </div>

                    <div className="modal-footer" style={{ padding: 0, paddingTop: 16 }}>
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" id="btn-submit-transfer">
                            Schedule Transfer
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Transfer Details: ${selectedTransfer?.transferNumber || ''}`}
            >
                {selectedTransfer && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                            <div className="glass-card" style={{ padding: 14 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From (Source)</div>
                                <div style={{ fontWeight: 600 }}>{selectedTransfer.sourceWarehouseId?.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Rack: {selectedTransfer.sourceLocationId?.name}</div>
                            </div>

                            <div className="glass-card" style={{ padding: 14 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To (Destination)</div>
                                <div style={{ fontWeight: 600 }}>{selectedTransfer.destinationWarehouseId?.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Rack: {selectedTransfer.destinationLocationId?.name}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status: </span>
                            <StatusBadge status={selectedTransfer.status} />
                            {selectedTransfer.reason && (
                                <div style={{ fontSize: '0.85rem', marginTop: 8 }}>
                                    <strong>Reason:</strong> {selectedTransfer.reason}
                                </div>
                            )}
                        </div>

                        <h4 style={{ fontSize: '0.9rem', marginBottom: 10 }}>Transfer Line Items</h4>
                        <div className="table-container" style={{ marginBottom: 20 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Quantity Transferred</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTransfer.items?.map((it, idx) => (
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

export default Transfers;
