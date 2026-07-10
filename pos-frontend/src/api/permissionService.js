// src/api/permissionService.js
import axios from './axios';

export const getCashierPermissions = () =>
  axios.get('/permissions/users').then((res) => res.data.data);

export const updateCashierPermission = (userId, canReturnWithoutApproval) =>
  axios
    .patch(`/permissions/users/${userId}`, {
      can_return_without_approval: canReturnWithoutApproval,
    })
    .then((res) => res.data);