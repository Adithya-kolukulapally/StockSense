import React, { useState, useEffect, useContext } from 'react';
import { Tags, Plus, RefreshCw, Trash2, FolderPlus } from 'lucide-react';
import { getCategories, createCategory, deleteCategory } from '../services/categoryService';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { AuthContext } from '../context/AuthContext';

const Categories = () => {
    const { user } = useContext(AuthContext);
    const { addToast } = useToast();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await getCategories();
            if (res.success) setCategories(res.data);
        } catch (err) {
            console.error(err);
            addToast('Error loading categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await createCategory(formData);
            if (res.success) {
                addToast(`Category '${res.data.name}' added successfully!`);
                setIsCreateOpen(false);
                setFormData({ name: '', description: '' });
                fetchCategories();
            }
        } catch (err) {
            addToast(err.message || 'Error creating category', 'error');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete category '${name}'?`)) return;
        try {
            const res = await deleteCategory(id);
            if (res.success) {
                addToast(`Category '${name}' deleted.`);
                fetchCategories();
            }
        } catch (err) {
            addToast(err.message || 'Failed to delete category', 'error');
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Product Categories</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Structure inventory items into logical classification hierarchies
                    </p>
                </div>
                {user?.role === 'inventory_manager' && (
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="btn btn-primary"
                        id="btn-add-category"
                    >
                        <Plus size={16} />
                        <span>Add Category</span>
                    </button>
                )}
            </div>

            {/* Categories Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {categories.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {loading ? 'Loading categories...' : 'No categories created yet.'}
                    </div>
                ) : (
                    categories.map(c => (
                        <div key={c._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <div style={{ padding: 8, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                        <Tags size={18} />
                                    </div>
                                    <span className="badge badge-draft">
                                        {c.productCount || 0} products
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.15rem', marginBottom: 6 }}>{c.name}</h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {c.description || 'No description provided.'}
                                </p>
                            </div>

                            {user?.role === 'inventory_manager' && (
                                <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button 
                                        onClick={() => handleDelete(c._id, c.name)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ color: 'var(--danger)', padding: '6px' }}
                                        title="Delete Category"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Category Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Product Category"
            >
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label className="form-label">Category Name *</label>
                        <input 
                            type="text" 
                            required 
                            className="form-control"
                            placeholder="e.g. Electrical Components"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea 
                            rows="2" 
                            className="form-control"
                            placeholder="Brief classification description..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div className="modal-footer" style={{ padding: 0, paddingTop: 16 }}>
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save Category
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Categories;
