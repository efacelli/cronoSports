export function formatearFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-AR', { timeZone: 'UTC' });
}

export function formatearFechaHora(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-AR');
}

export function formatearMoneda(valor) {
  const numero = Number(valor || 0);
  return numero.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

export const TIPO_CARRERA_LABEL = {
  running:  'Running',
  duatlon:  'Duatlón',
  ciclismo: 'Ciclismo',
  triatlon: 'Triatlón'
};

export const ESTADO_CARRERA_LABEL = {
  activa: 'Activa',
  cerrada: 'Cerrada',
  finalizada: 'Finalizada'
};

export const SEXO_LABEL = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Mixto / Libre'
};

export const ESTADO_PAGO_BADGE = {
  Pendiente: 'badge-pendiente',
  Aprobado: 'badge-aprobado',
  Rechazado: 'badge-rechazado'
};
