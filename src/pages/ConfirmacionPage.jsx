import { Link, useLocation, Navigate } from 'react-router-dom';
import { formatearFecha } from '../utils/formatters';

export default function ConfirmacionPage() {
  const location = useLocation();
  const inscripcion = location.state?.inscripcion;

  if (!inscripcion) return <Navigate to="/inscripcion" replace />;

  const nombreCompleto = inscripcion.apellido && inscripcion.nombre
    ? `${inscripcion.apellido}, ${inscripcion.nombre}`
    : inscripcion.nombre_completo || '—';

  return (
    <section className="bg-sand py-16">
      <div className="container-page max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="mt-6 font-display text-3xl text-navy sm:text-4xl">
          ¡Inscripción registrada!
        </h1>
        <p className="mt-3 text-slate">
          Recibimos tus datos y tu comprobante de pago. Un administrador
          revisará tu pago y tu inscripción quedará{' '}
          <span className="font-semibold text-warning">Pendiente</span> hasta
          su aprobación.
        </p>

        <div className="card mt-8 p-6 text-left">
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <span className="text-sm text-slate">Número de inscripción</span>
            <span className="bib-number text-xl">
              #{String(inscripcion.id).padStart(5, '0')}
            </span>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Carrera',            inscripcion.carrera_nombre],
              ['Apellido y nombre',  nombreCompleto],
              ['DNI',                inscripcion.dni],
              ['Email',              inscripcion.email || '—'],
              ['Teléfono',           inscripcion.telefono || '—'],
              ['Ciudad',             inscripcion.ciudad || '—'],
              ['Edad',               inscripcion.edad ? `${inscripcion.edad} años` : '—'],
              ['Categoría asignada', inscripcion.categoria],
              ['Fecha inscripción',  formatearFecha(inscripcion.fecha_inscripcion)]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-slate shrink-0">{label}</dt>
                <dd className={`font-semibold text-right ${label === 'Categoría asignada' ? 'text-success' : 'text-navy'}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-6 text-sm text-slate">
          Ante cualquier consulta escribinos a{' '}
          <a href="mailto:cronosport.arg@gmail.com" className="font-semibold text-coral hover:underline">
            cronosport.arg@gmail.com
          </a>
        </p>

        <Link to="/" className="btn-secondary mt-8 inline-flex">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
