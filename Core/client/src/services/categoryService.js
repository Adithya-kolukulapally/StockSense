import api from './api';

export const getCategories = () => {
    return api.get('/categories');
};

export const createCategory = (data) => {
    return api.post('/categories', data);
};

export const updateCategory = (id, data) => {
    return api.put(`/categories/${id}`, data);
};

export const deleteCategory = (id) => {
    return api.delete(`/categories/${id}`);
};
