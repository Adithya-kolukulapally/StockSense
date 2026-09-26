import React, { useState, useEffect, useContext } from 'react';
import { 
    Warehouse as WhIcon, 
    MapPin, 
    Plus, 
    Trash2, 
    Layers, 
    Building2, 
    Check, 
    RefreshCw 
} from 'lucide-react';
import { 
    getWarehouses, 
    createWarehouse, 
    deleteWarehouse, 
    getLocations, 
    createLocation, 
    deleteLocation 
} from '../services/warehouseService';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { AuthContext } from '../context/AuthContext';

const Warehouses = () => {
    const { user } = useContext(AuthContext);
    const { addToast } = useToast();

    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isWhModalOpen, setIsWhModalOpen] = useState(false);
    const [isLocModalOpen, setIsLocModalOpen] = useState(false);

    const [whFormData, setWhFormData] = useState({ name: '', code: '', address: '' });
    const [locFormData, setLocFormData] = useState({ name: '', code: '' });

    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const res = await getWarehouses();
            if (res.success) {
                setWarehouses(res.data);
                if (res.data.length > 0 && !selectedWarehouse) {
                    setSelectedWarehouse(res.data[0]);
                }
            }
        } catch (err) {
            console.error(err);
            addToast('Error loading warehouses', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async (whId) => {
        try {
            const res = await getLocations({ warehouseId: whId });
            if (res.success) setLocations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    useEffect(() => {
        if (selectedWarehouse) {
            fetchLocations(selectedWarehouse._id);
        }
    }, [selectedWarehouse]);

    const handleCreateWarehouse = async (e) => {
        e.preventDefault();
        try {
            const res = await createWarehouse(whFormData);
            if (res.success) {
                addToast(`Warehouse ${res.data.name} created!`);
                setIsWhModalOpen(false);
                setWhFormData({ name: '', code: '', address: '' });
                fetchWarehouses();
            }
        } catch (err) {
            addToast(err.message || 'Error creating warehouse', 'error');
        }
    };

    const handleCreateLocation = async (e) => {
        e.preventDefault();
        try {
            const res = await createLocation({
                ...locFormData,
                warehouseId: selectedWarehouse._id
            });
            if (res.success) {
                addToast(`Location ${res.data.name} added!`);
                setIsLocModalOpen(false);
                setLocFormData({ name: '', code: '' });
                fetchLocations(selectedWarehouse._id);
            }
        } catch (err) {
            addToast(err.message || 'Error creating location', 'error');
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Warehouses & Locations</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Configure physical facilities, inventory zones, storage racks, and production floors
                    </p>
                </div>
                {user?.role === 'inventory_manager' && (
                    <button 
                        onClick={() => setIsWhModalOpen(true)}
                        className="btn btn-primary"
                        id="btn-add-warehouse"
                    >
                        <Plus size={16} />
                        <span>Add Warehouse</span>
                    </button>
                )}
            </div>

            {/* 2-Column Layout: Warehouses on Left, Locations on Right */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                {/* Warehouses list */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={18} color="var(--primary)" />
                        <span>Warehouses ({warehouses.length})</span>
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {warehouses.map(w => {
                            const isSelected = selectedWarehouse?._id === w._id;
                            return (
                                <div 
                                    key={w._id}
                                    onClick={() => setSelectedWarehouse(w)}
                                    className="glass-card"
                                    style={{
                                        cursor: 'pointer',
                                        padding: '16px 18px',
                                        borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                                        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: isSelected ? '#fff' : 'var(--text-primary)' }}>
                                                {w.name}
                                            </div>
                                            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--primary)', marginTop: 2 }}>
                                                Code: {w.code}
                                            </div>
                                            {w.address && (
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                                    {w.address}
                                                </div>
                                            )}
                                        </div>
                                        <span className="badge badge-draft" style={{ fontSize: '0.72rem' }}>
                                            {w.locationCount || 0} locs
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Locations in selected warehouse */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MapPin size={18} color="var(--success)" />
                            <span>
                                Storage Locations in <em>{selectedWarehouse?.name || 'Selected Warehouse'}</em>
                            </span>
                        </h3>

                        {user?.role === 'inventory_manager' && selectedWarehouse && (
                            <button 
                                onClick={() => setIsLocModalOpen(true)}
                                className="btn btn-secondary btn-sm"
                                id="btn-add-location"
                            >
                                <Plus size={14} />
                                <span>Add Location / Rack</span>
                            </button>
                        )}
                    </div>

                    <div className="table-container">
                        <table className="data-table" id="table-locations">
                            <thead>
                                <tr>
                                    <th>Location Name</th>
                                    <th>Code / Identifier</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                            No storage locations created yet for this warehouse.
                                        </td>
                                    </tr>
                                ) : (
                                    locations.map(loc => (
                                        <tr key={loc._id}>
                                            <td style={{ fontWeight: 600 }}>{loc.name}</td>
                                            <td>
                                                <span style={{ fontFamily: 'monospace', color: 'var(--success)', fontWeight: 600 }}>
                                                    {loc.code}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge badge-done">Active</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Warehouse Modal */}
            <Modal
                isOpen={isWhModalOpen}
                onClose={() => setIsWhModalOpen(false)}
                title="Register New Warehouse"
            >
                <form onSubmit={handleCreateWarehouse}>
                    <div className="form-group">
                        <label className="form-label">Warehouse Name *</label>
                        <input 
                            type="text" 
                            required 
                            className="form-control"
                            placeholder="e.g. Distribution Center 3"
                            value={whFormData.name}
                            onChange={(e) => setWhFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Warehouse Code *</label>
                        <input 
                            type="text" 
                            required 
                            className="form-control"
                            placeholder="e.g. WH-DIST-3"
                            value={whFormData.code}
                            onChange={(e) => setWhFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Physical Address</label>
                        <textarea 
                            rows="2" 
                            className="form-control"
                            placeholder="Facility road, city, zip..."
                            value={whFormData.address}
                            onChange={(e) => setWhFormData(prev => ({ ...prev, address: e.target.value }))}
                        />
                    </div>

                    <div className="modal-footer" style={{ padding: 0, paddingTop: 16 }}>
                        <button type="button" onClick={() => setIsWhModalOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save Warehouse
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Create Location Modal */}
            <Modal
                isOpen={isLocModalOpen}
                onClose={() => setIsLocModalOpen(false)}
                title={`Add Storage Location to ${selectedWarehouse?.name || ''}`}
            >
                <form onSubmit={handleCreateLocation}>
                    <div className="form-group">
                        <label className="form-label">Location / Zone / Rack Name *</label>
                        <input 
                            type="text" 
                            required 
                            className="form-control"
                            placeholder="e.g. Rack C (Chemicals)"
                            value={locFormData.name}
                            onChange={(e) => setLocFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Location Code *</label>
                        <input 
                            type="text" 
                            required 
                            className="form-control"
                            placeholder="e.g. RACK-C"
                            value={locFormData.code}
                            onChange={(e) => setLocFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        />
                    </div>

                    <div className="modal-footer" style={{ padding: 0, paddingTop: 16 }}>
                        <button type="button" onClick={() => setIsLocModalOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save Location
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Warehouses;
