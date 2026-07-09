import api from './axios';

export const getCurrentShift = () => api.get('/shifts/current').then(res => res.data);
export const openShift = (payload) => api.post('/shifts/open', payload).then(res => res.data);
export const closeShift = (payload) => api.post('/shifts/close', payload).then(res => res.data);
export const getShiftMovements = (shiftId) => api.get(`/shifts/${shiftId}/movements`).then(res => res.data);