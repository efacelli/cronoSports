import { Link } from 'react-router-dom';
import { TIPO_CARRERA_LABEL, formatearFecha, formatearMoneda } from '../../utils/formatters';

const TIPO_COLOR = {
  running: 'bg-coral/10 text-coral',
  duatlon: 'bg-success/10 text-success',
  ciclismo: 'bg-navy/10 text-navy'
};

/**
 * Tarjeta resumen de una carrera, usada en la seccion "Carreras" de la home.
 */
export default function CarreraCard({ carrera }) {
  const cuposDisponibles = carrera.cupos_disponibles ?? carrera.cupo_maximo;
  const sinCupo = carrera.cupo_maximo > 0 && cuposDisponibles <= 0;

  return (
    <div className="card flex flex-col p-6">
      <div className="flex items-center justify-between">
        <span className={`badge ${TIPO_COLOR[carrera.tipo] || 'bg-slate/10 text-slate'}`}>
          {TIPO_CARRERA_LABEL[carrera.tipo] || carrera.tipo}
        </span>
        <span className="font-mono text-xs text-slate">
          {formatearFecha(carrera.fecha_evento)}
        </span>
      </div>

      <h3 className="mt-4 font-display text-xl text-navy">{carrera.nombre}</h3>

      {carrera.ubicacion && (
        <p className="mt-1 flex items-center gap-1 text-sm text-slate">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.5-4.5-7-8.25-7-11.5A7 7 0 0119 9.5c0 3.25-2.5 7-7 11.5z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          {carrera.ubicacion}
        </p>
      )}

      {carrera.descripcion && (
        <p className="mt-3 text-sm text-slate line-clamp-3">{carrera.descripcion}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate/70">Inscripción desde</p>
          <p className="font-mono font-semibold text-navy">{formatearMoneda(carrera.precio_base)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate/70">Cupos</p>
          <p className={`font-mono font-semibold ${sinCupo ? 'text-danger' : 'text-success'}`}>
            {sinCupo ? 'Agotados' : `${cuposDisponibles} disp.`}
          </p>
        </div>
      </div>

      <Link
        to={`/inscripcion?carrera=${carrera.id}`}
        className={`btn-primary mt-5 w-full ${sinCupo ? 'pointer-events-none opacity-50' : ''}`}
        aria-disabled={sinCupo}
      >
        {sinCupo ? 'Sin cupos disponibles' : 'Inscribirme a esta carrera'}
      </Link>
    </div>
  );
}
