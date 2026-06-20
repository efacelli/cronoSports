import axiosClient from './axiosClient';

export const getPagos = (params = {}) => axiosClient.get('/pagos', { params });

export const aprobarPago = (id) => axiosClient.patch(`/pagos/${id}/aprobar`);

export const rechazarPago = (id) => axiosClient.patch(`/pagos/${id}/rechazar`);

export const reabrirPago = (id) => axiosClient.patch(`/pagos/${id}/reabrir`);
