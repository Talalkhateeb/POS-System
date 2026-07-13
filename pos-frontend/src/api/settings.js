import api from './axios';

export const getSettings = () => api.get('/settings').then(res => res.data.data);
export const updateSettings = (payload) => api.put('/settings', payload).then(res => res.data.data);