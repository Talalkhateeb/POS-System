import api from './axios';

export const updateProfile = (payload) =>
  api.put('/me', payload).then((res) => res.data.user);
