import axios from './axios';

export const lookupInvoice = (invoiceNumber) =>
  axios.get(`/invoices/lookup/${invoiceNumber}`).then((res) => res.data.data);

export const submitReturn = (payload) =>
  axios.post('/returns', payload).then((res) => res.data.data);