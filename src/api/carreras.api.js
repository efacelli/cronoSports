import axiosClient from './axiosClient';

export const getCarreras = (params = {}) => axiosClient.get('/carreras', { params });

export const getCarreraById = (id) => axiosClient.get(`/carreras/${id}`);

export const createCarrera = (data) => axiosClient.post('/carreras', data);

export const updateCarrera = (id, data) => axiosClient.put(`/carreras/${id}`, data);

export const deleteCarrera = (id) => axiosClient.delete(`/carreras/${id}`);
