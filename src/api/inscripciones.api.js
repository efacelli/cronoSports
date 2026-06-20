import axiosClient from './axiosClient';

export const crearInscripcion = (data) => axiosClient.post('/inscripciones', data);

export const subirComprobante = (idInscripcion, file) => {
  const formData = new FormData();
  formData.append('comprobante', file);

  return axiosClient.post(`/inscripciones/${idInscripcion}/comprobante`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getInscripciones = (params = {}) => axiosClient.get('/inscripciones', { params });

export const getInscripcionById = (id) => axiosClient.get(`/inscripciones/${id}`);

export const getComprobanteUrl = (id) => {
  const base = axiosClient.defaults.baseURL;
  return `${base}/inscripciones/${id}/comprobante`;
};

/**
 * Descarga el comprobante vía axios (manda el JWT en el header)
 * y lo abre en una pestaña nueva como blob.
 * Un <a href> directo NO manda el token, por eso esta ruta protegida
 * fallaba al abrirse como link plano.
 */
export const verComprobante = async (id) => {
  const response = await axiosClient.get(`/inscripciones/${id}/comprobante`, {
    responseType: 'blob'
  });

  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');

  // libera memoria luego de un momento
  setTimeout(() => window.URL.revokeObjectURL(url), 30000);
};
