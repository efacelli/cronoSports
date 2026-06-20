import axiosClient from './axiosClient';

export const getCategorias             = ()     => axiosClient.get('/categorias');
export const getCategoriaById          = (id)   => axiosClient.get(`/categorias/${id}`);
export const getCategoriasByCarrera    = (idC)  => axiosClient.get(`/categorias/carrera/${idC}`);
export const createCategoria           = (data) => axiosClient.post('/categorias', data);
export const updateCategoria           = (id, data) => axiosClient.put(`/categorias/${id}`, data);
export const deleteCategoria           = (id)   => axiosClient.delete(`/categorias/${id}`);
export const generarCategoriasEstandar = ()     => axiosClient.post('/categorias/generar-estandar');
export const reemplazarCategoriasCarrera = (idCarrera, ids) =>
  axiosClient.put(`/categorias/carrera/${idCarrera}/reemplazar`, { ids });
