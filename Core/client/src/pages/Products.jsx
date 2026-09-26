import React, { useState, useEffect, useContext } from 'react';
import { 
    Plus, 
    Search, 
    Filter, 
    AlertCircle, 
    Boxes, 
    Eye, 
    Edit, 
    Layers, 
    RefreshCw,
    MapPin
} from 'lucide-react';
import { 
    getProducts, 
    createProduct, 
    updateProduct, 
    getProductById 
} from '../services/productService';
import { getCategories } from '../services/categoryService';
import { getWarehouses, getLocations } from '../services/warehouseService';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const Products = () => {
    const { user } = useContext(AuthContext);
    const { addToast } = useToast();
    const routerLocation = useLocation();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Parse URL query parameter for status (e.g. ?status=low_stock from dashboard)
    const queryParams = new URLSearchParams(routerLocation.search);
    const initialStatus = queryParams.get('status') || 'all';

    // Search and filters
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState(initialStatus);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Add Product Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        categoryId: '',
        unitOfMeasure: 'Units',
        description: '',
        reorderLevel: 10,
        reorderQuantity: 50,
        initialStock: 0,
        warehouseId: '',
        locationId: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, cRes, wRes] = await Promise.all([
                getProducts({
                    search,
                    category: selectedCategory,
                    status: selectedStatus
                }),
                getCategories(),
                getWarehouses()
            ]);

            if (pRes.success) setProducts(pRes.data);
            if (cRes.success) setCategories(cRes.data);
            if (wRes.success) setWarehouses(wRes.data);
        } catch (err) {
            console.error(err);
            addToast(err.message || 'Failed to fetch products', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, selectedCategory, selectedStatus]);

    // Handle warehouse change in add modal to load locations
    const handleModalWarehouseChange = async (whId) => {
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

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            const res = await createProduct(formData);
            if (res.success) {
                addToast(`Product '${res.data.name}' (${res.data.sku}) created successfully!`);
                setIsAddModalOpen(false);
                setFormData({
                    name: '',
                    sku: '',
                    categoryId: categories[0]?._id || '',
                    unitOfMeasure: 'Units',
                    description: '',
                    reorderLevel: 10,
                    reorderQuantity: 50,
                    initialStock: 0,
                    warehouseId: '',
                    locationId: ''
                });
                fetchData();
            }
        } catch (err) {
            addToast(err.message || 'Error creating product', 'error');
        }
    };

    const handleViewProduct = async (id) => {
        try {
            const res = await getProductById(id);
            if (res.success) {
                setSelectedProduct(res.data);
                setIsDetailModalOpen(true);
            }
        } catch (err) {
            addToast('Could not load product details', 'error');
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Products Catalog</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Manage primary inventory items, SKU codes, categories, and stock availability
                    </p>
                </div>
                {user?.role === 'inventory_manager' && (
                    <button 
                        onClick={() => {
                            if (categories.length > 0 && !formData.categoryId) {
                                setFormData(prev => ({ ...prev, categoryId: categories[0]._id }));
                            }
                            setIsAddModalOpen(true);
                        }}
                        className="btn btn-primary"
                        id="btn-create-product"
                    >
                        <Plus size={16} />
                        <span>Add Product</span>
                    </button>
                )}
            </div>

            {/* Filter and Search Bar (Section 28, 30) */}
            <div className="filter-bar">
                {/* Search SKU / Product Name */}
                <div className="search-box">
                    <Search size={16} color="var(--text-muted)" />
                    <input 
                        type="text"
                        placeholder="Search by SKU or Product Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="input-search-product"
                    />
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {/* Category Filter */}
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="form-select"
                        id="filter-category"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>

                    {/* Stock Status Filter */}
                    <select 
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="form-select"
                        id="filter-product-status"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    >
                        <option value="all">All Stock Levels</option>
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>

                    <button onClick={fetchData} className="btn btn-secondary btn-sm" title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Products Table (Section 30) */}
            <div className="table-container">
                <table className="data-table" id="table-products">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>SKU / Code</th>
                            <th>Category</th>
                            <th>Unit</th>
                            <th>Current Stock</th>
                            <th>Reorder Threshold</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    {loading ? 'Loading catalog items...' : 'No products found matching your search.'}
                                </td>
                            </tr>
                        ) : (
                            products.map(p => (
                                <tr key={p._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                        {p.description && (
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                {p.description}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                                            {p.sku}
                                        </span>
                                    </td>
                                    <td>{p.categoryId?.name || 'General'}</td>
                                    <td>{p.unitOfMeasure}</td>
                                    <td>
                                        <span style={{ 
                                            fontWeight: 700, 
                                            fontSize: '1rem',
                                            color: p.totalStock === 0 ? 'var(--danger)' : (p.totalStock <= p.reorderLevel ? 'var(--warning)' : '#fff')
                                        }}>
                                            {p.totalStock}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {p.reorderLevel} {p.unitOfMeasure}
                                    </td>
                                    <td>
                                        <StatusBadge status={p.stockStatus} />
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button 
                                            onClick={() => handleViewProduct(p._id)}
                                            className="btn btn-secondary btn-sm"
                                            title="View Location Breakdown"
                                        >
                                            <Eye size={14} />
                                            <span>Locations</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Product Modal (Section 31) */}
            <Modal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                title="Create New Inventory Product"
            >
                <form onSubmit={handleCreateProduct}>
                    <div className="form-group">
                        <label className="form-label">Product Name *</label>
                        <input 
                            type="text" 
                            required 
                            className="form-control"
                            placeholder="e.g. Steel Rods 12mm"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">SKU / Unique Code *</label>
                            <input 
                                type="text" 
                                required 
                                className="form-control"
                                placeholder="e.g. STEEL-001"
                                value={formData.sku}
                                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            <select 
                                required 
                                className="form-select"
                                value={formData.categoryId}
                                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Unit of Measure *</label>
                            <input 
                                type="text" 
                                required 
                                className="form-control"
                                placeholder="Units, kg, Liters..."
                                value={formData.unitOfMeasure}
                                onChange={(e) => setFormData(prev => ({ ...prev, unitOfMeasure: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reorder Level</label>
                            <input 
                                type="number" 
                                min="0"
                                className="form-control"
                                value={formData.reorderLevel}
                                onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reorder Qty</label>
                            <input 
                                type="number" 
                                min="0"
                                className="form-control"
                                value={formData.reorderQuantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, reorderQuantity: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea 
                            rows="2" 
                            className="form-control"
                            placeholder="Specification, dimensions, or material grade..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    {/* Initial Stock Configuration (Section 31) */}
                    <div style={{ padding: 14, background: 'var(--bg-glass-strong)', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10, color: 'var(--primary)' }}>
                            Initial Stock Setup (Optional)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="form-label">Initial Quantity</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="form-control"
                                    value={formData.initialStock}
                                    onChange={(e) => setFormData(prev => ({ ...prev, initialStock: e.target.value }))}
                                />
                            </div>

                            {Number(formData.initialStock) > 0 && (
                                <>
                                    <div>
                                        <label className="form-label">Warehouse</label>
                                        <select 
                                            className="form-select"
                                            value={formData.warehouseId}
                                            onChange={(e) => handleModalWarehouseChange(e.target.value)}
                                        >
                                            <option value="">Select Warehouse</option>
                                            {warehouses.map(w => (
                                                <option key={w._id} value={w._id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="form-label">Location</label>
                                        <select 
                                            className="form-select"
                                            value={formData.locationId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                                        >
                                            <option value="">Select Location</option>
                                            {locations.map(l => (
                                                <option key={l._id} value={l._id}>{l.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        {Number(formData.initialStock) > 0 && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                An initial stock inventory entry and audit ledger record will be created automatically.
                            </p>
                        )}
                    </div>

                    <div className="modal-footer" style={{ padding: 0, paddingTop: 16 }}>
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" id="btn-submit-product">
                            Save Product
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Product Locations Breakdown Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Inventory Distribution: ${selectedProduct?.name || ''}`}
            >
                {selectedProduct && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 14, background: 'var(--bg-glass-strong)', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
                            <div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU</div>
                                <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>{selectedProduct.sku}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Availability</div>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{selectedProduct.totalStock} {selectedProduct.unitOfMeasure}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Category</div>
                                <div style={{ fontWeight: 600 }}>{selectedProduct.categoryId?.name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status</div>
                                <StatusBadge status={selectedProduct.stockStatus} />
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.92rem', marginBottom: 12 }}>Stock per Warehouse & Internal Location</h4>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Warehouse</th>
                                        <th>Location</th>
                                        <th>Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!selectedProduct.inventories || selectedProduct.inventories.length === 0) ? (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                                No stock recorded in any warehouse location yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedProduct.inventories.map((inv, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{inv.warehouseId?.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.warehouseId?.code}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <MapPin size={14} color="var(--primary)" />
                                                        <span>{inv.locationId?.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong style={{ fontSize: '1rem' }}>{inv.quantity}</strong> {selectedProduct.unitOfMeasure}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-footer" style={{ padding: 0, paddingTop: 20 }}>
                            <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-secondary">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Products;
