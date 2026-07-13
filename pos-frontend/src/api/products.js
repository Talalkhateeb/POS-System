import api from './axios';

export const getProducts = () => api.get('/products').then(res => res.data.data);
export const createProduct = (payload) => api.post('/products', payload).then(res => res.data);
export const updateProduct = (id, payload) => api.patch(`/products/${id}`, payload).then(res => res.data);