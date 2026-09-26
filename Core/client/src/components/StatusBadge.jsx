import React from 'react';

const StatusBadge = ({ status }) => {
    if (!status) return null;

    const lower = String(status).toLowerCase();

    let className = 'badge-draft';
    let label = status;

    if (lower === 'done' || lower === 'completed') {
        className = 'badge-done';
        label = 'Done';
    } else if (lower === 'ready') {
        className = 'badge-ready';
        label = 'Ready';
    } else if (lower === 'waiting') {
        className = 'badge-waiting';
        label = 'Waiting';
    } else if (lower === 'canceled' || lower === 'cancelled') {
        className = 'badge-canceled';
        label = 'Canceled';
    } else if (lower === 'low_stock') {
        className = 'badge-low-stock';
        label = 'Low Stock';
    } else if (lower === 'out_of_stock') {
        className = 'badge-out-of-stock';
        label = 'Out of Stock';
    } else if (lower === 'in_stock') {
        className = 'badge-in-stock';
        label = 'In Stock';
    } else if (lower === 'draft') {
        className = 'badge-draft';
        label = 'Draft';
    }

    return (
        <span className={`badge ${className}`}>
            <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'currentColor',
                display: 'inline-block'
            }} />
            {label}
        </span>
    );
};

export default StatusBadge;
