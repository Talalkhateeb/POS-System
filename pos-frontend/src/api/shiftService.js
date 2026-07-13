import axios from './axios';

export const getCurrentShift = () =>
  axios.get('/shifts/current').then((res) => res.data);

export const openShift = (openingBalance) =>
  axios.post('/shifts/open', { opening_balance: openingBalance }).then((res) => res.data);

export const closeShift = (countedBalance) =>
  axios.post('/shifts/close', { counted_balance: countedBalance }).then((res) => res.data);

export const getShiftMovements = (shiftId) =>
  axios.get(`/shifts/${shiftId}/movements`).then((res) => res.data);