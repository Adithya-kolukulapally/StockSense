import api from './api';

export const getWarehouses = () => {
    return api.get('/warehouses');
};

export const createWarehouse = (data) => {
    return api.post('/warehouses', data);
};

export const updateWarehouse = (id, data) => {
    return api.put(`/warehouses/${id}`, data);
};

export const deleteWarehouse = (id) => {
    return api.delete(`/warehouses/${id}`);
};

export const getLocations = (params = {}) => {
    return api.get('/locations', { params });
};

export const createLocation = (data) => {
    return api.post('/locations', data);
};

export const updateLocation = (id, data) => {
    return api.put(`/locations/${id}`, data);
};

export const deleteLocation = (id) => {
    return api.delete(`/locations/${id}`);
};
