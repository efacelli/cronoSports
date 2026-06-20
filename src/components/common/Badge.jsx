import { ESTADO_PAGO_BADGE } from '../../utils/formatters';

/**
 * Muestra el estado de pago de una inscripcion con color semantico.
 * @param {{ estado: 'Pendiente'|'Aprobado'|'Rechazado' }} props
 */
export default function Badge({ estado }) {
  const claseColor = ESTADO_PAGO_BADGE[estado] || 'bg-slate/15 text-slate';

  return <span className={`badge ${claseColor}`}>{estado}</span>;
}
