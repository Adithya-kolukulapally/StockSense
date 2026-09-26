import api from './api';

export const getLedger = (params = {}) => {
    return api.get('/ledger', { params });
};

export const getProductLedger = (productId, params = {}) => {
    return api.get(`/ledger/${productId}`, { params });
};
