import axiosClient from './axiosClient';

export const getModalidadesByCarrera = (idCarrera) =>
  axiosClient.get('/modalidades', { params: { carrera_id: idCarrera } });

export const getModalidadById = (id) => axiosClient.get(`/modalidades/${id}`);

export const createModalidad = (data) => axiosClient.post('/modalidades', data);

export const updateModalidad = (id, data) => axiosClient.put(`/modalidades/${id}`, data);

export const deleteModalidad = (id) => axiosClient.delete(`/modalidades/${id}`);
