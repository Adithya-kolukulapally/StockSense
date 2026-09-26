import api from './api';

export const getReceipts = (params = {}) => {
    return api.get('/receipts', { params });
};

export const getReceiptById = (id) => {
    return api.get(`/receipts/${id}`);
};

export const createReceipt = (data) => {
    return api.post('/receipts', data);
};

export const updateReceipt = (id, data) => {
    return api.put(`/receipts/${id}`, data);
};

export const validateReceipt = (id) => {
    return api.post(`/receipts/${id}/validate`);
};

export const cancelReceipt = (id) => {
    return api.post(`/receipts/${id}/cancel`);
};
