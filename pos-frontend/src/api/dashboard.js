// src/api/dashboard.js
// Follows the same service-module pattern as src/api/settings.js and users.js
import api from './axios'; // adjust path if your axios instance lives elsewhere

export const getDashboardSummary = (period = 'today') =>
  api.get('/dashboard/summary', { params: { period } }).then((res) => res.data);

export const getCashierPerformance = (period = 'today') =>
  api.get('/dashboard/cashiers', { params: { period } }).then((res) => res.data);

export const getTopProducts = (period = 'today', limit = 5) =>
  api.get('/dashboard/top-products', { params: { period, limit } }).then((res) => res.data);