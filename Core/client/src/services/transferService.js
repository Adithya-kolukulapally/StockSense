import api from './api';

export const getTransfers = (params = {}) => {
    return api.get('/transfers', { params });
};

export const getTransferById = (id) => {
    return api.get(`/transfers/${id}`);
};

export const createTransfer = (data) => {
    return api.post('/transfers', data);
};

export const updateTransfer = (id, data) => {
    return api.put(`/transfers/${id}`, data);
};

export const validateTransfer = (id) => {
    return api.post(`/transfers/${id}/validate`);
};

export const cancelTransfer = (id) => {
    return api.post(`/transfers/${id}/cancel`);
};
