// src/api/dashboard.js
// Follows the same service-module pattern as src/api/settings.js and users.js
import api from './axios'; // adjust path if your axios instance lives elsewhere

export const getDashboardSummary = (params = { period: 'today' }) =>
  api.get('/dashboard/summary', { params }).then((res) => res.data);

export const getCashierPerformance = (params = { period: 'today' }) =>
  api.get('/dashboard/cashiers', { params }).then((res) => res.data);

export const getTopProducts = (params = { period: 'today', limit: 5 }) =>
  api.get('/dashboard/top-products', { params }).then((res) => res.data);

export const getDashboardHistory = (unit = 'day', points = 7) =>
  api.get('/dashboard/history', { params: { unit, points } }).then((res) => res.data);
