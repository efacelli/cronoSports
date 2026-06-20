import axiosClient from './axiosClient';

export const getResumen = () => axiosClient.get('/dashboard/resumen');
export const getInscripcionesPorCarrera = () => axiosClient.get('/dashboard/inscripciones-por-carrera');
export const getInscripcionesPorFecha = () => axiosClient.get('/dashboard/inscripciones-por-fecha');
export const getInscripcionesPorCategoria = () => axiosClient.get('/dashboard/inscripciones-por-categoria');
export const getInscripcionesPorSexo = () => axiosClient.get('/dashboard/inscripciones-por-sexo');
export const getInscripcionesPorModalidad = () => axiosClient.get('/dashboard/inscripciones-por-modalidad');
export const getEvolucionInscripciones = () => axiosClient.get('/dashboard/evolucion');
