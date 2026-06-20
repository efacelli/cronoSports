import axiosClient from './axiosClient';

export const notificarAprobacion = (idInscripcion) =>
  axiosClient.post(`/emails/notificar-aprobacion/${idInscripcion}`);
