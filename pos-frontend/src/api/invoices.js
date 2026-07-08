import api from './axios';

export const getInvoices = () => api.get('/invoices').then(res => res.data.data);
export const createInvoice = (payload) => api.post('/invoices', payload).then(res => res.data);