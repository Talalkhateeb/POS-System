import api from './axios';

export const getUsers = () => api.get('/users').then(res => res.data.data);
export const createUser = (payload) => api.post('/users', payload).then(res => res.data);
export const updateUser = (id, payload) => api.patch(`/users/${id}`, payload).then(res => res.data);