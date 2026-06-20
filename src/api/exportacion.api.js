import axiosClient from './axiosClient';

/**
 * Descarga el Excel de inscriptos aprobados y dispara la descarga
 * en el navegador.
 * @param {Object} params - { id_carrera }
 */
export const exportarInscriptosAprobados = async (params = {}) => {
  const response = await axiosClient.get('/export/inscripciones', {
    params,
    responseType: 'blob'
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const fecha = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `inscriptos_aprobados_${fecha}.xlsx`);

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
