import api from './api';

export const getDashboardSummary = () => {
    return api.get('/dashboard/summary');
};

export const getDashboardOperations = (params = {}) => {
    return api.get('/dashboard/operations', { params });
};
