import api from './api';

export const getAdjustments = (params = {}) => {
    return api.get('/adjustments', { params });
};

export const getAdjustmentById = (id) => {
    return api.get(`/adjustments/${id}`);
};

export const createAdjustment = (data) => {
    return api.post('/adjustments', data);
};
