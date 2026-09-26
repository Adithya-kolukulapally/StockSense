import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 650 }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div 
                className="modal-content" 
                style={{ maxWidth }} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: '6px', borderRadius: '50%' }}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
