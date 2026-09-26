import api from './api';

export const getDeliveries = (params = {}) => {
    return api.get('/deliveries', { params });
};

export const getDeliveryById = (id) => {
    return api.get(`/deliveries/${id}`);
};

export const createDelivery = (data) => {
    return api.post('/deliveries', data);
};

export const updateDelivery = (id, data) => {
    return api.put(`/deliveries/${id}`, data);
};

export const validateDelivery = (id) => {
    return api.post(`/deliveries/${id}/validate`);
};

export const cancelDelivery = (id) => {
    return api.post(`/deliveries/${id}/cancel`);
};
